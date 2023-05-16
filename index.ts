/* import dependencies
   -------------------------------------------------------------------------------
   puppeteer-extra -- acts like a browser
   puppeteer-extra-plugin-recaptcha -- help solves reCAPTCHA when using puppeteer
   cheerio -- helps with parsing HTML
   dotenv -- helps with loading .env files
--------------------------------------------------------------------------------*/

const puppeteer = require("puppeteer-extra");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
dotenv.config(); // dotenv configuration

// puppeteer Recaptcha Plugin Configuration
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: process.env.TWO_CAPTCHA_APIKEY, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
    },
    visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

// interface of score and credit object
interface ResolveObj {
  score_array: string[];
  credit_array: string[];
}

// interface of gpa_credit object
interface GPA_credit_obj {
  GPA_4: number;
  GPA_4_3: number;
  credit: number;
}

// get all scores and credits using puppeteer as a headless browser and cheerio to parse the HTML
const get_ScoresANDCredits = async (): Promise<ResolveObj> => {
  const score_array: string[] = [];
  const credit_array: string[] = [];

  const browser = await puppeteer.launch({ headless: "new" }); // launch headless browser
  const page = await browser.newPage(); // open new page

  let status = true; // check if the final score and credit array are the same length

  // Get to the page of scores and credits
  await page.goto(
    "https://cis.ncu.edu.tw/iNCU/academic/register/transcriptQuery?groupName=wpsNone&systemId=124&loginName=00340176009601C500340079009600EB01A20176005800EB&sn=789204639&verifyName=MTA5MjAxNTIx"
  );

  /* login state
     1. solve the reCAPTCHAs
     2. enter account and password
     3. click login button
     4. click Goto button
  */
  await page.solveRecaptchas();
  if (process.env.NCU_ACCOUNT && process.env.NCU_PASSWORD) {
    await page.type("#inputAccount", process.env.NCU_ACCOUNT);
    await page.type("#inputPassword", process.env.NCU_PASSWORD);
  }
  await Promise.all([
    page.waitForNavigation(),
    await page.click("button.btn-primary"),
  ]);

  await Promise.all([
    page.waitForNavigation(),
    await page.click("button.btn-primary"),
  ]);

  /* This is the part when you finally get to the scores and credits page
    1. use cheerio to parse the HTML body
    2. get all the scores and credits by selectors and push them into the score_array and credit_array arrays
  */
  let body = await page.content();
  let $ = await cheerio.load(body);

  $(
    "body > div.container-fluid.mainContent > div > div:nth-child(4) > table > tbody > tr > td:nth-child(7) > span"
  ).each((i, elem) => {
    score_array.push($(elem).text());
  });

  $(
    "body > div.container-fluid.mainContent > div > div:nth-child(4) > table > tbody > tr > td:nth-child(6)"
  ).each((i, elem) => {
    credit_array.push($(elem).text());
  });

  await browser.close();

  // check if the score and credit arrays are the same length
  if (score_array.length !== credit_array.length) {
    status = false;
  }

  // return the score and credit arrays if status is true
  return new Promise<ResolveObj>((resolve, reject) => {
    if (status) resolve({ score_array, credit_array });
    else reject({ msg: "you didn't get the score or the course credit" });
  });
};

// Convert the score and credit array into GPA Credit objects array
const convert_GPA_credit = async (
  res: ResolveObj
): Promise<GPA_credit_obj[]> => {
  const GPA_credit_array: GPA_credit_obj[] = [];

  for (let i = 0; i < res.score_array.length; i++) {
    if (
      !(
        res.score_array[i].includes("未到") ||
        res.score_array[i].includes("停修") ||
        res.score_array[i].includes("勞動服務通過") ||
        res.score_array[i].includes("一般課程通過") ||
        res.credit_array[i].includes("-")
      )
    ) {
      // Convert the scores into gpa_4 and gpa_4.3
      var score = parseFloat(res.score_array[i]);
      var GPA_4: number;
      var GPA_4_3: number;
      var credit: number = parseInt(res.credit_array[i]);

      if (score >= 80) GPA_4 = 4;
      else if (score >= 70) GPA_4 = 3;
      else if (score >= 60) GPA_4 = 2;
      else if (score > 1) GPA_4 = 1;
      else GPA_4 = 0;

      if (score >= 90) GPA_4_3 = 4.3;
      else if (score >= 85) GPA_4_3 = 4;
      else if (score >= 80) GPA_4_3 = 3.7;
      else if (score >= 77) GPA_4_3 = 3.3;
      else if (score >= 73) GPA_4_3 = 3;
      else if (score >= 70) GPA_4_3 = 2.7;
      else if (score >= 67) GPA_4_3 = 2.3;
      else if (score >= 63) GPA_4_3 = 2;
      else if (score >= 60) GPA_4_3 = 1.7;
      else if (score >= 50) GPA_4_3 = 1;
      else GPA_4_3 = 0;

      // push gpa_credit_obj into GPA_credit_array
      var GPA_credit_obj = { GPA_4, GPA_4_3, credit };
      if (credit) {
        // console.log(`score: ${score}, credit: ${credit}`);
        GPA_credit_array.push(GPA_credit_obj);
      }
    }
  }
  return new Promise<GPA_credit_obj[]>((resolve, reject) => {
    resolve(GPA_credit_array);
  });
};

const calculate_GPA = async (res: GPA_credit_obj[]) => {
  var total_credit = 0;
  var GPA_4 = 0;
  var GPA_4_3 = 0;
  for (let i = 0; i < res.length; i++) {
    GPA_4 += res[i].GPA_4 * res[i].credit;
    GPA_4_3 += res[i].GPA_4_3 * res[i].credit;
    total_credit += res[i].credit;
  }
  GPA_4 = parseFloat((GPA_4 / total_credit).toFixed(2));
  GPA_4_3 = parseFloat((GPA_4_3 / total_credit).toFixed(2));
  console.log(total_credit);
  console.log(`Your Overall GPA: ${GPA_4}/4, ${GPA_4_3}/4.3`);
};

get_ScoresANDCredits()
  .then((res) => {
    console.log("Converting scores into GPAs...........");
    console.log("--------------------------------------");
    return convert_GPA_credit(res);
  })
  .then((res) => {
    console.log("Calculating GPA.......................");
    console.log("--------------------------------------");
    calculate_GPA(res);
  })
  .catch((err) => {
    console.log(err.msg);
  });
