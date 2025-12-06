-- Add advanced profile customization fields to profiles table

-- Social media and portfolio links
alter table profiles add column if not exists github_url text;
alter table profiles add column if not exists linkedin_url text;
alter table profiles add column if not exists website_url text;
alter table profiles add column if not exists twitter_url text;

-- Extended academic information
alter table profiles add column if not exists year_of_study integer check (year_of_study between 1 and 10);
alter table profiles add column if not exists graduation_year integer check (graduation_year between 1900 and 2100);
alter table profiles add column if not exists courses text; -- JSON array stored as text
alter table profiles add column if not exists academic_interests text; -- Comma-separated or JSON
alter table profiles add column if not exists skills text; -- JSON array stored as text

-- Profile theme customization
alter table profiles add column if not exists profile_color text default '#3B82F6'; -- Default blue color
alter table profiles add column if not exists profile_banner_url text;

-- Add indexes for performance
create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_profiles_email on profiles(email);

-- Add comments for documentation
comment on column profiles.github_url is 'GitHub profile URL';
comment on column profiles.linkedin_url is 'LinkedIn profile URL';
comment on column profiles.website_url is 'Personal website or portfolio URL';
comment on column profiles.twitter_url is 'Twitter/X profile URL';
comment on column profiles.year_of_study is 'Current year of study (1-10)';
comment on column profiles.graduation_year is 'Expected or actual graduation year';
comment on column profiles.courses is 'JSON array of courses/subjects';
comment on column profiles.academic_interests is 'Academic interests and research areas';
comment on column profiles.skills is 'JSON array of technical skills and technologies';
comment on column profiles.profile_color is 'Custom theme color for profile in hex format';
comment on column profiles.profile_banner_url is 'URL to profile banner/header image';
