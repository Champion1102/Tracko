-- Tracko: photo attachments in the sponsor chat.
-- Paste into the Supabase SQL editor and Run once before deploying.

alter table nudges add column if not exists image_path text;
