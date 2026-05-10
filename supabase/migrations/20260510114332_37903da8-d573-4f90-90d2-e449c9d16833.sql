-- Restrict community-images uploads to the authenticated user's own folder
DROP POLICY IF EXISTS "Authenticated users can upload to community-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to community-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload community images" ON storage.objects;

CREATE POLICY "Users can upload to their own folder in community-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update files in their own community-images folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'community-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
