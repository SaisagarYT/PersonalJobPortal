import axios from 'axios';
import playwright from 'playwright';
import { load } from 'cheerio';

const unstopJobScraper = async (page, pagination, roles, userType) => {
  const response = await axios.get(
    `https://unstop.com/api/public/opportunity/search-result?opportunity=jobs&page=${page}&per_page=${pagination}&roles=${roles}&usertype=${userType}&oppstatus=open&sortBy=&orderBy=&filter_condition=&undefined=true`
  );
  return response.data;
};

const unstopInternshipScraper = async (page, pagination, roles, userType) => {
  const response = await axios.get(
    `https://unstop.com/api/public/opportunity/search-result?opportunity=internships&page=${page}&per_page=${pagination}&roles=${roles}&usertype=${userType}&oppstatus=open&sortBy=&orderBy=&filter_condition=&undefined=true`
  );
  return response.data;
};

const unstopCompetitionScraper = async (page, pagination, roles, userType) => {
  const response = await axios.get(
    `https://unstop.com/api/public/opportunity/search-result?opportunity=competitions&page=${page}&per_page=${pagination}&roles=${roles}&usertype=${userType}&oppstatus=open&sortBy=&orderBy=&filter_condition=&undefined=true`
  );
  return response.data;
};

const unstopJobScraperOverview = async (id) => {
  try {
    const browser = await playwright.chromium.launch();

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`https://unstop.com/jobs/${id}`, {
      waitUntil: 'networkidle',
    });
    await page.screenshot({
      path: `nodejs_chromium.png`,
      fullPage: true,
    });
    const html = await page.content();

    const $ = load(html);
    const obj = {};
    obj['title'] = $('.my_sect h1').text().trim();
    obj['short_url'] = '';
    obj['company_name'] = $('.my_sect h2 a').text().trim();
    obj['company_logo'] = $('.logo img').attr('src');
    obj['city'] = $('.interlinked-value em').text().trim();
    obj['description'] = $('.comp-detail.un_editor_text_live').text().trim().replace(/\s+/g, ' ');
    $('.item > .cptn >h3').each((i, el) => console.log($(el)));
    // obj['status'] = $('');
    // obj['currency'] = $('');
    // obj['type'] = $('');
    // obj['timing'] = $('');
    // obj['payment_type'] = $('');
    // obj['end_date'] = $('');
    // obj['approved_date'] = $('');
    // obj['register_count'] = $('');
    // obj['created_at'] = $('');
    await browser.close();
    console.log(obj);
    return obj;
  } catch (err) {
    console.log(err.message);
    return err.message;
  }
};

export default {
  unstopJobScraper,
  unstopInternshipScraper,
  unstopCompetitionScraper,
  unstopJobScraperOverview,
};
