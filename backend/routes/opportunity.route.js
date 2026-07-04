import express from 'express';
import opportunityController from '../controllers/opportunity.controller.js';
import { apiLimiter } from '../middleware/security.js';

const route = express.Router();

// Read from DB — instant, no scraping
route.get('/opportunities/stats', apiLimiter, opportunityController.getStats);
route.get('/opportunities', apiLimiter, opportunityController.getOpportunities);
route.get('/opportunities/:id', apiLimiter, opportunityController.getOpportunityById);

export default route;
