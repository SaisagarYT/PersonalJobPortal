import supabase from '../config/supabase.js';
import unstop from '../scrapers/unstop.js';

// wishlist save service
const saveWishlist = async (job) => {
  const { data, error } = await supabase.from('wishlist').insert([job]);
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};

// wishlist delete service
const deleteWishlist = async (job) => {
  const { data, error } = await supabase
    .from('wishlist')
    .delete()
    .match({ opportunity_id: job.opportunity_id, user_id: job.user_id });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};

// wishlist display service
const displayWishlist = async (job) => {
  const data = await unstop.unstopJobScraperOverview(job.id);
  return data;
};

export default {
  saveWishlist,
  deleteWishlist,
  displayWishlist,
};
