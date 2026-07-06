-- =============================================================
-- Personal Job Portal — Full Schema
-- Run in Supabase: Dashboard → SQL Editor → New query → Run
-- Safe to re-run: drops everything and rebuilds cleanly
-- =============================================================


-- =============================================================
-- 0. TEAR DOWN (drop in reverse dependency order)
-- =============================================================

drop function  if exists get_source_counts() cascade;
drop function  if exists set_last_updated()  cascade;

drop table if exists interview_rounds cascade;
drop table if exists applications     cascade;
drop table if exists wishlist         cascade;
drop table if exists users            cascade;
drop table if exists opportunities    cascade;

drop type if exists round_status         cascade;
drop type if exists application_stage    cascade;
drop type if exists source_enum          cascade;
drop type if exists compensation_type_enum cascade;
drop type if exists duration_unit_enum   cascade;
drop type if exists experience_level_enum cascade;
drop type if exists employment_type_enum cascade;
drop type if exists opportunity_type     cascade;


-- =============================================================
-- 1. ENUMS  (use enums for fixed-value columns — faster, self-documenting)
-- =============================================================

do $$ begin
  create type opportunity_type     as enum ('internship', 'job', 'competition');
exception when duplicate_object then null; end $$;

do $$ begin
  create type employment_type_enum as enum ('full-time', 'part-time', 'contract', 'freelance', 'internship');
exception when duplicate_object then null; end $$;

do $$ begin
  create type experience_level_enum as enum ('fresher', 'intermediate', 'expert');
exception when duplicate_object then null; end $$;

do $$ begin
  create type duration_unit_enum as enum ('days', 'weeks', 'months', 'years');
exception when duplicate_object then null; end $$;

do $$ begin
  create type compensation_type_enum as enum ('monthly', 'annually', 'lumpsum', 'hourly');
exception when duplicate_object then null; end $$;

do $$ begin
  create type source_enum as enum ('unstop', 'internshala', 'apna', 'linkedin', 'adzuna');
exception when duplicate_object then null; end $$;


-- =============================================================
-- 2. OPPORTUNITIES
-- =============================================================

create table opportunities (
  -- identity
  id                    bigint        generated always as identity primary key,
  external_id           text          not null,
  source                source_enum   not null,
  source_url            text          not null default '',

  -- listing details
  title                 text          not null,
  type                  opportunity_type not null default 'internship',
  employment_type       employment_type_enum,

  -- company
  company_name          text          not null default '',
  company_logo          text          not null default '',
  company_website       text          not null default '',

  -- description
  description           text          not null default '',
  short_description     text          not null default '',

  -- compensation
  compensation_min      integer       not null default 0 check (compensation_min >= 0),
  compensation_max      integer       not null default 0 check (compensation_max >= 0),
  compensation_currency char(3)       not null default 'INR',
  compensation_type     compensation_type_enum not null default 'monthly',
  is_paid               boolean       not null default false,

  -- structured JSON fields
  locations             jsonb         not null default '[]',   -- [{ city, state, country, is_remote }]
  skills                jsonb         not null default '[]',   -- ["Python", "React"]
  categories            jsonb         not null default '[]',
  tags                  jsonb         not null default '[]',

  -- experience
  experience_min        smallint      not null default 0 check (experience_min >= 0),
  experience_max        smallint      not null default 0,
  experience_level      experience_level_enum not null default 'fresher',

  -- duration (for internships)
  duration_value        smallint      not null default 0,
  duration_unit         duration_unit_enum not null default 'months',

  -- application
  deadline              date,
  applicants_count      integer       not null default 0,
  is_active             boolean       not null default true,
  apply_url             text          not null default '',

  -- timestamps
  posted_date           timestamptz,
  fetched_at            timestamptz   not null default now(),
  last_updated          timestamptz   not null default now(),

  -- constraints
  constraint opportunities_source_external_id_key unique (source, external_id),
  constraint comp_max_gte_min check (compensation_max >= compensation_min),
  constraint exp_max_gte_min  check (experience_max  >= experience_min)
);

-- common query indexes
create index idx_opp_source       on opportunities (source);
create index idx_opp_type         on opportunities (type);
create index idx_opp_is_active    on opportunities (is_active);
create index idx_opp_fetched_at   on opportunities (fetched_at desc);
create index idx_opp_comp_min     on opportunities (compensation_min);
create index idx_opp_posted_date  on opportunities (posted_date desc nulls last);

-- full-text search on title + company
create index idx_opp_fts on opportunities
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(company_name, '')));

