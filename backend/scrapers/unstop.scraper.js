import axios from 'axios';
import { load } from 'cheerio';
import BaseScraper from './base.scraper.js';

const ROLES = ['web-development', 'mobile-development', 'data-science', 'software-engineering'];
const TYPES = ['internships', 'jobs', 'competitions'];
const PER_PAGE = 20;
const MAX_PAGES = 10; // safety cap per role+type combo

class UnstopScraper extends BaseScraper {
  constructor() {
    super('unstop');
    this.baseUrl = 'https://unstop.com/api/public/opportunity/search-result';
  }

  /**
   * Fetch all pages for a single role+type until the API returns empty or errors.
   * Returns raw opportunity objects (not yet adapted).
   */
  async _fetchAllPages(type, role) {
    const all = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      try {
        const resp = await axios.get(this.baseUrl, {
          params: {
            opportunity: type,
            page,
            per_page: PER_PAGE,
            roles: role,
            usertype: 'students',
            oppstatus: 'open',
            sortBy: 'recent',
            orderBy: 'desc',
            filter_condition: '',
          },
          timeout: 12000,
        });

        const items = resp.data?.data?.data;
        if (!items || items.length === 0) break; // no more results

        all.push(...items);
        console.log(`[unstop] ${type}/${role} page ${page}: +${items.length} (total ${all.length})`);

        // If we got fewer than per_page, this is the last page
        if (items.length < PER_PAGE) break;
        page++;
      } catch (err) {
        console.warn(`[unstop] ${type}/${role} page ${page} failed: ${err.message} — stopping`);
        break;
      }
    }

    return all;
  }

  /**
   * Main scrape: collect all roles × types in parallel, deduplicate by id, adapt.
   */
  async scrape() {
    try {
      const tasks = [];
      for (const type of TYPES) {
        for (const role of ROLES) {
          tasks.push({ type, role });
        }
      }

      // Run all combos in parallel (12 tasks)
      const results = await Promise.all(
        tasks.map(({ type, role }) => this._fetchAllPages(type, role))
      );

      // Flatten and deduplicate by id
      const seen = new Set();
      const unique = [];
      for (const batch of results) {
        for (const item of batch) {
          const id = String(item.id);
          if (!seen.has(id)) {
            seen.add(id);
            unique.push(item);
          }
        }
      }

      console.log(`[unstop] Total unique after dedup: ${unique.length}`);
      this.logSuccess(unique.length);

      return {
        success: true,
        source: this.source,
        opportunities: unique.map((opp) => this.adaptToUnifiedModel(opp)),
        count: unique.length,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  adaptToUnifiedModel(rawData) {
    // Infer type from which Unstop category this belongs to
    const title = (rawData.title || '').toLowerCase();
    let type = 'job';
    if (rawData.opportunity_type === 'competition' || title.includes('hackathon') || title.includes('competition')) {
      type = 'competition';
    } else if (rawData.opportunity_type === 'internship' || rawData.jobDetail?.type === 'internship') {
      type = 'internship';
    }

    return {
      external_id: String(rawData.id),
      source: this.source,
      source_url: rawData.short_url || '',
      title: rawData.title || '',
      type,
      company: {
        name: rawData.organisation?.name || '',
        logo: rawData.organisation?.logoUrl || '',
        website: '',
      },
      description: rawData.details ? load(rawData.details).text().trim() : '',
      short_description: rawData.details
        ? load(rawData.details).text().trim().substring(0, 200)
        : '',
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
          is_remote: (loc.city || '').toLowerCase().includes('remote'),
        })) || [],
      skills: rawData.required_skills?.map((s) => s.skill) || [],
      experience: { min: 0, max: 0, level: 'fresher' },
      employment_type: this._normalizeEmploymentType(rawData.jobDetail?.type),
      duration: { value: 0, unit: 'months' },
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

  _normalizeEmploymentType(raw) {
    const t = (raw || '').toLowerCase();
    if (t.includes('full') || t === 'in_office' || t === 'office') return 'full-time';
    if (t.includes('part')) return 'part-time';
    if (t.includes('contract')) return 'contract';
    if (t.includes('freelance')) return 'freelance';
    if (t.includes('intern')) return 'internship';
    return 'full-time';
  }
}

export default UnstopScraper;
