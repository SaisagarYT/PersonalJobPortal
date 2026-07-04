// Unified Opportunity Data Model
// This serves as the standard format for all scraped opportunities

const OpportunityModel = {
  // Unique identifiers
  id: 'uuid', // Our internal ID (generated)
  external_id: 'string', // Platform's original ID
  source: 'string', // unstop | internshala | linkedin | apna
  source_url: 'string', // Direct link to opportunity

  // Basic info
  title: 'string', // Job/internship title
  type: 'string', // job | internship | competition
  company: {
    name: 'string',
    logo: 'string', // URL
    website: 'string', // URL (optional)
  },

  // Description
  description: 'string', // Full description
  short_description: 'string', // Summary (optional)

  // Compensation
  compensation: {
    min: 'number', // Minimum salary/stipend
    max: 'number', // Maximum salary/stipend
    currency: 'string', // INR | USD
    type: 'string', // monthly | yearly | one-time
    is_paid: 'boolean',
  },

  // Location
  locations: [
    {
      city: 'string',
      state: 'string',
      country: 'string',
      is_remote: 'boolean',
    },
  ],

  // Requirements
  skills: ['string'], // Required skills
  experience: {
    min: 'number', // Years
    max: 'number',
    level: 'string', // fresher | intermediate | expert
  },

  // Job details
  employment_type: 'string', // full-time | part-time | contract | freelance
  duration: {
    value: 'number',
    unit: 'string', // months | years | days
  },

  // Application info
  application: {
    deadline: 'string', // ISO date
    applicants_count: 'number',
    is_active: 'boolean',
    apply_url: 'string',
  },

  // Metadata
  posted_date: 'string', // ISO date
  approved_date: 'string', // ISO date
  fetched_at: 'string', // When we scraped it
  last_updated: 'string',

  // Categorization
  categories: ['string'], // AI, Web Dev, Marketing, etc.
  tags: ['string'], // wfh, urgent, featured, etc.
};

export default OpportunityModel;
