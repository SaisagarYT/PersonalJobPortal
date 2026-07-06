import cron from 'node-cron';
import aggregationService from '../services/aggregation.service.js';
import opportunityService from '../services/opportunity.service.js';

const SOURCES = ['unstop', 'adzuna'];

// Track state so the health endpoint can report it
const state = {
  isRunning: false,
  lastRunAt: null,
  lastRunStatus: null, // 'success' | 'partial' | 'failed'
  lastSaved: 0,
  lastErrors: [],
  totalRuns: 0,
};

const runScrape = async () => {
  if (state.isRunning) {
    console.log('[scheduler] Skipping — previous run still in progress');
    return;
  }

  state.isRunning = true;
  state.totalRuns++;
  const startTime = Date.now();
  console.log(`[scheduler] Starting scrape run #${state.totalRuns}`);

  try {
    const result = await aggregationService.scrapeAndAggregate(SOURCES, {});

    if (!result.success) {
      throw new Error('Aggregation returned success=false');
    }

    const { saved } = await opportunityService.upsertOpportunities(result.opportunities);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    state.lastSaved = saved;
    state.lastErrors = result.errors || [];
    state.lastRunStatus = result.errors?.length ? 'partial' : 'success';

    console.log(
      `[scheduler] Run #${state.totalRuns} done in ${elapsed}s — ` +
        `scraped ${result.total}, saved ${saved} to DB` +
        (result.errors?.length ? `, ${result.errors.length} source error(s)` : '')
    );
  } catch (err) {
    state.lastRunStatus = 'failed';
    state.lastErrors = [{ error: err.message }];
    console.error(`[scheduler] Run #${state.totalRuns} failed:`, err.message);
  } finally {
    state.isRunning = false;
    state.lastRunAt = new Date().toISOString();
  }
};

// Schedule: every 6 hours  →  "0 */6 * * *"
// Runs at 00:00, 06:00, 12:00, 18:00 every day
const startScheduler = () => {
  cron.schedule('0 */6 * * *', runScrape, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[scheduler] Scheduled — runs every 6 hours (IST)');

  // Run once immediately on startup so DB is populated right away
  runScrape();
};

const getStatus = () => ({ ...state });

export { startScheduler, getStatus, runScrape };
