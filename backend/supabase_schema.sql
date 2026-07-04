-- Run this once in Supabase SQL editor: Dashboard → SQL Editor → New query

-- Main opportunities table (one row per unique listing)
create table if not exists opportunities (
  id                  bigserial primary key,
  external_id         text not null,
  source              text not null,                     -- 'unstop' | 'internshala' | 'apna'
  source_url          text default '',
  title               text not null,
  type                text default 'internship',         -- 'internship' | 'job' | 'competition'
  employment_type     text default '',                   -- 'full-time' | 'part-time' | 'internship' ...
  company_name        text default '',
  company_logo        text default '',
  company_website     text default '',
  description         text default '',
  short_description   text default '',
  compensation_min    integer default 0,
  compensation_max    integer default 0,
  compensation_currency text default 'INR',
  compensation_type   text default 'monthly',            -- 'monthly' | 'yearly' | 'lumpsum'
  is_paid             boolean default false,
  locations           jsonb default '[]',                -- [{ city, state, country, is_remote }]
  skills              jsonb default '[]',                -- ["Python", "React"]
  experience_min      integer default 0,
  experience_max      integer default 0,
  experience_level    text default 'fresher',            -- 'fresher' | 'intermediate' | 'expert'
  duration_value      integer default 0,
  duration_unit       text default 'months',
  deadline            text default '',
  applicants_count    integer default 0,
  is_active           boolean default true,
  apply_url           text default '',
  posted_date         text default '',
  categories          jsonb default '[]',
  tags                jsonb default '[]',
  fetched_at          timestamptz not null default now(),
  last_updated        timestamptz not null default now(),

  -- Composite unique key: one row per (external_id, source)
  constraint opportunities_source_external_id_key unique (source, external_id)
);

-- Index for common query patterns
create index if not exists idx_opportunities_source      on opportunities (source);
create index if not exists idx_opportunities_type        on opportunities (type);
create index if not exists idx_opportunities_is_active   on opportunities (is_active);
create index if not exists idx_opportunities_posted_date on opportunities (posted_date desc);
create index if not exists idx_opportunities_comp_min    on opportunities (compensation_min);
create index if not exists idx_opportunities_fetched_at  on opportunities (fetched_at desc);

-- Full-text search index on title + company
create index if not exists idx_opportunities_fts on opportunities
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(company_name, '')));
