import supabase from '../config/supabase.js';

const getProfile = async (user_id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();

  if (error && error.code === 'PGRST116') return null; // not found
  if (error) throw new Error(error.message);
  return data;
};

const upsertProfile = async (user_id, fields) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: user_id, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const updatePreferences = async (user_id, preferences) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { id: user_id, job_preferences: preferences, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select('id, job_preferences')
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export default { getProfile, upsertProfile, updatePreferences };
