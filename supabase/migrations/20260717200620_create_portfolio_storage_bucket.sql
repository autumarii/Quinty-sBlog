/*
# Create storage bucket for portfolio images

1. Storage
- Create a public bucket named 'portfolio-images' for storing uploaded art piece images.
- Set the bucket to public so images can be viewed by visitors.

2. Storage Policies
- Allow anon + authenticated to SELECT (read) images from the bucket.
- Allow anon + authenticated to INSERT (upload) images to the bucket.
- Allow anon + authenticated to UPDATE images in the bucket.
- Allow anon + authenticated to DELETE images from the bucket.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to portfolio images
DROP POLICY IF EXISTS "anon_read_portfolio_images" ON storage.objects;
CREATE POLICY "anon_read_portfolio_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio-images');

-- Allow public insert access to portfolio images
DROP POLICY IF EXISTS "anon_insert_portfolio_images" ON storage.objects;
CREATE POLICY "anon_insert_portfolio_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'portfolio-images');

-- Allow public update access to portfolio images
DROP POLICY IF EXISTS "anon_update_portfolio_images" ON storage.objects;
CREATE POLICY "anon_update_portfolio_images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'portfolio-images')
WITH CHECK (bucket_id = 'portfolio-images');

-- Allow public delete access to portfolio images
DROP POLICY IF EXISTS "anon_delete_portfolio_images" ON storage.objects;
CREATE POLICY "anon_delete_portfolio_images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'portfolio-images');
