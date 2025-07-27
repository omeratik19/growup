-- Proje yorumları tablosu
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proje yorum sayısını artıran fonksiyon
CREATE OR REPLACE FUNCTION increment_project_comments(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET comments = COALESCE(comments, 0) + 1 
  WHERE id = project_id;
  
  RAISE NOTICE 'Project comments incremented for project %', project_id;
END;
$$ LANGUAGE plpgsql;

-- Proje yorum sayısını azaltan fonksiyon
CREATE OR REPLACE FUNCTION decrement_project_comments(project_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET comments = GREATEST(COALESCE(comments, 0) - 1, 0) 
  WHERE id = project_id;
  
  RAISE NOTICE 'Project comments decremented for project %', project_id;
END;
$$ LANGUAGE plpgsql;

-- Projects tablosuna comments sütunu ekle (eğer yoksa)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

-- Yorum ekleme trigger'ı
CREATE OR REPLACE FUNCTION handle_project_comment_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM increment_project_comments(NEW.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yorum silme trigger'ı
CREATE OR REPLACE FUNCTION handle_project_comment_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM decrement_project_comments(OLD.project_id);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ları oluştur
DROP TRIGGER IF EXISTS project_comment_insert_trigger ON project_comments;
CREATE TRIGGER project_comment_insert_trigger
  AFTER INSERT ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_project_comment_insert();

DROP TRIGGER IF EXISTS project_comment_delete_trigger ON project_comments;
CREATE TRIGGER project_comment_delete_trigger
  AFTER DELETE ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION handle_project_comment_delete();

-- RLS (Row Level Security) politikaları
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Herkes yorumları okuyabilir
CREATE POLICY "Anyone can read project comments" ON project_comments
  FOR SELECT USING (true);

-- Giriş yapmış kullanıcılar yorum ekleyebilir
CREATE POLICY "Authenticated users can insert project comments" ON project_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar sadece kendi yorumlarını silebilir
CREATE POLICY "Users can delete their own project comments" ON project_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Kullanıcılar sadece kendi yorumlarını güncelleyebilir
CREATE POLICY "Users can update their own project comments" ON project_comments
  FOR UPDATE USING (auth.uid() = user_id); 