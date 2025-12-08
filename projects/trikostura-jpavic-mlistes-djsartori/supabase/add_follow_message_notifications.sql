-- Add follow and new_message notification types
-- Run this in Supabase SQL Editor

-- Add new enum values to notification_type
alter type notification_type add value 'follow';
alter type notification_type add value 'new_message';
