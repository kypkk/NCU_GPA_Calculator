import puppeteer from "puppeteer-extra";
import RecaptchaPlugin from "puppeteer-extra-plugin-recaptcha";
import * as cheerio from "cheerio";
import * as dotenv from "dotenv";
dotenv.config();

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: process.env.TWO_CAPTACH_APIKEY, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(
    "https://cis.ncu.edu.tw/iNCU/academic/register/transcriptQuery?groupName=wpsNone&systemId=124&loginName=00340176009601C500340079009600EB01A20176005800EB&sn=789204639&verifyName=MTA5MjAxNTIx"
  );

  await page.solveRecaptchas();
  await page.type("#inputAccount", process.env.NCU_ACCOUNT);
  await page.type("#inputPassword", process.env.NCU_PASSWORD);
  await Promise.all([
    page.waitForNavigation(),
    await page.click("button.btn-primary"),
  ]);

  await Promise.all([
    page.waitForNavigation(),
    await page.click("button.btn-primary"),
  ]);

  let body = await page.content();
  let $ = await cheerio.load(body);

  $(
    "body > div.container-fluid.mainContent > div > div:nth-child(4) > table > tbody > tr > td:nth-child(7) > span"
  ).each((i, elem) => {
    console.log($(elem).text());
  });
  await page.screenshot({ path: "Score.jpg" });

  await browser.close();
})();
