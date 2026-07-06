import scraperFactory from '../scrapers/scraper.factory.js';

class AggregationService {
  /**
   * Scrape from multiple sources and aggregate results
   * @param {Array} sources - Array of source names ['unstop', 'internshala']
   * @param {Object} filters - Common filters to apply
   */
  async scrapeAndAggregate(sources = ['unstop', 'adzuna'], filters = {}) {
    const errors = [];

    // Scrape from each source in parallel
    const scrapePromises = sources.map(async (source) => {
      try {
        if (!scraperFactory.isSourceSupported(source)) {
          errors.push({
            source,
            error: `Source '${source}' is not supported`,
          });
          return null;
        }

        const scraper = scraperFactory.getScraper(source);
        const result = await scraper.scrape(filters);

        if (result.success) {
          return result;
        } else {
          errors.push({
            source,
            error: result.error,
          });
          return null;
        }
      } catch (error) {
        errors.push({
          source,
          error: error.message,
        });
        return null;
      }
    });

    const scrapeResults = await Promise.all(scrapePromises);

    // Combine all opportunities
    const allOpportunities = [];
    const sourceCounts = {};

    scrapeResults.forEach((result) => {
      if (result && result.opportunities) {
        allOpportunities.push(...result.opportunities);
        sourceCounts[result.source] = result.opportunities.length;
      }
    });

    // Deduplicate opportunities
    const deduplicatedOpportunities = this.deduplicateOpportunities(allOpportunities);

    return {
      success: true,
      total: deduplicatedOpportunities.length,
      sources_used: sourceCounts,
      opportunities: deduplicatedOpportunities,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Interleave results from multiple sources so no single source dominates a page.
   * Round-robins across source buckets: unstop[0], internshala[0], apna[0], unstop[1], ...
   */
  interleaveBySource(opportunities) {
    const buckets = {};
    for (const opp of opportunities) {
      if (!buckets[opp.source]) buckets[opp.source] = [];
      buckets[opp.source].push(opp);
    }
    const sources = Object.keys(buckets);
    const result = [];
    let i = 0;
    while (result.length < opportunities.length) {
      const source = sources[i % sources.length];
      if (buckets[source].length > 0) result.push(buckets[source].shift());
      i++;
    }
    return result;
  }

  /**
   * Deduplicate opportunities based on title and company
   * @param {Array} opportunities - Array of opportunities
   */
  deduplicateOpportunities(opportunities) {
    const uniqueMap = new Map();

    opportunities.forEach((opp) => {
      // Create a key based on normalized title and company name
      const key = this.generateDedupeKey(opp);

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, opp);
      } else {
        // If duplicate found, keep the one with more complete data
        const existing = uniqueMap.get(key);
        if (this.calculateCompleteness(opp) > this.calculateCompleteness(existing)) {
          uniqueMap.set(key, opp);
        }
      }
    });

    return Array.from(uniqueMap.values());
  }

  /**
   * Generate deduplication key from opportunity
   */
  generateDedupeKey(opp) {
    const title = (opp.title || '').toLowerCase().trim();
    const company = (opp.company?.name || '').toLowerCase().trim();
    return `${title}::${company}`;
  }

  /**
   * Calculate data completeness score (0-100)
   */
  calculateCompleteness(opp) {
    let score = 0;

    if (opp.title) score += 10;
    if (opp.company?.name) score += 10;
    if (opp.description) score += 10;
    if (opp.compensation?.min > 0) score += 10;
    if (opp.locations && opp.locations.length > 0) score += 10;
    if (opp.skills && opp.skills.length > 0) score += 10;
    if (opp.application?.deadline) score += 10;
    if (opp.application?.apply_url) score += 10;
    if (opp.company?.logo) score += 10;
    if (opp.categories && opp.categories.length > 0) score += 10;

    return score;
  }

  /**
   * Filter opportunities based on criteria
   */
  filterOpportunities(opportunities, filters) {
    let filtered = [...opportunities];

    // Filter by type (flexible matching for singular/plural)
    if (filters.type) {
      const typeToMatch = filters.type.toLowerCase();
      filtered = filtered.filter((opp) => {
        const oppType = (opp.type || '').toLowerCase();
        // Match exact or plural/singular variants
        return (
          oppType === typeToMatch || oppType === typeToMatch + 's' || oppType + 's' === typeToMatch
        );
      });
    }

    // Filter by location
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter((opp) =>
        opp.locations?.some(
          (loc) =>
            loc.city?.toLowerCase().includes(locationLower) ||
            loc.state?.toLowerCase().includes(locationLower)
        )
      );
    }

    // Filter by remote
    if (filters.remote === true) {
      filtered = filtered.filter((opp) => opp.locations?.some((loc) => loc.is_remote));
    }

    // Filter by skills
    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter((opp) =>
        filters.skills.some((skill) =>
          opp.skills?.some((oppSkill) => oppSkill.toLowerCase().includes(skill.toLowerCase()))
        )
      );
    }

    // Filter by minimum salary
    if (filters.salary_min) {
      filtered = filtered.filter((opp) => (opp.compensation?.min || 0) >= filters.salary_min);
    }

    // Filter by posted date
    if (filters.posted_within_days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.posted_within_days);
      filtered = filtered.filter((opp) => new Date(opp.posted_date) >= daysAgo);
    }

    return filtered;
  }

  /**
   * Sort opportunities
   */
  sortOpportunities(opportunities, sortBy = 'posted_date') {
    const sorted = [...opportunities];

    switch (sortBy) {
      case 'posted_date':
        sorted.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date));
        break;
      case 'salary':
        sorted.sort((a, b) => (b.compensation?.max || 0) - (a.compensation?.max || 0));
        break;
      case 'applicants':
        sorted.sort(
          (a, b) => (a.application?.applicants_count || 0) - (b.application?.applicants_count || 0)
        );
        break;
      default:
        // Keep original order
        break;
    }

    return sorted;
  }

  /**
   * Paginate results
   */
  paginate(opportunities, page = 1, perPage = 20) {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    return {
      data: opportunities.slice(startIndex, endIndex),
      pagination: {
        page,
        per_page: perPage,
        total: opportunities.length,
        total_pages: Math.ceil(opportunities.length / perPage),
      },
    };
  }
}

export default new AggregationService();
