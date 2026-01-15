-- Supabase RLS Policies for Secure Dataset Storage
-- These policies should be applied in your Supabase dashboard

-- Enable RLS on the datasets table
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to insert datasets
CREATE POLICY "Authenticated users can create datasets"
ON datasets
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Policy for users to select their own datasets
CREATE POLICY "Users can view own datasets"
ON datasets
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy for users to update their own datasets
CREATE POLICY "Users can update own datasets"
ON datasets
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Policy for users to delete their own datasets
CREATE POLICY "Users can delete own datasets"
ON datasets
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);

-- Enable RLS on the storage objects for the datasets bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets' AND
  (storage.foldername(name))[1] = auth.uid()::text
);