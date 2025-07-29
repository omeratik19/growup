-- Mevcut storage policies'leri kontrol et
SELECT * FROM storage.policies WHERE bucket_id = 'post-media';

-- Eğer policy yoksa, basit bir policy oluştur
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
    'Allow all authenticated users',
    'post-media',
    '{"role": "authenticated", "policy": "allow"}'
) ON CONFLICT DO NOTHING; 