import axios from 'axios';
import playwright from 'playwright';
import { load } from 'cheerio';
import BaseScraper from './base.scraper.js';

class UnstopScraper extends BaseScraper {
  constructor() {
    super('unstop');
    this.baseUrl = 'https://unstop.com/api/public/opportunity/search-result';
  }

  /**
   * Scrape opportunities from Unstop
   * @param {Object} filters - { type: 'jobs'|'internships'|'competitions', page, pagination, roles, userType }
   */
  async scrape(filters = {}) {
    try {
      const {
        type = 'internships',
        page = 1,
        pagination = 18,
        roles = 'ai-engineer',
        userType = 'students',
      } = filters;

      // Normalize type to plural for Unstop API
      let unstopType = type.toLowerCase();
      if (!unstopType.endsWith('s')) {
        unstopType += 's'; // internship -> internships, job -> jobs
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          opportunity: unstopType,
          page,
          per_page: pagination,
          roles,
          usertype: userType,
          oppstatus: 'open',
          sortBy: '',
          orderBy: '',
          filter_condition: '',
          undefined: true,
        },
        timeout: 10000,
      });

      if (!response.data || !response.data.data || !response.data.data.data) {
        throw new Error('Invalid response from Unstop API');
      }

      const opportunities = response.data.data.data;
      this.logSuccess(opportunities.length);

      // Pass the normalized type so adaptToUnifiedModel can use it for consistent typing
      const normalizedType = unstopType.replace(/s$/, ''); // internships -> internship

      return {
        success: true,
        source: this.source,
        opportunities: opportunities.map((opp) => this.adaptToUnifiedModel(opp, normalizedType)),
        count: opportunities.length,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Adapt Unstop data to unified model
   */
  adaptToUnifiedModel(rawData, requestedType = 'internship') {
    return {
      external_id: String(rawData.id),
      source: this.source,
      source_url: rawData.short_url || '',
      title: rawData.title || '',
      type: requestedType,
      company: {
        name: rawData.organisation?.name || '',
        logo: rawData.organisation?.logoUrl || '',
        website: '',
      },
      description: load(rawData.details).text().trim() || '',
      short_description: load(rawData.details).text().trim().substring(0, 200) || '',
      compensation: {
        min: rawData.jobDetail?.min_salary || 0,
        max: rawData.jobDetail?.max_salary || rawData.jobDetail?.min_salary || 0,
        currency: 'INR',
        type: rawData.jobDetail?.pay_in || 'monthly',
        is_paid: rawData.jobDetail?.paid_unpaid === 'paid',
      },
      locations:
        rawData.locations?.map((loc) => ({
          city: loc.city || '',
          state: loc.state || '',
          country: loc.country || 'India',
          is_remote: loc.city?.toLowerCase().includes('remote') || false,
        })) || [],
      skills: rawData.required_skills?.map((skill) => skill.skill) || [],
      experience: {
        min: 0,
        max: 0,
        level: 'fresher',
      },
      employment_type: rawData.jobDetail?.type || 'full-time',
      duration: {
        value: 0,
        unit: 'months',
      },
      application: {
        deadline: rawData.end_date || '',
        applicants_count: rawData.registerCount || 0,
        is_active: rawData.status === 'open',
        apply_url: rawData.short_url || '',
      },
      posted_date: rawData.approved_date || new Date().toISOString(),
      approved_date: rawData.approved_date || '',
      fetched_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      categories: rawData.workfunction?.map((w) => w.name) || [],
      tags: rawData.filters?.map((f) => f.name) || [],
    };
  }

  /**
   * Get detailed overview of a specific opportunity
   */
  async getDetails(opportunityId) {
    try {
      const browser = await playwright.chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`https://unstop.com/jobs/${opportunityId}`, {
        waitUntil: 'networkidle',
      });

      const html = await page.content();
      const $ = load(html);

      const details = {
        external_id: opportunityId,
        title: $('.my_sect h1').text().trim(),
        company_name: $('.my_sect h2 a').text().trim(),
        company_logo: $('.logo img').attr('src'),
        city: $('.interlinked-value em').text().trim(),
        description: $('.comp-detail.un_editor_text_live').text().trim().replace(/\s+/g, ' '),
      };

      await browser.close();
      return details;
    } catch (error) {
      console.error(`[${this.source}] Failed to get details:`, error.message);
      return null;
    }
  }
}

export default UnstopScraper;
