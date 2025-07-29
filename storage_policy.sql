-- Storage bucket için RLS policies
-- post-media bucket'ına authenticated kullanıcılar için izin ver

-- Dosya yükleme izni
CREATE POLICY "Allow authenticated users to upload post media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'post-media' AND 
        auth.role() = 'authenticated'
    );

-- Dosya görüntüleme izni - HERKES görebilir
CREATE POLICY "Allow public to view post media" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'post-media'
    );

-- Dosya güncelleme izni
CREATE POLICY "Allow authenticated users to update post media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'post-media' AND 
        auth.role() = 'authenticated'
    );

-- Dosya silme izni
CREATE POLICY "Allow authenticated users to delete post media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'post-media' AND 
        auth.role() = 'authenticated'
    ); 