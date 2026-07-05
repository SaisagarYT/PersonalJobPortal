import axios from 'axios';
import BaseScraper from './base.scraper.js';

/**
 * Apna scraper — replaced with Remotive API (no browser needed).
 * Focuses on full-time job categories to complement internshala's fresher focus.
 */
class ApnaScraper extends BaseScraper {
  constructor() {
    super('apna');
    this.apiUrl = 'https://remotive.com/api/remote-jobs';
    this.categories = ['product', 'marketing', 'customer-support', 'finance-legal'];
  }

  async scrape(filters = {}) {
    try {
      const { category = '', page = 1 } = filters;
      const limit = 20;

      const cat = category || this.categories[(page - 1) % this.categories.length];

      const response = await axios.get(this.apiUrl, {
        params: { limit, category: cat },
        timeout: 15000,
      });

      const jobs = response.data?.jobs || [];
      this.logSuccess(jobs.length);

      return {
        success: true,
        source: this.source,
        opportunities: jobs.map((j) => this.adaptToUnifiedModel(j)),
        count: jobs.length,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  adaptToUnifiedModel(raw) {
    const salaryMatch = raw.salary?.match(/([\d,]+)/);
    const minSalary = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, '')) : 0;

    const jobType = (raw.job_type || '').toLowerCase();
    let employmentType = 'full-time';
    if (jobType.includes('contract')) employmentType = 'contract';
    else if (jobType.includes('part')) employmentType = 'part-time';
    else if (jobType.includes('freelance')) employmentType = 'freelance';

    return {
      external_id: String(raw.id),
      source: this.source,
      source_url: raw.url || '',
      title: raw.title || '',
      type: 'job',
      company: {
        name: raw.company_name || '',
        logo: raw.company_logo_url || raw.company_logo || '',
        website: '',
      },
      description: raw.description?.replace(/<[^>]*>/g, '') || '',
      short_description: raw.description?.replace(/<[^>]*>/g, '').substring(0, 200) || '',
      compensation: {
        min: minSalary,
        max: minSalary,
        currency: 'USD',
        type: 'monthly',
        is_paid: minSalary > 0,
      },
      locations: [
        {
          city: raw.candidate_required_location || 'Remote',
          state: '',
          country: 'Remote',
          is_remote: true,
        },
      ],
      skills: Array.isArray(raw.tags) ? raw.tags.slice(0, 8) : [],
      experience: { min: 0, max: 5, level: 'intermediate' },
      employment_type: employmentType,
      duration: { value: 0, unit: 'months' },
      application: {
        deadline: '',
        applicants_count: 0,
        is_active: true,
        apply_url: raw.url || '',
      },
      posted_date: raw.publication_date || new Date().toISOString(),
      approved_date: raw.publication_date || new Date().toISOString(),
      fetched_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      categories: raw.category ? [raw.category] : [],
      tags: Array.isArray(raw.tags) ? raw.tags : [],
    };
  }
}

export default ApnaScraper;
