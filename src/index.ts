import { setupBrowserAndPage } from "./lib/puppeteer";
import { clickElement } from "./helpers";

export async function generateImage(imagePath: string, prompt: string): Promise<Buffer | null> {
    const { browser, page } = await setupBrowserAndPage();

    try {
        console.log("Opening file chooser...");
        const [fileChooser] = await Promise.all([
            page.waitForFileChooser(), //
            clickElement(page, 'button[aria-label="Upload File"]', { delay: 300 }),
        ]);
        console.log("Uploading image:", imagePath);
        await fileChooser.accept([imagePath]);
        console.log("Image uploaded successfully");

        console.log("Typing prompt:", prompt);
        await page.type('textarea[aria-label="Type something or tab to choose an example prompt"]', prompt);
        console.log("Prompt entered");

        console.log("Clicking Run button...");
        await clickElement(page, 'button[aria-label="Run"]');
        console.log("Run button clicked");

        console.log("Waiting for image generation...");
        try {
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="false"]', { visible: true, timeout: 40000 });
            await page.waitForSelector('button[aria-label="Run"][aria-disabled="true"]', { visible: true, timeout: 40000 });
            console.log("Generation completed");
        } catch (error) {
            console.log("Timeout waiting for generation, proceeding anyway...");
        }

        console.log("Extracting generated image...");
        const startTime = Date.now();
        while (Date.now() - startTime < 40000) {
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

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        console.log("Timeout: No image found");
        return null;
    } finally {
        // try {
        //     console.log("Saving cookies...");
        //     const pages = await browser.pages();
        //     const activePage = pages.find((p) => p.url().includes("aistudio.google.com"));
        //     if (activePage) {
        //         const cookies = await activePage.cookies();
        //         fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
        //         console.log("Cookies saved to cookies.json");
        //     }
        // } catch (error) {
        //     console.log("Failed to save cookies:", error);
        // }

        console.log("Closing browser...");
        await browser.close();
        console.log("Browser closed");
    }
}
