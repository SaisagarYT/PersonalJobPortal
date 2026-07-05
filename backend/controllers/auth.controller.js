import authService from '../services/auth.service.js';

const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.signup({ email, password, name });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Check your email to confirm.',
      user: result.user,
      token: result.session?.access_token || null,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: result.user,
      token: result.session.access_token,
      expires_at: result.session.expires_at,
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = _extractToken(req);
    if (token) await authService.logout(token);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    // req.user is set by requireAuth middleware
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

const _extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
};

export default { signup, login, logout, me };
