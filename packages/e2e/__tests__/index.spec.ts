import { expect } from "chai";
import puppeteer, {Browser, Page} from "puppeteer";

describe("Duck Duck Go search using basic Puppeteer", () => {
    let browser: Browser;
    let page: Page;

    beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/brave-browser"
        })
        page = await browser.newPage();
        await page.goto("https://duckduckgo.com");
    });

    afterEach(async () => {
        await browser.close();
    });

    it("should have the correct page title", async () => {
        expect(await page.title()).to.eql("DuckDuckGo — Privacy, simplified.");
    });

});