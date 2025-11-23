import { Page } from "puppeteer-core";

export async function clickElement(page: Page, selector: string, options: { timeout?: number; delay?: number } = {}) {
    await page.waitForSelector(selector, { visible: true, timeout: options.timeout || 10000 });
    if (options.delay) await new Promise((r) => setTimeout(r, options.delay));
    await page.click(selector);
}
