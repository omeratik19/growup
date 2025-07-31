-- Follows tablosundaki tüm policy'leri sil
DROP POLICY IF EXISTS "Anyone can view follows" ON follows;
DROP POLICY IF EXISTS "Authenticated users can follow" ON follows;
DROP POLICY IF EXISTS "Takibi bırak" ON follows;
DROP POLICY IF EXISTS "Takip et" ON follows;
DROP POLICY IF EXISTS "Takip listesini görüntüle" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;
DROP POLICY IF EXISTS "Users can view follows" ON follows;
DROP POLICY IF EXISTS "Users can follow" ON follows;

-- RLS'yi geçici olarak kapat
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- Test için basit bir proje ekleme deneyin
-- Sonra bu SQL'i çalıştırın:

-- RLS'yi tekrar aç
-- ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Temiz policy'ler oluştur
-- CREATE POLICY "Users can view follows" ON follows
--     FOR SELECT USING (true);

-- CREATE POLICY "Users can follow" ON follows
--     FOR INSERT WITH CHECK (auth.uid() = follows.follower_id);

-- CREATE POLICY "Users can unfollow" ON follows
--     FOR DELETE USING (auth.uid() = follows.follower_id); 