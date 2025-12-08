-- Add follow and new_message notification types
-- Run this in Supabase SQL Editor

-- Add new enum values to notification_type (only if they don't exist)
do $$
begin
  -- Add 'follow' if it doesn't exist
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'notification_type'
    and e.enumlabel = 'follow'
  ) then
    alter type notification_type add value 'follow';
  end if;

  -- Add 'new_message' if it doesn't exist
  if not exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'notification_type'
    and e.enumlabel = 'new_message'
  ) then
    alter type notification_type add value 'new_message';
  end if;
end $$;
