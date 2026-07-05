import axios from 'axios';
import { load } from 'cheerio';
import playwright from 'playwright';
import BaseScraper from './base.scraper.js';

class ApnaScraper extends BaseScraper {
  constructor() {
    super('apna');
    this.baseUrl = 'https://apna.co';
  }

  /**
   * Scrape jobs from Apna
   * @param {Object} filters - { type: 'job', location, category, page }
   */
  async scrape(filters = {}) {
    try {
      const { type = 'job', location = '', category = '', page = 1 } = filters;

      // Try API first (Apna may have internal APIs)
      const opportunities = await this.scrapeViaAPI(type, location, category, page);

      if (opportunities.length > 0) {
        this.logSuccess(opportunities.length);
        return {
          success: true,
          source: this.source,
          opportunities: opportunities.map((opp) => this.adaptToUnifiedModel(opp)),
          count: opportunities.length,
        };
      }

      // Fallback to HTML scraping if API fails
      const htmlOpportunities = await this.scrapeViaHTML(type, location, category, page);
      this.logSuccess(htmlOpportunities.length);

      return {
        success: true,
        source: this.source,
        opportunities: htmlOpportunities.map((opp) => this.adaptToUnifiedModel(opp)),
        count: htmlOpportunities.length,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Attempt to scrape via Apna's internal API
   * Common patterns to check:
   * - https://apna.co/api/jobs
   * - https://apna.co/api/v1/jobs/search
   * - GraphQL endpoint
   */
  async scrapeViaAPI(type, location, category, page) {
    try {
      // Common Apna API patterns (need to verify actual endpoints)
      // Check Chrome DevTools -> Network -> XHR when browsing apna.co
      const apiEndpoint = `${this.baseUrl}/api/jobs`;

      const response = await axios.get(apiEndpoint, {
        params: {
          location,
          category,
          page,
          per_page: 20,
        },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      if (response.data && response.data.jobs) {
        return response.data.jobs;
      }

      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.log(`[${this.source}] API scraping failed, will try HTML:`, error.message);
      return [];
    }
  }

  /**
   * Scrape via HTML parsing with Playwright
   * Apna uses React/Next.js SSR — job listing page only shows 2 SSR jobs.
   * We trigger the search input to load the full listing dynamically.
   */
  async scrapeViaHTML(type, location, category, _page) {
    const browser = await playwright.chromium.launch({
      headless: true,
    });

    try {
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const playwrightPage = await context.newPage();

      console.log(`[${this.source}] Fetching: ${this.baseUrl}/jobs`);

      await playwrightPage.goto(`${this.baseUrl}/jobs`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Type into the search box to trigger job listing (page shows only 2 SSR stubs otherwise)
      const searchQuery = category || location || type || 'jobs';
      try {
        await playwrightPage.click('input[placeholder="Search"]', { timeout: 5000 });
        await playwrightPage.type('input[placeholder="Search"]', searchQuery, { delay: 50 });
        await playwrightPage.waitForTimeout(3000);
      } catch {
        // If search interaction fails, proceed with whatever is rendered
      }

      const html = await playwrightPage.content();
      const $ = load(html);

      const opportunities = [];

      // Apna uses data-testid attributes on job cards
      $('[data-testid="job-card"]').each((i, el) => {
        const $card = $(el);
        const $link = $card.closest('a');
        const href = $link.attr('href') || '';

        // Extract job ID from URL pattern: /job/city/title-ID
        const idMatch = href.match(/-(\d+)$/);
        if (!idMatch) return; // skip cards with no parseable ID

        const externalId = idMatch[1];

        const opportunity = {
          external_id: externalId,
          title: $card.find('[data-testid="job-title"]').text().trim(),
          company_name: $card.find('[data-testid="company-title"]').text().trim(),
          company_logo: $card.find('img[alt="company-logo"]').attr('src') || '',
          location: $card.find('[data-testid="job-location"]').text().trim(),
          salary: $card.find('[data-testid="job-salary"]').text().trim(),
          experience: $card.find('[data-testid="job-experience"]').text().trim() || '',
          job_type: type || 'job',
          posted_date:
            $card.find('time, [data-testid*="date"], [data-testid*="posted"]').text().trim() || '',
          apply_url: href ? this.baseUrl + href : '',
          skills: [],
          description: '',
        };

        // Extract job tags (each tag div contains an img + p with the label)
        const seen = new Set();
        $card.find('[data-testid="job-tags-info"] p').each((j, tagEl) => {
          const tag = $(tagEl).text().trim();
          if (tag && tag.length > 1 && tag.length < 40 && !seen.has(tag)) {
            seen.add(tag);
            opportunity.skills.push(tag);
          }
        });

        if (opportunity.title) {
          opportunities.push(opportunity);
        }
      });

      await browser.close();
      console.log(`[${this.source}] Extracted ${opportunities.length} opportunities from HTML`);
      return opportunities;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Adapt Apna data to unified model
   */
  adaptToUnifiedModel(rawData) {
    // Parse salary
    const salaryMatch = rawData.salary?.match(/₹?\s*([\d,]+)\s*-?\s*([\d,]*)/);
    const minSalary = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, '')) : 0;
    const maxSalary = salaryMatch?.[2] ? parseInt(salaryMatch[2].replace(/,/g, '')) : minSalary;

    // Parse experience
    const experienceMatch = rawData.experience?.match(/(\d+)/);
    const minExperience = experienceMatch ? parseInt(experienceMatch[1]) : 0;

    // Determine experience level
    let experienceLevel = 'fresher';
    if (minExperience >= 5) {
      experienceLevel = 'expert';
    } else if (minExperience >= 2) {
      experienceLevel = 'intermediate';
    }

    // Clean location
    const locationText = rawData.location || '';
    const isRemote =
      locationText.toLowerCase().includes('remote') ||
      locationText.toLowerCase().includes('work from home');

    return {
      external_id: String(rawData.external_id || rawData.id || ''),
      source: this.source,
      source_url: rawData.apply_url || '',
      title: rawData.title || rawData.job_title || '',
      type: rawData.type || 'job',
      company: {
        name: rawData.company_name || rawData.company || rawData.employer || '',
        logo: rawData.company_logo || '',
        website: '',
      },
      description: rawData.description || '',
      short_description: (rawData.description || '').substring(0, 200),
      compensation: {
        min: minSalary,
        max: maxSalary || minSalary,
        currency: 'INR',
        type: 'monthly',
        is_paid: minSalary > 0,
      },
      locations: [
        {
          city: locationText.replace(/remote|work from home/gi, '').trim(),
          state: '',
          country: 'India',
          is_remote: isRemote,
        },
      ],
      skills: rawData.skills || [],
      experience: {
        min: minExperience,
        max: minExperience,
        level: experienceLevel,
      },
      employment_type: this.normalizeJobType(rawData.job_type || rawData.employment_type || ''),
      duration: {
        value: 0,
        unit: 'months',
      },
      application: {
        deadline: rawData.deadline || '',
        applicants_count: rawData.applicants_count || 0,
        is_active: true,
        apply_url: rawData.apply_url || '',
      },
      posted_date: this.normalizeDate(rawData.posted_date) || new Date().toISOString(),
      approved_date: this.normalizeDate(rawData.posted_date) || new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      categories: rawData.category ? [rawData.category] : [],
      tags: [],
    };
  }

  /**
   * Normalize job type strings
   */
  normalizeJobType(jobType) {
    const typeStr = jobType.toLowerCase();
    if (typeStr.includes('full')) return 'full-time';
    if (typeStr.includes('part')) return 'part-time';
    if (typeStr.includes('contract')) return 'contract';
    if (typeStr.includes('freelance')) return 'freelance';
    if (typeStr.includes('intern')) return 'internship';
    return 'full-time'; // default
  }

  /**
   * Normalize date strings
   */
  normalizeDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Handle relative dates like "2 days ago", "1 week ago"
      const relativeMatch = dateStr.match(/(\d+)\s*(day|week|month|hour)s?\s*ago/i);
      if (relativeMatch) {
        const value = parseInt(relativeMatch[1]);
        const unit = relativeMatch[2].toLowerCase();
        const date = new Date();

        switch (unit) {
          case 'hour':
            date.setHours(date.getHours() - value);
            break;
          case 'day':
            date.setDate(date.getDate() - value);
            break;
          case 'week':
            date.setDate(date.getDate() - value * 7);
            break;
          case 'month':
            date.setMonth(date.getMonth() - value);
            break;
        }

        return date.toISOString();
      }

      // Try parsing as regular date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      console.error(`[${this.source}] Failed to parse date: ${dateStr}`);
    }

    return null;
  }

  /**
   * Get detailed info for a specific job
   */
  async getDetails(jobId) {
    try {
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${this.baseUrl}/jobs/${jobId}`, {
        waitUntil: 'networkidle',
      });

      const html = await page.content();
      const $ = load(html);

      const details = {
        external_id: jobId,
        title: $('h1, .job-title').first().text().trim(),
        company_name: $('.company-name, .employer').first().text().trim(),
        description: $('.job-description, .description').first().text().trim(),
        // Add more detail extraction as needed
      };

      await browser.close();
      return details;
    } catch (error) {
      console.error(`[${this.source}] Failed to get details:`, error.message);
      return null;
    }
  }
}

export default ApnaScraper;
