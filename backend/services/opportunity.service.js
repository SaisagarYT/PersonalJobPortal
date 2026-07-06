import supabase from '../config/supabase.js';

// Allowed DB enum values — anything else maps to the default
const VALID_COMP_TYPES = new Set(['monthly', 'annually', 'lumpsum', 'hourly']);
const VALID_EMP_TYPES = new Set(['full-time', 'part-time', 'contract', 'freelance', 'internship']);
const VALID_OPP_TYPES = new Set(['internship', 'job', 'competition']);

const safeCompType = (v) => (VALID_COMP_TYPES.has(v) ? v : 'monthly');
const safeEmpType = (v) => (VALID_EMP_TYPES.has(v) ? v : 'full-time');
const safeOppType = (v) => (VALID_OPP_TYPES.has(v) ? v : 'job');

/**
 * Map a unified-model opportunity object to a flat DB row.
 */
const toRow = (opp) => ({
  external_id: String(opp.external_id || ''),
  source: opp.source || '',
  source_url: opp.source_url || '',
  title: opp.title || '',
  type: safeOppType(opp.type),
  employment_type: safeEmpType(opp.employment_type),
  company_name: opp.company?.name || '',
  company_logo: opp.company?.logo || '',
  company_website: opp.company?.website || '',
  description: opp.description || '',
  short_description: opp.short_description || '',
  compensation_min: opp.compensation?.min || 0,
  compensation_max: opp.compensation?.max || 0,
  compensation_currency: opp.compensation?.currency || 'INR',
  compensation_type: safeCompType(opp.compensation?.type),
  is_paid: opp.compensation?.is_paid || false,
  locations: JSON.stringify(opp.locations || []),
  skills: JSON.stringify(opp.skills || []),
  experience_min: opp.experience?.min || 0,
  experience_max: opp.experience?.max || 0,
  experience_level: opp.experience?.level || 'fresher',
  duration_value: opp.duration?.value || 0,
  duration_unit: opp.duration?.unit || 'months',
  deadline: opp.application?.deadline ? new Date(opp.application.deadline).toISOString().split('T')[0] : null,
  applicants_count: opp.application?.applicants_count || 0,
  is_active: opp.application?.is_active !== false,
  apply_url: opp.application?.apply_url || opp.source_url || '',
  posted_date: opp.posted_date ? new Date(opp.posted_date).toISOString() : null,
  categories: JSON.stringify(opp.categories || []),
  tags: JSON.stringify(opp.tags || []),
  fetched_at: new Date().toISOString(),
  last_updated: new Date().toISOString(),
});

/**
 * Map a DB row back to a unified-model object.
 */
const fromRow = (row) => ({
  id: row.id,
  external_id: row.external_id,
  source: row.source,
  source_url: row.source_url,
  title: row.title,
  type: row.type,
  employment_type: row.employment_type,
  company: {
    name: row.company_name,
    logo: row.company_logo,
    website: row.company_website,
  },
  description: row.description,
  short_description: row.short_description,
  compensation: {
    min: row.compensation_min,
    max: row.compensation_max,
    currency: row.compensation_currency,
    type: row.compensation_type,
    is_paid: row.is_paid,
  },
  locations: row.locations || [],
  skills: row.skills || [],
  experience: {
    min: row.experience_min,
    max: row.experience_max,
    level: row.experience_level,
  },
  duration: {
    value: row.duration_value,
    unit: row.duration_unit,
  },
  application: {
    deadline: row.deadline,
    applicants_count: row.applicants_count,
    is_active: row.is_active,
    apply_url: row.apply_url,
  },
  posted_date: row.posted_date,
  categories: row.categories || [],
  tags: row.tags || [],
  fetched_at: row.fetched_at,
  last_updated: row.last_updated,
});

/**
 * Upsert a batch of opportunities.
 * Uses (source, external_id) as the conflict key — existing rows get updated,
 * new rows get inserted. Returns { saved, failed } counts.
 */
const upsertOpportunities = async (opportunities) => {
  if (!opportunities || opportunities.length === 0) return { saved: 0, failed: 0 };

  const rows = opportunities.map(toRow);

  const { data, error } = await supabase
    .from('opportunities')
    .upsert(rows, {
      onConflict: 'source,external_id',
      ignoreDuplicates: false, // update if exists
    })
    .select('id');

  if (error) {
    console.error('[opportunity.service] upsert error:', error.message);
    throw new Error(error.message);
  }

  return { saved: data?.length || 0, failed: rows.length - (data?.length || 0) };
};

/**
 * Query opportunities from DB with filters, sorting, and pagination.
 * All params are optional.
 */
const queryOpportunities = async ({
  type,
  source,
  location,
  skills = [],
  salary_min,
  remote,
  posted_within_days,
  search,
  sort_by = 'fetched_at',
  page = 1,
  per_page = 20,
} = {}) => {
  let query = supabase.from('opportunities').select('*', { count: 'exact' });

  // Filters
  if (type) query = query.eq('type', type);
  if (source) query = query.eq('source', source);
  if (salary_min) query = query.gte('compensation_min', salary_min);
  if (remote === true) query = query.contains('locations', [{ is_remote: true }]);

  if (location) {
    query = query.ilike('locations', `%${location}%`);
  }

  if (skills && skills.length > 0) {
    // Each skill must appear in the skills JSON array
    for (const skill of skills) {
      query = query.ilike('skills', `%${skill}%`);
    }
  }

  if (posted_within_days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - posted_within_days);
    query = query.gte('fetched_at', cutoff.toISOString());
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  // Sort
  const sortMap = {
    posted_date: 'fetched_at',
    salary: 'compensation_max',
    applicants: 'applicants_count',
    fetched_at: 'fetched_at',
  };
  const sortCol = sortMap[sort_by] || 'fetched_at';
  query = query.order(sortCol, { ascending: false });

  // Pagination
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[opportunity.service] query error:', error.message);
    throw new Error(error.message);
  }

  return {
    opportunities: (data || []).map(fromRow),
    pagination: {
      page,
      per_page,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / per_page),
    },
  };
};

/**
 * Get a single opportunity by its DB id.
 */
const getById = async (id) => {
  const { data, error } = await supabase.from('opportunities').select('*').eq('id', id).single();

  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
};

/**
 * Count rows per source — useful for dashboards.
 */
const getSourceCounts = async () => {
  const { data, error } = await supabase.rpc('get_source_counts');

  if (error) {
    // Fallback: manual count if RPC not available
    const { data: rows, error: err2 } = await supabase.from('opportunities').select('source');
    if (err2) throw new Error(err2.message);
    const counts = {};
    (rows || []).forEach((row) => {
      counts[row.source] = (counts[row.source] || 0) + 1;
    });
    return counts;
  }

  const counts = {};
  (data || []).forEach((row) => {
    counts[row.source] = row.count;
  });
  return counts;
};

export default { upsertOpportunities, queryOpportunities, getById, getSourceCounts };
