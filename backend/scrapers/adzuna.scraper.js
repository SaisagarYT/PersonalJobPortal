import axios from 'axios';
import BaseScraper from './base.scraper.js';

// Search terms — one request each, sorted by date, page 1 (50 results)
const SEARCHES = [
  'web developer',
  'frontend developer',
  'backend developer',
  'flutter developer',
  'fullstack developer',
  'react developer',
  'node.js developer',
  'python developer',
  'software engineer',
  'internship developer',
];

const RESULTS_PER_SEARCH = 50;
const MAX_AGE_DAYS = 1; // only keep jobs posted today or yesterday

class AdzunaScraper extends BaseScraper {
  constructor() {
    super('adzuna');
    this.baseUrl = 'https://api.adzuna.com/v1/api/jobs/in/search';
  }

  _getKeys() {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    return { appId, appKey };
  }

  async scrape() {
    const { appId, appKey } = this._getKeys();

    if (!appId || !appKey) {
      console.warn('[adzuna] ADZUNA_APP_ID or ADZUNA_APP_KEY not set — skipping');
      return { success: true, source: this.source, opportunities: [], count: 0 };
    }

    try {
      // Fetch all search terms in parallel
      const results = await Promise.all(
        SEARCHES.map((term) => this._fetchSearch(term, appId, appKey))
      );

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);

      // Flatten, filter to recent, deduplicate by id
      const seen = new Set();
      const unique = [];

      for (const batch of results) {
        for (const job of batch) {
          const id = String(job.id);
          if (seen.has(id)) continue;

          // Filter to today/yesterday only
          const posted = job.created ? new Date(job.created) : null;
          if (posted && posted < cutoff) continue;

          seen.add(id);
          unique.push(job);
        }
      }

      console.log(`[adzuna] Total unique recent jobs: ${unique.length}`);
      this.logSuccess(unique.length);

      return {
        success: true,
        source: this.source,
        opportunities: unique.map((j) => this.adaptToUnifiedModel(j)),
        count: unique.length,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async _fetchSearch(what, appId, appKey) {
    try {
      const resp = await axios.get(`${this.baseUrl}/1`, {
        params: {
          app_id: appId,
          app_key: appKey,
          results_per_page: RESULTS_PER_SEARCH,
          what,
          where: 'india',
          sort_by: 'date',
          'content-type': 'application/json',
        },
        timeout: 15000,
      });
      const results = resp.data?.results || [];
      console.log(`[adzuna] "${what}": ${results.length} results`);
      return results;
    } catch (err) {
      console.warn(`[adzuna] "${what}" failed: ${err.message}`);
      return [];
    }
  }

  adaptToUnifiedModel(raw) {
    const salaryMin = Math.round(raw.salary_min || 0);
    const salaryMax = Math.round(raw.salary_max || salaryMin);

    const titleLower = (raw.title || '').toLowerCase();
    const isInternship =
      titleLower.includes('intern') ||
      titleLower.includes('trainee') ||
      titleLower.includes('fresher') ||
      titleLower.includes('graduate');
    const type = isInternship ? 'internship' : 'job';

    const locationArea = raw.location?.area || [];
    const city =
      raw.location?.display_name ||
      locationArea[locationArea.length - 1] ||
      'India';

    const descText = raw.description || '';
    const isRemote = descText.toLowerCase().includes('remote') ||
      (raw.title || '').toLowerCase().includes('remote');

    return {
      external_id: String(raw.id),
      source: this.source,
      source_url: raw.redirect_url || '',
      title: raw.title || '',
      type,
      company: {
        name: raw.company?.display_name || '',
        logo: '',
        website: '',
      },
      description: descText,
      short_description: descText.substring(0, 200),
      compensation: {
        min: salaryMin,
        max: salaryMax,
        currency: 'INR',
        type: 'monthly',
        is_paid: salaryMin > 0,
      },
      locations: [{ city, state: '', country: 'India', is_remote: isRemote }],
      skills: raw.category?.label ? [raw.category.label] : [],
      experience: {
        min: 0,
        max: isInternship ? 1 : 3,
        level: isInternship ? 'fresher' : 'intermediate',
      },
      employment_type: isInternship ? 'internship' : 'full-time',
      duration: { value: isInternship ? 6 : 0, unit: 'months' },
      application: {
        deadline: '',
        applicants_count: 0,
        is_active: true,
        apply_url: raw.redirect_url || '',
      },
      posted_date: raw.created || new Date().toISOString(),
      approved_date: raw.created || new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      categories: raw.category?.label ? [raw.category.label] : [],
      tags: [],
    };
  }
}

export default AdzunaScraper;
