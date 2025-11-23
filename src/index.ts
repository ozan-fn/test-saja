import puppeteer from "puppeteer-core";
import fs from "fs";
import { clickElement } from "./helpers";

export async function generateImage(imagePath: string, prompt: string): Promise<Buffer | null> {
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "C:\\Users\\hp_5c\\Downloads\\chrome-win\\chrome.exe",
        headless: process.env.HEADLESS === "true" ? true : false,
        args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--no-first-run"],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 OPR/123.0.0.0");

        if (fs.existsSync("cookies.json")) {
            const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf-8"));
            await page.setCookie(...cookies);
            console.log("Cookies loaded from cookies.json");
        }

        const url = Buffer.from("aHR0cHM6Ly9haXN0dWRpby5nb29nbGUuY29tL3Byb21wdHMvbmV3X2NoYXQ/bW9kZWw9Z2VtaW5pLTIuNS1mbGFzaC1pbWFnZQ==", "base64").toString("utf8");

        await page.goto(url);

        try {
            await page.waitForSelector("button.ms-button-primary", { timeout: 5000 });
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll("button.ms-button-primary"));
                const gotItButton = buttons.find((btn) => btn.textContent?.trim() === "Got it");
                if (gotItButton) {
                    (gotItButton as HTMLElement).click();
                }
            });
        } catch (error) {
            console.log("Got it button not found, skipping");
        }

        let uploadVisible = false;
        do {
            try {
                await page.waitForSelector('button[aria-label="Upload File"]', { visible: true, timeout: 1000 });
                uploadVisible = true;
            } catch {
                await clickElement(page, 'button[iconname="add_circle"]', { delay: 500 });
            }
        } while (!uploadVisible);

        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(), //
            clickElement(page, 'button[aria-label="Upload File"]', { delay: 300 }),
        ]);
        await fileChooser.accept([imagePath]);

        await page.type('textarea[aria-label="Type something or tab to choose an example prompt"]', prompt);

        await clickElement(page, 'button[aria-label="Run"]');

        try {
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="false"]', { visible: true, timeout: 40000 });
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="true"]', { visible: true, timeout: 40000 });
        } catch (error) {
            /* ignore */
        }

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
            console.log("Image generated successfully");
            return Buffer.from(base64Data, "base64");
        }

        console.log("No base64 image found");
        return null;
    } finally {
        await browser.close();
    }
}
