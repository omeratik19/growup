-- Bildirim Sistemi Tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'project_shared')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS (Row Level Security) Politikaları
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Kullanıcılar kendi bildirimlerini okundu olarak işaretleyebilir
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Sistem bildirim oluşturabilir
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Otomatik updated_at güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Bildirim oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_from_user_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_type VARCHAR(50),
    p_message TEXT
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, from_user_id, project_id, type, message)
    VALUES (p_user_id, p_from_user_id, p_project_id, p_type, p_message)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Beğeni bildirimi tetikleyicisi
CREATE OR REPLACE FUNCTION handle_project_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    liker_username TEXT;
BEGIN
    -- Proje sahibinin ID'sini al
    SELECT user_id INTO project_owner_id 
    FROM projects 
    WHERE id = NEW.project_id;
    
    -- Beğenen kullanıcının kullanıcı adını al
    SELECT username INTO liker_username 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Proje sahibi kendisi değilse bildirim oluştur
    IF project_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            project_owner_id,
            NEW.user_id,
            NEW.project_id,
            'like',
            liker_username || ' projeni beğendi! ❤️'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Beğeni silme bildirimi tetikleyicisi
CREATE OR REPLACE FUNCTION handle_project_unlike_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Beğeni silindiğinde bildirim de sil
    DELETE FROM notifications 
    WHERE from_user_id = OLD.user_id 
    AND project_id = OLD.project_id 
    AND type = 'like';
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Tetikleyicileri oluştur
DROP TRIGGER IF EXISTS trigger_project_like_notification ON project_likes;
CREATE TRIGGER trigger_project_like_notification
    AFTER INSERT ON project_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_like_notification();

DROP TRIGGER IF EXISTS trigger_project_unlike_notification ON project_likes;
CREATE TRIGGER trigger_project_unlike_notification
    AFTER DELETE ON project_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_unlike_notification();

-- Takip bildirimi tetikleyicisi
CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    follower_username TEXT;
BEGIN
    -- Takip eden kullanıcının kullanıcı adını al
    SELECT username INTO follower_username 
    FROM profiles 
    WHERE id = NEW.follower_id;
    
    -- Takip edilen kişi kendisi değilse bildirim oluştur
    IF NEW.following_id != NEW.follower_id THEN
        PERFORM create_notification(
            NEW.following_id,
            NEW.follower_id,
            NULL,
            'follow',
            follower_username || ' seni takip etmeye başladı! 👥'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Takip tetikleyicisi
DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
    AFTER INSERT ON follows
    FOR EACH ROW
    EXECUTE FUNCTION handle_follow_notification();

-- Yorum bildirimi tetikleyicisi
CREATE OR REPLACE FUNCTION handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_id UUID;
    commenter_username TEXT;
BEGIN
    -- Proje sahibinin ID'sini al
    SELECT user_id INTO project_owner_id 
    FROM projects 
    WHERE id = NEW.project_id;
    
    -- Yorum yapan kullanıcının kullanıcı adını al
    SELECT username INTO commenter_username 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Proje sahibi kendisi değilse bildirim oluştur
    IF project_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            project_owner_id,
            NEW.user_id,
            NEW.project_id,
            'comment',
            commenter_username || ' projene yorum yaptı: "' || LEFT(NEW.content, 50) || '" 💬'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yorum tetikleyicisi
DROP TRIGGER IF EXISTS trigger_comment_notification ON project_comments;
CREATE TRIGGER trigger_comment_notification
    AFTER INSERT ON project_comments
    FOR EACH ROW
    EXECUTE FUNCTION handle_comment_notification();

-- Proje paylaşımı bildirimi tetikleyicisi
CREATE OR REPLACE FUNCTION handle_project_shared_notification()
RETURNS TRIGGER AS $$
DECLARE
    project_owner_username TEXT;
    follower_id UUID;
BEGIN
    -- Proje sahibinin kullanıcı adını al
    SELECT username INTO project_owner_username 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- Proje sahibinin takipçilerine bildirim gönder
    FOR follower_id IN 
        SELECT follower_id 
        FROM follows 
        WHERE following_id = NEW.user_id
    LOOP
        PERFORM create_notification(
            follower_id,
            NEW.user_id,
            NEW.id,
            'project_shared',
            project_owner_username || ' yeni bir proje paylaştı: "' || NEW.title || '" 🚀'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Proje paylaşımı tetikleyicisi
DROP TRIGGER IF EXISTS trigger_project_shared_notification ON projects;
CREATE TRIGGER trigger_project_shared_notification
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_shared_notification(); 