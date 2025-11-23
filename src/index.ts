import puppeteer, { FileChooser, Page, Browser } from "puppeteer-core";
import fs from "fs";
import { clickElement } from "./helpers";

// Global browser instance
let browser: Browser | null = null;

// Save browser data to files
async function saveBrowserData() {
    if (!browser) return;

    try {
        const pages = await browser.pages();
        const activePage = pages.find((p) => p.url().includes("aistudio.google.com"));

        let pageToUse: Page;
        if (activePage) {
            pageToUse = activePage;
        } else {
            pageToUse = await browser.newPage();
            const url = Buffer.from("aHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL3Byb21wdHMvbmV3X2NoYXQ/bW9kZWw9Z2VtaW5pLTIuNS1mbGFzaC1pbWFnZQ==", "base64").toString("utf8");
            await pageToUse.goto(url, { waitUntil: "networkidle2" });
        }

        // Save cookies
        const cookies = await pageToUse.cookies();
        fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
        console.log("Cookies saved to cookies.json");

        if (!activePage) {
            await pageToUse.close();
        }
    } catch (error) {
        console.error("Error saving browser data:", error);
    }
}

// Initialize browser
async function initBrowser() {
    if (!browser) {
        const proxies = JSON.parse(fs.readFileSync("proxies.json", "utf-8"));
        const proxy = proxies.proxies[0];
        const proxyServer = `${proxy.host}:${proxy.port}`;

        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            headless: process.env.HEADLESS === "true" ? true : false,
            args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-setuid-sandbox"],
            userDataDir: "./user-data",
        });
    }
}

export async function generateImage(imagePath: string, prompt: string): Promise<Buffer | null> {
    await initBrowser();
    if (!browser) {
        throw new Error("Failed to initialize browser");
    }

    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3");

    // Load cookies before navigating
    if (fs.existsSync("cookies.json")) {
        const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf-8"));
        await page.setCookie(...cookies);
        console.log("Cookies loaded from cookies.json");
    }

    const proxies = JSON.parse(fs.readFileSync("proxies.json", "utf-8"));
    const proxy = proxies.proxies[0];

    const url = Buffer.from("aHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL3Byb21wdHMvbmV3X2NoYXQ/bW9kZWw9Z2VtaW5pLTIuNS1mbGFzaC1pbWFnZQ==", "base64").toString("utf8");

    // await page.authenticate({ username: proxy.username, password: proxy.password });
    await page.goto(url);

    // await page.click('button[iconname="add_circle"]');
    await clickElement(page, 'button[iconname="add_circle"]', { delay: 500 });

    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(), //
        clickElement(page, 'button[aria-label="Upload File"]', { delay: 300 }),
    ]);
    await fileChooser.accept([imagePath]);

    await page.type(
        'textarea[aria-label="Type something or tab to choose an example prompt"]', //
        prompt
    );

    await clickElement(page, 'button[aria-label="Run"]');

    await page.waitForSelector(".stoppable-spinner", { hidden: false });
    await page.waitForSelector(".stoppable-spinner", { hidden: true, timeout: 240000 });

    const imgSrc = await page.evaluate(() => {
        const div = document.querySelector("div.chat-session-content");
        if (div && div.children.length > 1) {
            const secondLast = div.children[div.children.length - 2];
            const img = secondLast.querySelector("img");
            return img ? img.src : null;
        }
        return null;
    });

    if (imgSrc && imgSrc.startsWith("data:image/")) {
        const base64Data = imgSrc.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        console.log("Image generated successfully");
        await page.close();
        return buffer;
    } else {
        console.log("No base64 image found");
        await page.close();
        // await saveBrowserData();
        return null;
    }
}
