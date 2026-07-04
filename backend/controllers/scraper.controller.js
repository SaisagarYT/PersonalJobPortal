import aggregationService from '../services/aggregation.service.js';
import scraperFactory from '../scrapers/scraper.factory.js';
import opportunityService from '../services/opportunity.service.js';

/**
 * Scrape and aggregate opportunities from multiple sources
 */
const scrapeMultiSource = async (req, res, next) => {
  try {
    const {
      sources = ['unstop', 'internshala', 'apna'],
      type,
      location = '',
      skills = [],
      salary_min,
      remote,
      posted_within_days,
      page = 1,
      per_page = 20,
      sort_by = 'posted_date',
    } = req.body;

    // Scrape from all requested sources
    const aggregated = await aggregationService.scrapeAndAggregate(sources, {
      type,
      location,
      page: 1, // Get all results for filtering
      pagination: 100, // Get more results per source
    });

    if (!aggregated.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to scrape opportunities',
      });
    }

    // Apply filters
    let filtered = aggregationService.filterOpportunities(aggregated.opportunities, {
      type,
      location,
      skills,
      salary_min,
      remote,
      posted_within_days,
    });

    // Persist scraped results to DB (fire-and-forget — don't block the response)
    opportunityService
      .upsertOpportunities(aggregated.opportunities)
      .then(({ saved }) => {
        console.log(`[scraper] persisted ${saved} opportunities to DB`);
      })
      .catch((err) => {
        console.error('[scraper] DB persist failed:', err.message);
      });

    // Sort results
    filtered = aggregationService.sortOpportunities(filtered, sort_by);

    // Paginate
    const paginated = aggregationService.paginate(filtered, page, per_page);

    return res.status(200).json({
      success: true,
      total: filtered.length,
      pagination: paginated.pagination,
      sources_used: aggregated.sources_used,
      opportunities: paginated.data,
      errors: aggregated.errors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available scraper sources and their status
 */
const getScraperStatus = async (req, res, next) => {
  try {
    const availableSources = scraperFactory.getAvailableSources();
    const stats = scraperFactory.getAllStats();

    return res.status(200).json({
      success: true,
      available_sources: availableSources,
      scrapers: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Scrape from a single specific source
 */
const scrapeSingleSource = async (req, res, next) => {
  try {
    const { source } = req.params;
    const filters = req.body;

    if (!scraperFactory.isSourceSupported(source)) {
      return res.status(400).json({
        success: false,
        message: `Source '${source}' is not supported`,
        available_sources: scraperFactory.getAvailableSources(),
      });
    }

    const scraper = scraperFactory.getScraper(source);
    const result = await scraper.scrape(filters);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: `Failed to scrape from ${source}`,
        error: result.error,
      });
    }

    // Persist to DB (fire-and-forget)
    opportunityService
      .upsertOpportunities(result.opportunities)
      .then(({ saved }) => {
        console.log(`[scraper] persisted ${saved} ${source} opportunities to DB`);
      })
      .catch((err) => {
        console.error('[scraper] DB persist failed:', err.message);
      });

    return res.status(200).json({
      success: true,
      source,
      total: result.count,
      opportunities: result.opportunities,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  scrapeMultiSource,
  getScraperStatus,
  scrapeSingleSource,
};
