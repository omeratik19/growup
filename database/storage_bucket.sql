-- Supabase Storage Bucket oluşturma
-- Bu script'i Supabase SQL Editor'da çalıştırın

-- product-images bucket'ını oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket için RLS politikaları
-- Herkes public bucket'tan dosya okuyabilir
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated kullanıcılar dosya yükleyebilir
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Kullanıcılar kendi yükledikleri dosyaları silebilir
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Kullanıcılar kendi yükledikleri dosyaları güncelleyebilir
CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 