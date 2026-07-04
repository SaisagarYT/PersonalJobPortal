import supabase from '../config/supabase.js';
const saveOpportunities = async (oppor) => {
  console.log('opportunities');
  const { data, error } = await supabase.from('opportunity').insert(oppor).select();
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};

const saveSkills = async (skill) => {
  console.log('skills');
  const { data, error } = await supabase.from('opportunity_skill').insert(skill);
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};
const saveWorks = async (works) => {
  console.log('jobs');
  const { data, error } = await supabase.from('opportunity_jobs').insert([works]);
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};
const saveLocations = async (locations) => {
  console.log('locations');
  const { data, error } = await supabase.from('opportunity_locations').insert([locations]);

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};

const saveFilters = async (filters) => {
  const { error } = await supabase.from('opportunity_filters').insert([filters]);

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
};

// Checking if opportunity exist or not
const checkIfExistOpportunity = async (oppor) => {
  const { data, error } = await supabase
    .from('opportunity')
    .select('external_id')
    .match({ external_id: oppor.external_id });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }
  return data;
};

export default {
  saveOpportunities,
  checkIfExistOpportunity,
  saveSkills,
  saveWorks,
  saveLocations,
  saveFilters,
};
