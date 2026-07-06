import UnstopScraper from './unstop.scraper.js';
import AdzunaScraper from './adzuna.scraper.js';

class ScraperFactory {
  constructor() {
    this.scrapers = {
      unstop: new UnstopScraper(),
      adzuna: new AdzunaScraper(),
    };
  }

  getScraper(source) {
    const scraper = this.scrapers[source.toLowerCase()];
    if (!scraper) {
      throw new Error(`Scraper for source '${source}' not found`);
    }
    return scraper;
  }

  getAllScrapers() {
    return Object.values(this.scrapers);
  }

  getAvailableSources() {
    return Object.keys(this.scrapers);
  }

  isSourceSupported(source) {
    return source.toLowerCase() in this.scrapers;
  }

  getAllStats() {
    const stats = {};
    for (const [source, scraper] of Object.entries(this.scrapers)) {
      stats[source] = scraper.getStats();
    }
    return stats;
  }
}

export default new ScraperFactory();
