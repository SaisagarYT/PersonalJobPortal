// Base Scraper Class - All scrapers extend this

class BaseScraper {
  constructor(source) {
    this.source = source;
    this.lastRunTime = null;
    this.errorCount = 0;
    this.successCount = 0;
  }

  // Abstract method - must be implemented by child classes
  async scrape(_filters) {
    throw new Error('scrape() must be implemented by child class');
  }

  // Abstract method - adapt platform data to unified model
  adaptToUnifiedModel(_rawData) {
    throw new Error('adaptToUnifiedModel() must be implemented by child class');
  }

  // Common error handling
  handleError(error) {
    this.errorCount++;
    console.error(`[${this.source}] Scraper error:`, error.message);
    return {
      success: false,
      source: this.source,
      error: error.message,
      opportunities: [],
    };
  }

  // Log successful scrape
  logSuccess(count) {
    this.successCount++;
    this.lastRunTime = new Date().toISOString();
    console.log(`[${this.source}] Successfully scraped ${count} opportunities`);
  }

  // Get scraper stats
  getStats() {
    return {
      source: this.source,
      lastRunTime: this.lastRunTime,
      successCount: this.successCount,
      errorCount: this.errorCount,
      errorRate: this.successCount > 0 ? this.errorCount / this.successCount : 0,
    };
  }
}

export default BaseScraper;
