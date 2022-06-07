import { expect } from "chai";
import puppeteer, {Browser, Page} from "puppeteer";


describe("Metamask Adapter testing using Puppeteer", () => {
    let browser: Browser;
    let page: Page;

    beforeEach(async () => {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/brave-browser"
        })
        page = await browser.newPage();
        await page.goto("http://localhost:3000/connector/metamask_adapter");
    });

    afterEach(async () => {
        await browser.close();
    });

    it("should have toolset property", async () => {
        const toolset = await page.evaluate(async () => {
            return (window as any).toolset;
        });
        expect(toolset).to.have.property("adapterClass")
    });

    
});