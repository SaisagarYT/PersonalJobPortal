import opportunityService from '../services/opportunity.service.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * GET /api/v1/opportunities
 * Query cached opportunities from DB — no scraping, instant response.
 */
const getOpportunities = async (req, res, next) => {
  try {
    const {
      type,
      source,
      location,
      skills,
      salary_min,
      remote,
      posted_within_days,
      search,
      sort_by = 'fetched_at',
      page = 1,
      per_page = 20,
    } = req.query;

    const result = await opportunityService.queryOpportunities({
      type,
      source,
      location,
      skills: skills ? skills.split(',').map((s) => s.trim()) : [],
      salary_min: salary_min ? parseInt(salary_min) : undefined,
      remote: remote === 'true' ? true : undefined,
      posted_within_days: posted_within_days ? parseInt(posted_within_days) : undefined,
      search,
      sort_by,
      page: parseInt(page),
      per_page: Math.min(parseInt(per_page) || 20, 100),
    });

    return res.status(200).json({
      success: true,
      total: result.pagination.total,
      pagination: result.pagination,
      opportunities: result.opportunities,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/opportunities/:id
 * Get a single opportunity by DB id.
 */
const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opportunity = await opportunityService.getById(id);

    if (!opportunity) throw new NotFoundError(`Opportunity ${id} not found`);

    return res.status(200).json({ success: true, opportunity });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/opportunities/stats
 * Return counts per source — useful for the frontend dashboard header.
 */
const getStats = async (req, res, next) => {
  try {
    const counts = await opportunityService.getSourceCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return res.status(200).json({
      success: true,
      total,
      by_source: counts,
    });
  } catch (err) {
    next(err);
  }
};

export default { getOpportunities, getOpportunityById, getStats };
