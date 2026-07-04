# Multi-Platform Job Scraping Strategy

## Problem Statement

Scrape job opportunities from multiple platforms and present unified, clean data to users.

**Target Platforms:**
1. ✅ Unstop (Done)
2. 🎯 Internshala
3. 🎯 LinkedIn
4. 🎯 Apna

---

## Platform Analysis

### 1. Unstop
**Status:** ✅ Implemented

**API Available:** Yes (Public API)
```
https://unstop.com/api/public/opportunity/search-result
```

**Data Structure:**
- Jobs, Internships, Competitions
- Company info, salary, location
- Skills, work functions, filters
- Registration count, deadlines

**Scraping Method:** Direct API calls (easiest)

---

### 2. Internshala
**Website:** https://internshala.com

**Data Available:**
- Internships (primary focus)
- Jobs
- Company details, stipend
- Location, duration, type
- Application deadline
- Skills required

**Scraping Method:** 
- Option A: Check for public API (inspect network requests)
- Option B: HTML scraping with Playwright/Cheerio
- **Likely:** HTML scraping needed

**Key URLs:**
```
https://internshala.com/internships/
https://internshala.com/jobs/
```

---

### 3. LinkedIn
**Website:** https://linkedin.com/jobs

**Challenges:**
- ⚠️ **High bot protection** (Cloudflare, reCAPTCHA)
- Login required for full access
- Rate limiting is strict
- ToS prohibits scraping

**Data Available:**
- Job postings
- Company info
- Salary (sometimes)
- Location, job type
- Experience level
- Application count

**Scraping Method:**
- Option A: LinkedIn API (requires partnership/approval)
- Option B: RapidAPI LinkedIn scrapers (paid)
- Option C: Playwright with stealth mode + rotating proxies (complex)
- **Recommended:** Start with RapidAPI or skip for MVP

**Alternative:** LinkedIn Job Search API on RapidAPI
```
https://rapidapi.com/rockapis-rockapis-default/api/linkedin-data-api/
```

---

### 4. Apna
**Website:** https://apna.co/jobs

**Data Available:**
- Jobs (blue-collar + white-collar)
- Salary range
- Location
- Company name
- Job type, experience

**Scraping Method:**
- Check for API (inspect network)
- Likely needs HTML scraping
- Moderate protection

**Key URLs:**
```
https://apna.co/jobs
https://apna.co/api/... (need to inspect)
```

---

## Unified Data Schema

### Core Opportunity Model

```javascript
{
  // Unique identifiers
  id: "uuid",                    // Our internal ID
  external_id: "string",         // Platform's ID
  source: "unstop|internshala|linkedin|apna",
  source_url: "string",          // Direct link to opportunity
  
  // Basic info
  title: "string",               // Job/internship title
  type: "job|internship|competition",
  company: {
    name: "string",
    logo: "url",
    website: "url"
  },
  
  // Description
  description: "string",         // Full description
  short_description: "string",   // Summary (max 200 chars)
  
  // Compensation
  compensation: {
    min: number,                 // Minimum salary/stipend
    max: number,                 // Maximum salary/stipend
    currency: "INR|USD",
    type: "monthly|yearly|one-time",
    is_paid: boolean
  },
  
  // Location
  locations: [{
    city: "string",
    state: "string",
    country: "string",
    is_remote: boolean
  }],
  
  // Requirements
  skills: ["string"],            // Required skills
  experience: {
    min: number,                 // Years
    max: number,
    level: "fresher|intermediate|expert"
  },
  qualifications: ["string"],    // Degree requirements
  
  // Job details
  employment_type: "full-time|part-time|contract|freelance",
  duration: {
    value: number,
    unit: "months|years|days"
  },
  
  // Application info
  application: {
    deadline: "ISO date",
    applicants_count: number,
    is_active: boolean,
    apply_url: "string"
  },
  
  // Metadata
  posted_date: "ISO date",
  approved_date: "ISO date",
  fetched_at: "ISO date",        // When we scraped it
  last_updated: "ISO date",
  
  // Categorization
  categories: ["string"],        // AI, Web Dev, Marketing, etc.
  tags: ["string"],              // wfh, urgent, featured, etc.
  
  // Quality score (our internal ranking)
  quality_score: number,         // 0-100
  is_verified: boolean
}
```

---

## Architecture Design

### Strategy Pattern - Multiple Scrapers

