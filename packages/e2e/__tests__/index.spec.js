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

    it('should load without error', async () => {
      const text = await page.evaluate(() => document.body.textContent);
      expect(text).to.contain("google")
    });

    after( async function(){
      await browser.close();
    })
  },
  timeout,
);

