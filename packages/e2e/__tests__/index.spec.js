const timeout = 5000;
const puppeteer = require("puppeteer-core")

describe(
  '/ (Home Page)',
  () => {
    let page;
    let browser;
    beforeAll(async () => {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: "/usr/bin/brave-browser"
      })
      page = await browser.newPage();
      await page.goto('https://google.com');
    }, timeout);

    it('should load without error', async () => {
      const text = await page.evaluate(() => document.body.textContent);
      expect(text).toContain('google');
    });

    afterAll( async() => {
      await browser.close()
    })
  },
  timeout,
);