```
┌─────────────────────────────────────────────┐
│         Scraper Factory                      │
│  (Decides which scraper to use)             │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬──────────┬─────────┐
        │                       │          │         │
┌───────▼─────┐    ┌────────────▼──┐  ┌───▼────┐  ┌─▼────┐
│   Unstop    │    │  Internshala  │  │LinkedIn│  │ Apna │
│   Scraper   │    │    Scraper    │  │Scraper │  │Scraper│
└─────────────┘    └───────────────┘  └────────┘  └──────┘
        │                   │              │          │
        └───────────────────┴──────────────┴──────────┘
                            │
                    ┌───────▼────────┐
                    │  Data Adapter  │
                    │ (Normalizes to │
                    │ Unified Schema)│
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │  Aggregation   │
                    │    Service     │
                    │ (Merge, Dedup, │
                    │  Rank, Filter) │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │    Database    │
                    │   (Supabase)   │
                    └────────────────┘
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Priority: High**

1. **Unified Data Model**
   - [ ] Create unified opportunity schema
   - [ ] Update database tables
   - [ ] Create migration scripts
   - [ ] Update existing Unstop data to new schema

2. **Scraper Architecture**
   - [ ] Create base scraper interface/abstract class
   - [ ] Implement scraper factory
   - [ ] Create data adapter pattern
   - [ ] Setup error handling for scraper failures

3. **Files to Create:**
   ```
   backend/
   ├── models/
   │   └── opportunity.model.js      # Unified schema
   ├── scrapers/
   │   ├── base.scraper.js          # Abstract base class
   │   ├── scraper.factory.js       # Factory pattern
   │   └── adapters/
   │       ├── unstop.adapter.js    # Unstop → Unified
   │       ├── internshala.adapter.js
   │       ├── linkedin.adapter.js
   │       └── apna.adapter.js
   ├── services/
   │   ├── aggregation.service.js   # Merge & deduplicate
   │   └── scraper.orchestrator.js  # Coordinate scrapers
   ```

### Phase 2: Internshala Scraper (Week 2)
**Priority: High** (Easier than LinkedIn, high-quality data)

1. **Research**
   - [ ] Inspect Internshala network requests
   - [ ] Check if API exists
   - [ ] Analyze HTML structure if no API

2. **Implementation**
   - [ ] Create Internshala scraper
   - [ ] Create Internshala adapter
   - [ ] Add data validation
   - [ ] Test with sample data

3. **Integration**
   - [ ] Add to scraper factory
   - [ ] Update aggregation service
   - [ ] Create API endpoint

### Phase 3: Apna Scraper (Week 3)
**Priority: Medium**

1. **Research & Implementation**
   - Same steps as Internshala

### Phase 4: LinkedIn (Week 4)
**Priority: Low** (Most complex, consider alternatives)

**Options:**
1. Use RapidAPI LinkedIn scraper (Recommended for MVP)
2. Build custom scraper with stealth mode
3. Skip for MVP, add later

---

## Data Aggregation Strategy

### 1. Deduplication Logic

**Similar opportunities identified by:**
- Exact title match + same company
- Similar title (Levenshtein distance < 3) + same company
- Same external_id from same source

**Merge Strategy:**
- Keep the one with most complete data
- Combine skills/tags from both
- Update `last_updated` timestamp

### 2. Ranking/Quality Score

**Factors (0-100 score):**
- Data completeness (30 points)
  - Has description: +10
  - Has salary: +10
  - Has skills: +5
  - Has location: +5
- Recency (20 points)
  - Posted today: +20
  - Posted this week: +15
  - Posted this month: +10
- Company reputation (20 points)
  - Verified company: +10
  - Multiple postings: +5
  - Has company website: +5
- Application metrics (15 points)
  - Active deadline: +10
  - Applicant count in range: +5
- Source reliability (15 points)
  - LinkedIn: +15
  - Unstop/Internshala: +12
  - Apna: +10

### 3. Filtering & Search

**User Filters:**
- Source (unstop, internshala, linkedin, apna, or "all")
- Type (job, internship, competition)
- Location (city, state, remote)
- Salary range
- Experience level
- Skills
- Posted within (today, week, month)
- Employment type

---

## API Design

### New Endpoints

#### 1. Get Aggregated Opportunities
```
POST /api/v1/opportunities/search
```

**Request Body:**
```json
{
  "sources": ["unstop", "internshala", "linkedin", "apna"],
  "type": "internship",
  "location": "Bangalore",
  "skills": ["React", "Node.js"],
  "salary_min": 20000,
  "experience_level": "fresher",
  "remote": true,
  "posted_within_days": 7,
  "page": 1,
  "per_page": 20,
  "sort_by": "quality_score|posted_date|salary"
}
```

**Response:**
```json
{
  "success": true,
  "total": 156,
  "page": 1,
  "per_page": 20,
  "opportunities": [...],
  "sources_used": {
    "unstop": 45,
    "internshala": 67,
    "linkedin": 32,
    "apna": 12
  }
}
```

#### 2. Trigger Fresh Scrape
```
POST /api/v1/scrape/trigger
```

**Request Body:**
```json
{
  "sources": ["internshala"],
  "filters": {
    "role": "web-development",
    "location": "bangalore"
  }
}
```

#### 3. Get Scraper Status
```
GET /api/v1/scrape/status
```

**Response:**
```json
{
  "scrapers": {
    "unstop": {
      "status": "active",
      "last_run": "2026-07-04T14:30:00Z",
      "opportunities_fetched": 234,
      "error_rate": 0.02
    },
    "internshala": {
      "status": "active",
      "last_run": "2026-07-04T14:25:00Z",
      "opportunities_fetched": 456,
      "error_rate": 0.01
    }
  }
}
```

---

## Technical Considerations

### 1. Rate Limiting & Politeness
- Unstop API: 10 requests/min (current)
- Internshala: TBD (test and adjust)
- LinkedIn: Very strict, use premium API
- Apna: TBD

**Solution:** Queue system with configurable delays per source

### 2. Data Freshness
- Scrape every 6 hours for active opportunities
- Expired opportunities marked as inactive
- User can trigger manual refresh (rate limited)

### 3. Error Handling
- One scraper failing shouldn't break others
- Retry logic with exponential backoff
- Alert on scraper failure
- Fallback to cached data

### 4. Storage Optimization
- Archive old/expired opportunities
- Compress description text
- Index on: source, type, location, posted_date, skills

### 5. Caching Strategy
- Cache aggregated results for 10 minutes
- Invalidate on new scrape
- Redis for caching (optional)

---

## Database Schema Updates

### New Tables

#### `opportunity` (Updated)
```sql
ALTER TABLE opportunity ADD COLUMN source VARCHAR(50);
ALTER TABLE opportunity ADD COLUMN source_url TEXT;
ALTER TABLE opportunity ADD COLUMN type VARCHAR(50);
ALTER TABLE opportunity ADD COLUMN quality_score INTEGER;
ALTER TABLE opportunity ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE opportunity ADD COLUMN fetched_at TIMESTAMP;
ALTER TABLE opportunity ADD COLUMN last_updated TIMESTAMP;
-- Add other new fields from unified schema
```

#### `scraper_runs`
```sql
CREATE TABLE scraper_runs (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20), -- running, completed, failed
  opportunities_fetched INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  filters JSONB
);
```

#### `opportunity_duplicates`
```sql
CREATE TABLE opportunity_duplicates (
  id BIGSERIAL PRIMARY KEY,
  primary_opportunity_id BIGINT REFERENCES opportunity(id),
  duplicate_opportunity_id BIGINT REFERENCES opportunity(id),
  similarity_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Recommended Implementation Order

### MVP (2-3 weeks)

1. **Week 1: Foundation**
   - ✅ Unified data model
   - ✅ Base scraper architecture
   - ✅ Refactor Unstop scraper to new architecture
   - ✅ Aggregation service
   - ✅ New API endpoints

2. **Week 2: Internshala**
   - ✅ Internshala scraper
   - ✅ Adapter for Internshala data
   - ✅ Integration testing
   - ✅ Deduplication logic

3. **Week 3: Apna + Polish**
   - ✅ Apna scraper
   - ✅ Quality score implementation
   - ✅ UI-facing unified API
   - ✅ Testing & bug fixes

### Post-MVP

4. **Week 4: LinkedIn (Optional)**
   - Evaluate LinkedIn RapidAPI
   - OR skip for now

5. **Week 5: Automation**
   - Cron jobs for automatic scraping
   - Monitoring & alerts
   - Performance optimization

---

## Alternative: Quick Win Strategy

If you want **faster results**, start with:

1. **This Week: Internshala Only**
   - Just add Internshala scraper
   - Don't refactor Unstop yet
   - Simple merge in API response
   - No deduplication initially

2. **Next Week: Clean Architecture**
   - Then refactor to proper architecture
   - Add deduplication
   - Add quality scores

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Platform blocks IP | High | Rotating proxies, rate limiting |
| HTML structure changes | Medium | Monitor & alert, quick fix |
| LinkedIn access issues | High | Use RapidAPI or skip |
| Performance issues | Medium | Caching, pagination, indexing |
| Legal concerns | High | Check ToS, add robots.txt respect |

---

## Cost Considerations

- **RapidAPI LinkedIn:** ~$50-200/month for decent limits
- **Proxies (if needed):** ~$20-50/month
- **Additional Supabase storage:** Minimal (~$5-10/month)

---

## Next Steps - Choose Your Path

### Path A: Full Architecture (Recommended)
**Timeline:** 3 weeks  
**Effort:** High  
**Result:** Scalable, maintainable system

Start with Phase 1 foundation

### Path B: Quick Win
**Timeline:** 1 week  
**Effort:** Medium  
**Result:** Working multi-source, refactor later

Just add Internshala scraper now

**Which path do you prefer?**
