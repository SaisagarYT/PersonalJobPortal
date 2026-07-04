import express from 'express';
import scraperController from '../controllers/scraper.controller.js';
import { validate } from '../middleware/validate.js';
import {
  multiSourceScrapeSchema,
  singleSourceScrapeSchema,
} from '../validators/scraper.validator.js';
import { scrapeLimiter } from '../middleware/security.js';

const route = express.Router();

// Multi-source aggregated scraping
route.post(
  '/scrape/multi',
  scrapeLimiter,
  validate(multiSourceScrapeSchema),
  scraperController.scrapeMultiSource
);

// Get scraper status and available sources
route.get('/scrape/status', scraperController.getScraperStatus);

// Scrape from a single source
route.post(
  '/scrape/:source',
  scrapeLimiter,
  validate(singleSourceScrapeSchema),
  scraperController.scrapeSingleSource
);

export default route;
