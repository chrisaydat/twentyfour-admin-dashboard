-- Update bucket to ensure it's public (non-destructive)
UPDATE storage.buckets
SET public = true
WHERE id = 'images';

-- Set CORS configuration for the storage API (non-destructive)
-- Handle different column names in different Supabase versions
DO $$
BEGIN
    -- Check if cors_origins column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'storage' 
        AND table_name = 'buckets' 
        AND column_name = 'cors_origins'
    ) THEN
        -- Use cors_origins for newer Supabase versions
        EXECUTE 'UPDATE storage.buckets SET cors_origins = array[''*''] WHERE id = ''images''';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'storage' 
        AND table_name = 'buckets' 
        AND column_name = 'cors'
    ) THEN
        -- Use cors for older Supabase versions
        EXECUTE 'UPDATE storage.buckets SET cors = array[''*''] WHERE id = ''images''';
    END IF;
END
$$;

-- Make sure RLS is enabled (this is generally safe)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Only create policies if they don't exist (non-destructive)
DO $$
BEGIN
    -- Check if Public Access policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public Access'
    ) THEN
        -- Create the policy only if it doesn't exist
        EXECUTE 'CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = ''images'')';
    END IF;
    
    -- Check if Allow authenticated uploads policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated uploads'
    ) THEN
        -- Create the policy only if it doesn't exist
        EXECUTE 'CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = ''images'' AND auth.role() = ''authenticated'')';
    END IF;
    
    -- Check if Users can delete own images policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete own images'
    ) THEN
        -- Create the policy only if it doesn't exist
        EXECUTE 'CREATE POLICY "Users can delete own images" ON storage.objects FOR DELETE USING (bucket_id = ''images'' AND auth.uid() = owner)';
    END IF;
    
    -- Check if Users can update own images policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update own images'
    ) THEN
        -- Create the policy only if it doesn't exist
        EXECUTE 'CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = ''images'' AND auth.uid() = owner) WITH CHECK (bucket_id = ''images'' AND auth.uid() = owner)';
    END IF;
END
$$; 