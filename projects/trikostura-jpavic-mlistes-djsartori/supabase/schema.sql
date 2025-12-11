-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum types (drop and recreate if exists)
drop type if exists user_role cascade;
create type user_role as enum ('student', 'admin');

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  university text,
  study_program text,
  role user_role default 'student',
  reputation integer default 0,
  email_verified boolean default false,
  follower_count integer default 0,
  following_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  color text,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Topics table
create table topics (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  content text not null,
  author_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  is_pinned boolean default false,
  is_locked boolean default false,
  view_count integer default 0,
  reply_count integer default 0,
  last_reply_at timestamp with time zone,
  last_reply_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Replies table
create table replies (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  author_id uuid references profiles(id) on delete cascade not null,
  topic_id uuid references topics(id) on delete cascade not null,
  parent_reply_id uuid references replies(id) on delete cascade,
  is_solution boolean default false,
  upvotes integer default 0,
  downvotes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Votes table (for tracking user votes on replies)
create table votes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  reply_id uuid references replies(id) on delete cascade not null,
  vote_type integer not null check (vote_type in (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, reply_id)
);

-- Topic views table (for tracking unique views)
create table topic_views (
  id uuid default uuid_generate_v4() primary key,
  topic_id uuid references topics(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade,
  ip_address inet,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index idx_topics_category on topics(category_id);
create index idx_topics_author on topics(author_id);
create index idx_topics_created_at on topics(created_at desc);
create index idx_topics_slug on topics(slug);
create index idx_replies_topic on replies(topic_id);
create index idx_replies_author on replies(author_id);
create index idx_replies_created_at on replies(created_at);
create index idx_votes_reply on votes(reply_id);
create index idx_votes_user on votes(user_id);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table categories enable row level security;
alter table topics enable row level security;
alter table replies enable row level security;
alter table votes enable row level security;
alter table topic_views enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Categories policies
create policy "Categories are viewable by everyone"
  on categories for select
  using (true);

create policy "Only admins can insert categories"
  on categories for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Only admins can update categories"
  on categories for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Only admins can delete categories"
  on categories for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Topics policies
create policy "Topics are viewable by everyone"
  on topics for select
  using (true);

create policy "Authenticated users can create topics"
  on topics for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own topics"
  on topics for update
  using (auth.uid() = author_id or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

create policy "Authors and admins can delete topics"
  on topics for delete
  using (auth.uid() = author_id or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

-- Replies policies
create policy "Replies are viewable by everyone"
  on replies for select
  using (true);

create policy "Authenticated users can create replies"
  on replies for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own replies"
  on replies for update
  using (auth.uid() = author_id or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

create policy "Authors and admins can delete replies"
  on replies for delete
  using (auth.uid() = author_id or exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  ));

-- Votes policies
create policy "Users can view all votes"
  on votes for select
  using (true);

create policy "Users can insert own votes"
  on votes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own votes"
  on votes for delete
  using (auth.uid() = user_id);

create policy "Users can update own votes"
  on votes for update
  using (auth.uid() = user_id);

-- Topic views policies
create policy "Anyone can insert topic views"
  on topic_views for insert
  with check (true);

-- Functions and triggers

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to all tables
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_categories_updated_at before update on categories
  for each row execute procedure update_updated_at_column();

create trigger update_topics_updated_at before update on topics
  for each row execute procedure update_updated_at_column();

create trigger update_replies_updated_at before update on replies
  for each row execute procedure update_updated_at_column();

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update topic reply count and last reply info
create or replace function update_topic_reply_stats()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update topics
    set
      reply_count = reply_count + 1,
      last_reply_at = new.created_at,
      last_reply_by = new.author_id
    where id = new.topic_id;
  elsif TG_OP = 'DELETE' then
    update topics
    set reply_count = reply_count - 1
    where id = old.topic_id;
  end if;
  return null;
end;
$$ language plpgsql;

-- Trigger for reply stats
create trigger update_topic_reply_stats_trigger
  after insert or delete on replies
  for each row execute procedure update_topic_reply_stats();

-- Function to update vote counts
create or replace function update_reply_vote_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.vote_type = 1 then
      update replies set upvotes = upvotes + 1 where id = new.reply_id;
    else
      update replies set downvotes = downvotes + 1 where id = new.reply_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if old.vote_type = 1 then
      update replies set upvotes = upvotes - 1 where id = old.reply_id;
    else
      update replies set downvotes = downvotes - 1 where id = old.reply_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if old.vote_type = 1 and new.vote_type = -1 then
      update replies set upvotes = upvotes - 1, downvotes = downvotes + 1 where id = new.reply_id;
    elsif old.vote_type = -1 and new.vote_type = 1 then
      update replies set downvotes = downvotes - 1, upvotes = upvotes + 1 where id = new.reply_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

-- Trigger for vote counts
create trigger update_reply_vote_counts_trigger
  after insert or update or delete on votes
  for each row execute procedure update_reply_vote_counts();

-- Insert default categories
insert into categories (name, slug, description, icon, color, order_index) values
  ('Opće', 'opce', 'Opće rasprave i teme za sve studente', '💬', '#3B82F6', 1),
  ('Pitanja i Odgovori', 'pitanja', 'Postavi pitanje ili pomogni drugima', '❓', '#10B981', 2),
  ('Studij', 'studij', 'Diskusije o studiju, ispitima i kolegijima', '📚', '#8B5CF6', 3),
  ('Karijera', 'karijera', 'Savjeti o karijeri, praksama i poslovima', '💼', '#F59E0B', 4),
  ('Tehnologija', 'tehnologija', 'Tech razgovori i najnovije vijesti', '💻', '#EF4444', 5),
  ('Off-topic', 'off-topic', 'Casual razgovori i zabava', '🎮', '#6B7280', 6);
