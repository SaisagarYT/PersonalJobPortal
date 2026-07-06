import axios from 'axios';
import BaseScraper from './base.scraper.js';

/**
 * Adzuna scraper — uses Adzuna's official Jobs API.
 * Free tier: 250 requests/day. Covers jobs and internships across India.
 * Sign up at https://developer.adzuna.com/ to get app_id and app_key.
 * Store them in Infisical as: adzunaAppId, adzunaAppKey
 */
class AdzunaScraper extends BaseScraper {
  constructor() {
    super('adzuna');
    this.baseUrl = 'https://api.adzuna.com/v1/api/jobs/in/search';
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
  }

  async scrape(filters = {}) {
    if (!this.appId || !this.appKey) {
      console.warn('[adzuna] ADZUNA_APP_ID or ADZUNA_APP_KEY not set — skipping');
      return { success: true, source: this.source, opportunities: [], count: 0 };
    }

    try {
      const { type = '', location = 'india', page = 1 } = filters;

      // Build search query based on type
      let what = 'software developer';
      if (type === 'internship') what = 'internship software developer';
      else if (type === 'job') what = 'software developer engineer';
      else if (type === 'competition') what = 'hackathon competition developer';

      const [jobsRes, internRes] = await Promise.all([
        this._fetch(what, location, page, 15),
        type === '' ? this._fetch('internship fresher', location, page, 5) : Promise.resolve([]),
      ]);

      const all = [...jobsRes, ...internRes];
      this.logSuccess(all.length);

      return {
        success: true,
        source: this.source,
        opportunities: all.map((j) => this.adaptToUnifiedModel(j)),
        count: all.length,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async _fetch(what, where, page, count) {
    try {
      const resp = await axios.get(`${this.baseUrl}/${page}`, {
        params: {
          app_id: this.appId,
          app_key: this.appKey,
          results_per_page: count,
          what,
          where,
          content_type: 'application/json',
          sort_by: 'date',
        },
        timeout: 15000,
      });
      return resp.data?.results || [];
    } catch (err) {
      console.error(`[adzuna] fetch failed: ${err.message}`);
      return [];
    }
  }

  adaptToUnifiedModel(raw) {
    const salaryMin = Math.round(raw.salary_min || 0);
    const salaryMax = Math.round(raw.salary_max || salaryMin);

    const titleLower = (raw.title || '').toLowerCase();
    const isInternship = titleLower.includes('intern') || titleLower.includes('fresher') || titleLower.includes('trainee');
    const type = isInternship ? 'internship' : 'job';

    const location = raw.location?.display_name || raw.location?.area?.[raw.location.area.length - 1] || 'India';

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
      description: raw.description || '',
      short_description: (raw.description || '').substring(0, 200),
      compensation: {
        min: salaryMin,
        max: salaryMax,
        currency: 'INR',
        type: 'monthly',
        is_paid: salaryMin > 0,
      },
      locations: [
        {
          city: location,
          state: '',
          country: 'India',
          is_remote: (raw.title + ' ' + (raw.description || '')).toLowerCase().includes('remote'),
        },
      ],
      skills: raw.category?.label ? [raw.category.label] : [],
      experience: { min: 0, max: 3, level: isInternship ? 'fresher' : 'intermediate' },
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
