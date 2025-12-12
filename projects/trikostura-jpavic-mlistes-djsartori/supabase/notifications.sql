-- Notifications System Schema
-- Run this in Supabase SQL Editor after running schema.sql

-- Create notification type enum
create type notification_type as enum (
  'reply_to_topic',
  'reply_to_reply',
  'upvote',
  'topic_pinned',
  'topic_locked',
  'mention'
);

-- Notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  type notification_type not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean default false,
  actor_id uuid references profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  reply_id uuid references replies(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for notifications
create index idx_notifications_user on notifications(user_id, created_at desc);
create index idx_notifications_read on notifications(user_id, is_read);

-- Enable Row Level Security
alter table notifications enable row level security;

-- RLS Policies for notifications
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on notifications for insert
  with check (true);

-- Function to create notification
create or replace function create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_link text default null,
  p_actor_id uuid default null,
  p_topic_id uuid default null,
  p_reply_id uuid default null
) returns uuid as $$
declare
  v_notification_id uuid;
begin
  -- Don't create notification if actor is the same as user
  if p_actor_id = p_user_id then
    return null;
  end if;

  insert into notifications (user_id, type, title, message, link, actor_id, topic_id, reply_id)
  values (p_user_id, p_type, p_title, p_message, p_link, p_actor_id, p_topic_id, p_reply_id)
  returning id into v_notification_id;

  return v_notification_id;
end;
$$ language plpgsql security definer;

-- Trigger function for new reply to topic
create or replace function notify_topic_reply()
returns trigger as $$
declare
  v_topic record;
  v_actor record;
begin
  -- Get topic details
  select * into v_topic from topics where id = new.topic_id;

  -- Get actor details
  select username into v_actor from profiles where id = new.author_id;

  -- Notify topic author
  if v_topic.author_id != new.author_id then
    perform create_notification(
      v_topic.author_id,
      'reply_to_topic',
      'Novi odgovor na tvoju temu',
      v_actor.username || ' je odgovorio/la na temu "' || v_topic.title || '"',
      '/forum/topic/' || v_topic.slug,
      new.author_id,
      new.topic_id,
      new.id
    );
  end if;

  -- If reply has a parent, notify parent reply author
  if new.parent_reply_id is not null then
    declare
      v_parent_reply record;
    begin
      select * into v_parent_reply from replies where id = new.parent_reply_id;

      if v_parent_reply.author_id != new.author_id then
        perform create_notification(
          v_parent_reply.author_id,
          'reply_to_reply',
          'Novi odgovor na tvoj komentar',
          v_actor.username || ' je odgovorio/la na tvoj komentar',
          '/forum/topic/' || v_topic.slug,
          new.author_id,
          new.topic_id,
          new.id
        );
      end if;
    end;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger function for upvotes
create or replace function notify_upvote()
returns trigger as $$
declare
  v_reply record;
  v_topic record;
  v_actor record;
begin
  -- Only notify on upvotes, not downvotes
  if new.vote_type = 1 then
    -- Get reply and topic details
    select r.*, t.slug as topic_slug, t.title as topic_title
    into v_reply
    from replies r
    join topics t on r.topic_id = t.id
    where r.id = new.reply_id;

    -- Get actor details
    select username into v_actor from profiles where id = new.user_id;

    -- Notify reply author
    if v_reply.author_id != new.user_id then
      perform create_notification(
        v_reply.author_id,
        'upvote',
        'Netko je upvote-ao tvoj odgovor',
        v_actor.username || ' je dao/la upvote na tvoj odgovor u "' || v_reply.topic_title || '"',
        '/forum/topic/' || v_reply.topic_slug,
        new.user_id,
        v_reply.topic_id,
        new.reply_id
      );
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger function for pinned topics
create or replace function notify_topic_pinned()
returns trigger as $$
declare
  v_topic record;
begin
  -- Only notify when topic becomes pinned (not when unpinned)
  if new.is_pinned = true and (old.is_pinned is null or old.is_pinned = false) then
    select * into v_topic from topics where id = new.id;

    perform create_notification(
      v_topic.author_id,
      'topic_pinned',
      'Tvoja tema je prikvačena',
      'Tvoja tema "' || v_topic.title || '" je prikvačena od strane admina',
      '/forum/topic/' || v_topic.slug,
      null,
      new.id,
      null
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_reply_created
  after insert on replies
  for each row
  execute function notify_topic_reply();

create trigger on_vote_created
  after insert on votes
  for each row
  execute function notify_upvote();

create trigger on_topic_pinned
  after update on topics
  for each row
  when (new.is_pinned is distinct from old.is_pinned)
  execute function notify_topic_pinned();

-- Grant permissions
grant usage on type notification_type to authenticated;
grant all on notifications to authenticated;