-- RLS — opportunities are public read, only the backend service role can write
alter table opportunities enable row level security;

create policy "Public can read active opportunities"
  on opportunities for select
  using (is_active = true);


-- =============================================================
-- 3. WISHLIST
-- =============================================================

create table wishlist (
  id              bigint      generated always as identity primary key,
  user_id         uuid        not null references auth.users (id) on delete cascade,
  opportunity_id  bigint      not null references opportunities (id) on delete cascade,
  created_at      timestamptz not null default now(),

  constraint wishlist_user_opportunity_key unique (user_id, opportunity_id)
);

create index idx_wishlist_user_id on wishlist (user_id);

-- RLS — each user can only touch their own rows
alter table wishlist enable row level security;

create policy "Users can view own wishlist"
  on wishlist for select
  using (auth.uid() = user_id);

create policy "Users can insert own wishlist"
  on wishlist for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own wishlist"
  on wishlist for delete
  using (auth.uid() = user_id);


-- =============================================================
-- 4. HELPER FUNCTIONS
-- =============================================================

-- efficient per-source count (replaces full-table JS scan)
create or replace function get_source_counts()
returns table (source text, count bigint)
language sql stable
as $$
  select source::text, count(*) from opportunities group by source;
$$;

-- auto-update last_updated on any row change
create or replace function set_last_updated()
returns trigger language plpgsql as $$
begin
  new.last_updated = now();
  return new;
end;
$$;

create trigger trg_opportunities_last_updated
  before update on opportunities
  for each row execute function set_last_updated();


-- =============================================================
-- 5. USERS  (profile + preferences, extends auth.users)
-- =============================================================

create table users (
  id                  uuid          primary key references auth.users (id) on delete cascade,
  name                text          not null default '',
  current_position    text          not null default '',
  location            text          not null default '',
  skills              jsonb         not null default '[]',
  job_preferences     jsonb         not null default '{}',
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

alter table users enable row level security;

create policy "Users can read own profile"
  on users for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on users for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on users for update using (auth.uid() = id);

create trigger trg_users_updated_at
  before update on users
  for each row execute function set_last_updated();


-- =============================================================
-- 6. APPLICATIONS  (kanban pipeline)
-- =============================================================

do $$ begin
  create type application_stage as enum ('saved', 'applied', 'interview', 'offer', 'rejected');
exception when duplicate_object then null; end $$;

create table applications (
  id                  bigint        generated always as identity primary key,
  user_id             uuid          not null references auth.users (id) on delete cascade,
  opportunity_id      bigint        not null references opportunities (id) on delete cascade,
  stage               application_stage not null default 'saved',
  notes               text          not null default '',
  resume_id           bigint,
  applied_at          timestamptz,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now(),

  constraint applications_user_opportunity_key unique (user_id, opportunity_id)
);

create index idx_applications_user_id    on applications (user_id);
create index idx_applications_stage      on applications (user_id, stage);

alter table applications enable row level security;

create policy "Users can read own applications"
  on applications for select using (auth.uid() = user_id);

create policy "Users can insert own applications"
  on applications for insert with check (auth.uid() = user_id);

create policy "Users can update own applications"
  on applications for update using (auth.uid() = user_id);

create policy "Users can delete own applications"
  on applications for delete using (auth.uid() = user_id);

create trigger trg_applications_updated_at
  before update on applications
  for each row execute function set_last_updated();


-- =============================================================
-- 7. INTERVIEW ROUNDS  (sub-records per application)
-- =============================================================

do $$ begin
  create type round_status as enum ('pending', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

create table interview_rounds (
  id                  bigint        generated always as identity primary key,
  application_id      bigint        not null references applications (id) on delete cascade,
  round_name          text          not null,
  scheduled_at        timestamptz,
  status              round_status  not null default 'pending',
  notes               text          not null default '',
  created_at          timestamptz   not null default now()
);

create index idx_rounds_application_id on interview_rounds (application_id);

alter table interview_rounds enable row level security;

-- Inherit ownership through applications
create policy "Users can read own rounds"
  on interview_rounds for select
  using (
    exists (
      select 1 from applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = auth.uid()
    )
  );

create policy "Users can insert own rounds"
  on interview_rounds for insert
  with check (
    exists (
      select 1 from applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = auth.uid()
    )
  );

create policy "Users can update own rounds"
  on interview_rounds for update
  using (
    exists (
      select 1 from applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = auth.uid()
    )
  );

create policy "Users can delete own rounds"
  on interview_rounds for delete
  using (
    exists (
      select 1 from applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = auth.uid()
    )
  );
