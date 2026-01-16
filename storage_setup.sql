-- Storage Bucket Setup Script
-- Run this in your Supabase SQL editor to properly configure storage buckets

-- Create datasets bucket with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datasets',
  'datasets',
  false,
  104857600, -- 100MB limit
  ARRAY['text/csv', 'application/json', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY['text/csv', 'application/json', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

-- Storage RLS Policies for datasets bucket
-- Allow users to select their own files
CREATE POLICY IF NOT EXISTS "Users can view own dataset files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'datasets' AND owner = auth.uid());

-- Allow users to insert their own files
CREATE POLICY IF NOT EXISTS "Users can upload dataset files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'datasets' AND owner = auth.uid());

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own dataset files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'datasets' AND owner = auth.uid());

-- Storage RLS Policies for avatars bucket
-- Allow public read access for avatars
CREATE POLICY IF NOT EXISTS "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatars
CREATE POLICY IF NOT EXISTS "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow users to update their own avatars
CREATE POLICY IF NOT EXISTS "Users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

-- Allow users to delete their own avatars
CREATE POLICY IF NOT EXISTS "Users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());