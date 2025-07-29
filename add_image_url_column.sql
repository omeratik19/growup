-- Posts tablosuna image_url kolonu ekle
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT; 