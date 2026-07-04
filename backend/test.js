import { chromium } from 'playwright';
import { load } from 'cheerio';

async function playwrightTest() {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://unstop.com/internship');

  await page.waitForTimeout(5000);

  const html = await page.content();

  const $ = load(html);
  const title = $('h3.double-wrap').text().trim();
  const company = $('p.single-wrap').text().trim();
  console.log($('h3.double-wrap').length);
  console.log(title, '\n', company);

  await browser.close();
}

playwrightTest();
