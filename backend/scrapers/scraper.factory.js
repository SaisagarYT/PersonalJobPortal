import UnstopScraper from './unstop.scraper.js';
import IntershalaScraper from './internshala.scraper.js';
import ApnaScraper from './apna.scraper.js';

class ScraperFactory {
  constructor() {
    this.scrapers = {
      unstop: new UnstopScraper(),
      internshala: new IntershalaScraper(),
      apna: new ApnaScraper(),
      // Add more scrapers as they're implemented
      // linkedin: new LinkedInScraper(),
    };
  }

  /**
   * Get a scraper by source name
   */
  getScraper(source) {
    const scraper = this.scrapers[source.toLowerCase()];
    if (!scraper) {
      throw new Error(`Scraper for source '${source}' not found`);
    }
    return scraper;
  }

  /**
   * Get all available scrapers
   */
  getAllScrapers() {
    return Object.values(this.scrapers);
  }

  /**
   * Get all available source names
   */
  getAvailableSources() {
    return Object.keys(this.scrapers);
  }

  /**
   * Check if a source is supported
   */
  isSourceSupported(source) {
    return source.toLowerCase() in this.scrapers;
  }

  /**
   * Get stats for all scrapers
   */
  getAllStats() {
    const stats = {};
    for (const [source, scraper] of Object.entries(this.scrapers)) {
      stats[source] = scraper.getStats();
    }
    return stats;
  }
}

// Export singleton instance
export default new ScraperFactory();
