import applicationService from '../services/application.service.js';
import { NotFoundError } from '../utils/errors.js';

// ── Applications ─────────────────────────────────────────────────────────────

const getApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getApplications(req.user.id);
    const summary = await applicationService.getKanbanSummary(req.user.id);

    return res.status(200).json({
      success: true,
      total: applications.length,
      summary,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

const getApplicationById = async (req, res, next) => {
  try {
    const app = await applicationService.getApplicationById(req.params.id, req.user.id);
    if (!app) throw new NotFoundError('Application not found');

    return res.status(200).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

const createApplication = async (req, res, next) => {
  try {
    const app = await applicationService.createApplication(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Application created',
      application: app,
    });
  } catch (err) {
    next(err);
  }
};

const updateStage = async (req, res, next) => {
  try {
    const app = await applicationService.updateStage(req.params.id, req.user.id, req.body.stage);
    if (!app) throw new NotFoundError('Application not found');

    return res.status(200).json({
      success: true,
      message: `Moved to ${req.body.stage}`,
      application: app,
    });
  } catch (err) {
    next(err);
  }
};

const updateApplication = async (req, res, next) => {
  try {
    const app = await applicationService.updateApplication(req.params.id, req.user.id, req.body);
    if (!app) throw new NotFoundError('Application not found');

    return res.status(200).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    await applicationService.deleteApplication(req.params.id, req.user.id);

    return res.status(200).json({ success: true, message: 'Application deleted' });
  } catch (err) {
    next(err);
  }
};

// ── Interview rounds ──────────────────────────────────────────────────────────

const addInterviewRound = async (req, res, next) => {
  try {
    const round = await applicationService.addInterviewRound(
      req.params.id,
      req.user.id,
      req.body
    );
    if (!round) throw new NotFoundError('Application not found');

    return res.status(201).json({ success: true, round });
  } catch (err) {
    next(err);
  }
};

const updateInterviewRound = async (req, res, next) => {
  try {
    const round = await applicationService.updateInterviewRound(
      req.params.round_id,
      req.user.id,
      req.body
    );
    if (!round) throw new NotFoundError('Interview round not found');

    return res.status(200).json({ success: true, round });
  } catch (err) {
    next(err);
  }
};

const deleteInterviewRound = async (req, res, next) => {
  try {
    await applicationService.deleteInterviewRound(req.params.round_id, req.user.id);

    return res.status(200).json({ success: true, message: 'Round deleted' });
  } catch (err) {
    next(err);
  }
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
};
