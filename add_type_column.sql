-- Posts tablosuna type kolonu ekle
ALTER TABLE posts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'post';
 
-- Mevcut postlara varsayılan type değeri ata
UPDATE posts SET type = 'post' WHERE type IS NULL; 