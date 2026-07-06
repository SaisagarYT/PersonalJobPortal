import cron from 'node-cron';
import scraperFactory from '../scrapers/scraper.factory.js';
import opportunityService from '../services/opportunity.service.js';

const SOURCES = ['unstop', 'adzuna'];

const state = {
  isRunning: false,
  lastRunAt: null,
  lastRunStatus: null,
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

  const errors = [];
  const allOpportunities = [];

  // Step 1: Collect from ALL sources first, don't store yet
  await Promise.all(
    SOURCES.map(async (source) => {
      try {
        const scraper = scraperFactory.getScraper(source);
        const result = await scraper.scrape();

        if (result.success && result.opportunities.length > 0) {
          allOpportunities.push(...result.opportunities);
          console.log(`[scheduler] ${source}: collected ${result.opportunities.length}`);
        } else if (!result.success) {
          errors.push({ source, error: result.error });
          console.error(`[scheduler] ${source} failed: ${result.error}`);
        } else {
          console.log(`[scheduler] ${source}: 0 results (skipped or no keys)`);
        }
      } catch (err) {
        errors.push({ source, error: err.message });
        console.error(`[scheduler] ${source} threw: ${err.message}`);
      }
    })
  );

  console.log(`[scheduler] Total collected from all sources: ${allOpportunities.length}`);

  // Step 2: Deduplicate across sources by (source + external_id)
  const seen = new Set();
  const deduped = allOpportunities.filter((opp) => {
    const key = `${opp.source}::${opp.external_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[scheduler] After dedup: ${deduped.length} unique opportunities`);

  // Step 3: Single upsert for everything
  try {
    const { saved } = await opportunityService.upsertOpportunities(deduped);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    state.lastSaved = saved;
    state.lastErrors = errors;
    state.lastRunStatus = errors.length > 0 ? 'partial' : 'success';

    console.log(
      `[scheduler] Run #${state.totalRuns} done in ${elapsed}s — ` +
        `collected ${allOpportunities.length}, deduped ${deduped.length}, saved ${saved}` +
        (errors.length ? `, ${errors.length} source error(s)` : '')
    );
  } catch (err) {
    state.lastRunStatus = 'failed';
    state.lastErrors = [...errors, { source: 'upsert', error: err.message }];
    console.error(`[scheduler] DB upsert failed: ${err.message}`);
  } finally {
    state.isRunning = false;
    state.lastRunAt = new Date().toISOString();
  }
};

const startScheduler = () => {
  cron.schedule('0 */6 * * *', runScrape, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[scheduler] Scheduled — runs every 6 hours (IST)');

  // Run immediately on startup
  runScrape();
};

const getStatus = () => ({ ...state });

export { startScheduler, getStatus, runScrape };
