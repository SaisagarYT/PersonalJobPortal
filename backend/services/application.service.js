import supabase from '../config/supabase.js';

// ── Applications ─────────────────────────────────────────────────────────────

const getApplications = async (user_id) => {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, stage, notes, applied_at, created_at, updated_at,
      opportunity_id,
      opportunities (
        id, title, company_name, company_logo, source,
        source_url, apply_url, compensation_min, compensation_max,
        compensation_currency, compensation_type, locations, type, is_active, deadline
      ),
      interview_rounds ( id, round_name, scheduled_at, status, notes )
    `)
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const getApplicationById = async (id, user_id) => {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, stage, notes, applied_at, created_at, updated_at,
      opportunity_id,
      opportunities (*),
      interview_rounds ( id, round_name, scheduled_at, status, notes )
    `)
    .eq('id', id)
    .eq('user_id', user_id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data;
};

const createApplication = async (user_id, { opportunity_id, stage, notes, resume_id }) => {
  const { data, error } = await supabase
    .from('applications')
    .insert([{
      user_id,
      opportunity_id,
      stage: stage || 'saved',
      notes: notes || '',
      resume_id: resume_id || null,
      applied_at: stage === 'applied' ? new Date().toISOString() : null,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Application already exists for this opportunity');
    throw new Error(error.message);
  }
  return data;
};

const updateStage = async (id, user_id, stage) => {
  const patch = { stage, updated_at: new Date().toISOString() };
  if (stage === 'applied') patch.applied_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('applications')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data;
};

const updateApplication = async (id, user_id, fields) => {
  const { data, error } = await supabase
    .from('applications')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data;
};

const deleteApplication = async (id, user_id) => {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);

  if (error) throw new Error(error.message);
};

// ── Interview rounds ──────────────────────────────────────────────────────────

const addInterviewRound = async (application_id, user_id, round) => {
  // Verify the application belongs to this user first
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('id')
    .eq('id', application_id)
    .eq('user_id', user_id)
    .single();

  if (appErr || !app) return null;

  const { data, error } = await supabase
    .from('interview_rounds')
    .insert([{ application_id, ...round }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const updateInterviewRound = async (round_id, user_id, fields) => {
  // Join through applications to verify ownership
  const { data, error } = await supabase
    .from('interview_rounds')
    .update({ ...fields })
    .eq('id', round_id)
    .select(`id, round_name, scheduled_at, status, notes, applications!inner(user_id)`)
    .eq('applications.user_id', user_id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw new Error(error.message);
  return data;
};

const deleteInterviewRound = async (round_id, user_id) => {
  const { error } = await supabase
    .from('interview_rounds')
    .delete()
    .eq('id', round_id)
    .in(
      'application_id',
      supabase.from('applications').select('id').eq('user_id', user_id)
    );

  if (error) throw new Error(error.message);
};

// ── Kanban summary ────────────────────────────────────────────────────────────

const getKanbanSummary = async (user_id) => {
  const { data, error } = await supabase
    .from('applications')
    .select('stage')
    .eq('user_id', user_id);

  if (error) throw new Error(error.message);

  const counts = { saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0 };
  (data || []).forEach((r) => { counts[r.stage] = (counts[r.stage] || 0) + 1; });
  return counts;
};

export default {
  getApplications,
  getApplicationById,
  createApplication,
  updateStage,
  updateApplication,
  deleteApplication,
  addInterviewRound,
  updateInterviewRound,
  deleteInterviewRound,
  getKanbanSummary,
};
