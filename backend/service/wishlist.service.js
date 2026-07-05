import supabase from '../config/supabase.js';

const saveWishlist = async ({ user_id, opportunity_id }) => {
  const { data, error } = await supabase
    .from('wishlist')
    .insert([{ user_id, opportunity_id }]);

  if (error) throw new Error(error.message);
  return data;
};

const deleteWishlist = async ({ user_id, opportunity_id }) => {
  const { data, error } = await supabase
    .from('wishlist')
    .delete()
    .match({ user_id, opportunity_id });

  if (error) throw new Error(error.message);
  return data;
};

const getWishlist = async (user_id) => {
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      opportunity_id,
      created_at,
      opportunities (
        id, external_id, source, source_url, title, type,
        company_name, company_logo, compensation_min, compensation_max,
        compensation_currency, compensation_type, is_paid,
        locations, skills, apply_url, posted_date, is_active
      )
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export default { saveWishlist, deleteWishlist, getWishlist };
