import axios from 'axios';
import BaseScraper from './base.scraper.js';

/**
 * Internshala scraper — replaced with Remotive API (no browser needed).
 * Remotive is a free public API for remote jobs/internships, no key required.
 * Covers software-dev, devops, design, data, product categories.
 */
class IntershalaScraper extends BaseScraper {
  constructor() {
    super('internshala');
    this.apiUrl = 'https://remotive.com/api/remote-jobs';
    this.categories = ['software-dev', 'data', 'design', 'devops-sysadmin'];
  }

  async scrape(filters = {}) {
    try {
      const { category = '', page = 1 } = filters;
      const limit = 20;

      // Pick a category — rotate through them based on page number
      const cat = category || this.categories[(page - 1) % this.categories.length];

      const response = await axios.get(this.apiUrl, {
        params: { limit, category: cat, search: 'intern OR junior OR fresher' },
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

    return {
      external_id: String(raw.id),
      source: this.source,
      source_url: raw.url || '',
      title: raw.title || '',
      type: 'internship',
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
      experience: { min: 0, max: 2, level: 'fresher' },
      employment_type: raw.job_type === 'contract' ? 'contract' : 'full-time',
      duration: { value: 6, unit: 'months' },
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

export default IntershalaScraper;
