import supabase from '../config/supabase.js';

const signup = async ({ email, password, name }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || '' },
    },
  });

  if (error) throw new Error(error.message);

  return {
    user: _formatUser(data.user),
    session: data.session,
  };
};

const login = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);

  return {
    user: _formatUser(data.user),
    session: data.session,
  };
};

const logout = async (accessToken) => {
  // Sign out the specific session identified by the token
  const { error } = await supabase.auth.admin.signOut(accessToken);
  if (error) throw new Error(error.message);
};

const getUser = async (accessToken) => {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) throw new Error(error.message);
  return _formatUser(data.user);
};

const _formatUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || '',
    created_at: user.created_at,
  };
};

export default { signup, login, logout, getUser };
