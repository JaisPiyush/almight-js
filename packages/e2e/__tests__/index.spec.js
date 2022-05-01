const timeout = 5000;
const puppeteer = require("puppeteer-core")
const {expect} = require("chai");

describe(
  '/ (Home Page)',
  () => {
    let page;
    let browser;
    before(async function(){
      this.timeout(timeout);
      browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/brave-browser"
      })
      page = await browser.newPage();
      await page.goto('https://google.com');
    });

    it('should load without error', async function(){
      const text = await page.evaluate(() => document.body.textContent);
      expect(text).to.contain("google");
    });
    it("checking existance of extensions", async function(){
      const ethereumExists = await page.evaluate(() => {
        return ethereum !== undefined;
      });
      expect(ethereumExists).to.be.true;
    })

    after( async function(){
      await browser.close();
    })
  },
  timeout,
);

