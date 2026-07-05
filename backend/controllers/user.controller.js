import userService from '../services/user.service.js';

const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);

    return res.status(200).json({
      success: true,
      profile: profile || { id: req.user.id, email: req.user.email, name: req.user.name },
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await userService.upsertProfile(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Profile updated',
      profile,
    });
  } catch (err) {
    next(err);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const result = await userService.updatePreferences(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Preferences updated',
      preferences: result.job_preferences,
    });
  } catch (err) {
    next(err);
  }
};

export default { getProfile, updateProfile, updatePreferences };
