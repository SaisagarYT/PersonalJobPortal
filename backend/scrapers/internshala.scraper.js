import axios from 'axios';
import { load } from 'cheerio';
import playwright from 'playwright';
import BaseScraper from './base.scraper.js';

class IntershalaScraper extends BaseScraper {
  constructor() {
    super('internshala');
    this.baseUrl = 'https://internshala.com';
  }

  /**
   * Scrape internships from Internshala
   * @param {Object} filters - { type: 'internship'|'job', location, category, page }
   */
  async scrape(filters = {}) {
    try {
      const { type = 'internship', location = '', category = '', page = 1 } = filters;

      // Try API first (Internshala may have internal APIs)
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
   * Attempt to scrape via Internshala's internal API
   * Instructions: Open Chrome DevTools -> Network tab -> Filter by XHR
   * Look for API calls when browsing internships
   */
  async scrapeViaAPI(type, location, category, page) {
    try {
      // Common Internshala API patterns (need to verify actual endpoints)
      const apiEndpoint = `${this.baseUrl}/api/${type}s/search`;

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
        },
        timeout: 10000,
      });

      if (response.data && response.data.internships) {
        return response.data.internships;
      }

      return [];
    } catch (error) {
      console.log(`[${this.source}] API scraping failed, will try HTML:`, error.message);
      return [];
    }
  }

  /**
   * Scrape via HTML parsing with Playwright
   */
  async scrapeViaHTML(type, location, category, page) {
    const browser = await playwright.chromium.launch({
      headless: true,
    });

    try {
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const playwrightPage = await context.newPage();

      // Normalize type to its plural slug (internship -> internships, job -> jobs)
      const typeSlug = type.replace(/s$/, '') + 's';

      // Build URL based on filters
      let url = `${this.baseUrl}/${typeSlug}`;
      const params = [];
      if (location) params.push(`location=${encodeURIComponent(location)}`);
      if (category) params.push(`category=${encodeURIComponent(category)}`);
      if (page > 1) params.push(`page=${page}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      console.log(`[${this.source}] Fetching: ${url}`);

      await playwrightPage.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Poll for internship cards (they may be behind a login modal overlay)
      let cardCount = 0;
      for (let attempt = 0; attempt < 10; attempt++) {
        cardCount = await playwrightPage.evaluate(
          /* eslint-disable-next-line no-undef */
          () => document.querySelectorAll('.individual_internship').length
        );
        if (cardCount > 0) break;
        await playwrightPage.waitForTimeout(1000);
      }

      if (cardCount === 0) {
        throw new Error('No internship cards found on page after waiting');
      }

      const html = await playwrightPage.content();
      const $ = load(html);

      const opportunities = [];

      $('.individual_internship').each((i, el) => {
        const $card = $(el);

        const internshipId =
          $card.attr('internshipid') ||
          $card.attr('id')?.replace('individual_internship_', '') ||
          `internshala_${i}`;
        const href = $card.attr('data-href') || $card.find('a.job-title-href').attr('href') || '';

        const opportunity = {
          external_id: internshipId,
          title: $card.find('.job-internship-name a, a.job-title-href').first().text().trim(),
          company_name: $card.find('p.company-name').first().text().trim(),
          company_logo: $card.find('.internship_logo img').attr('src') || '',
          location: $card.find('.locations span a, .locations span').text().trim(),
          stipend: $card.find('span.stipend').text().trim(),
          duration: $card
            .find('.row-1-item span')
            .filter((_, el) => /month|week|day/i.test($(el).text()))
            .first()
            .text()
            .trim(),
          posted_date: $card
            .find('.status-inactive span, .status-active span')
            .first()
            .text()
            .trim(),
          apply_url: href ? this.baseUrl + href : '',
          skills: [],
          description: $card.find('.about_job .text').text().trim(),
        };

        $card.find('.job_skill').each((j, skillEl) => {
          const skill = $(skillEl).text().trim();
          if (skill) opportunity.skills.push(skill);
        });

        if (opportunity.title) opportunities.push(opportunity);
      });

      await browser.close();
      return opportunities;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  /**
   * Adapt Internshala data to unified model
   */
  adaptToUnifiedModel(rawData) {
    // Parse stipend
    const stipendMatch = rawData.stipend?.match(/₹?\s*([\d,]+)\s*-?\s*([\d,]*)/);
    const minStipend = stipendMatch ? parseInt(stipendMatch[1].replace(/,/g, '')) : 0;
    const maxStipend = stipendMatch?.[2] ? parseInt(stipendMatch[2].replace(/,/g, '')) : minStipend;

    // Parse duration
    const durationMatch = rawData.duration?.match(/(\d+)\s*(month|week|day)/i);
    const durationValue = durationMatch ? parseInt(durationMatch[1]) : 0;
    const durationUnit = durationMatch ? durationMatch[2].toLowerCase() + 's' : 'months';

    return {
      external_id: rawData.external_id || rawData.id,
      source: this.source,
      source_url: rawData.apply_url || '',
      title: rawData.title || rawData.profile || '',
      type: rawData.type || 'internship',
      company: {
        name: rawData.company_name || rawData.company || '',
        logo: rawData.company_logo || '',
        website: '',
      },
      description: rawData.description || '',
      short_description: rawData.description?.substring(0, 200) || '',
      compensation: {
        min: minStipend,
        max: maxStipend || minStipend,
        currency: 'INR',
        type: 'monthly',
        is_paid: minStipend > 0,
      },
      locations: [
        {
          city: rawData.location || '',
          state: '',
          country: 'India',
          is_remote: rawData.location?.toLowerCase().includes('remote') || false,
        },
      ],
      skills: rawData.skills || [],
      experience: {
        min: 0,
        max: 0,
        level: 'fresher',
      },
      employment_type: rawData.type === 'job' ? 'full-time' : 'internship',
      duration: {
        value: durationValue,
        unit: durationUnit,
      },
      application: {
        deadline: rawData.deadline || '',
        applicants_count: rawData.applicants_count || 0,
        is_active: true,
        apply_url: rawData.apply_url || '',
      },
      posted_date: rawData.posted_date || new Date().toISOString(),
      approved_date: rawData.posted_date || new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      categories: rawData.category ? [rawData.category] : [],
      tags: [],
    };
  }

  /**
   * Get detailed info for a specific internship
   */
  async getDetails(internshipId) {
    try {
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${this.baseUrl}/internship/detail/${internshipId}`, {
        waitUntil: 'networkidle',
      });

      const html = await page.content();
      const $ = load(html);

      const details = {
        external_id: internshipId,
        title: $('.heading_4_5').text().trim(),
        company_name: $('.link_display_like_text').text().trim(),
        description: $('.text-container').text().trim(),
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

export default IntershalaScraper;
