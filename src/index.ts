import puppeteer, { FileChooser, Page, Browser } from "puppeteer-core";
import fs from "fs";
import { clickElement } from "./helpers";

// Global browser instance
let browser: Browser | null = null;

// Initialize browser
async function initBrowser() {
    if (!browser) {
        const proxies = JSON.parse(fs.readFileSync("proxies.json", "utf-8"));
        const proxy = proxies.proxies[0];
        const proxyServer = `${proxy.host}:${proxy.port}`;

        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            headless: process.env.HEADLESS === "true" ? true : false,
            args: ["--disable-blink-features=AutomationControlled", `--proxy-server=${proxyServer}`, "--no-sandbox", "--disable-setuid-sandbox"],
            userDataDir: "./user-data",
        });
    }
}

// Function to perform Google login
async function performLogin(page: Page) {
    console.log("Performing login...");

    // Enter email
    await page.type('input[type="email"]', "2586ozan");
    await clickElement(page, "#identifierNext");

    // Wait for password field
    await page.waitForSelector('input[name="Passwd"]', { timeout: 10000, visible: true });
    await page.type('input[name="Passwd"]', "20050806");
    await clickElement(page, "#passwordNext", { delay: 700 });

    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 });
    console.log("Login successful");
}

export async function generateImage(imagePath: string, prompt: string): Promise<Buffer | null> {
    await initBrowser();
    if (!browser) {
        throw new Error("Failed to initialize browser");
    }

    const page = await browser.newPage();
    const proxies = JSON.parse(fs.readFileSync("proxies.json", "utf-8"));
    const proxy = proxies.proxies[0];

    const url = Buffer.from("aHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL3Byb21wdHMvbmV3X2NoYXQ/bW9kZWw9Z2VtaW5pLTIuNS1mbGFzaC1pbWFnZQ==", "base64").toString("utf8");

    await page.authenticate({ username: proxy.username, password: proxy.password });
    await page.goto(url);

    try {
        await page.waitForSelector('input[type="email"]', { timeout: 5000, visible: true });
        await performLogin(page);

        await clickElement(page, 'button[iconname="add_circle"]');
    } catch (e) {
        console.log("No login required");
    }

    await clickElement(page, 'button[iconname="add_circle"]');

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
    await page.waitForSelector(".stoppable-spinner", { hidden: true });

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
        return null;
    }
}
