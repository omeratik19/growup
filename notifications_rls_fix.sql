-- Notifications için basit RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Eski policies'leri sil (eğer varsa)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Yeni basit policies
CREATE POLICY "Enable all for authenticated users" ON notifications
    FOR ALL USING (auth.uid() IS NOT NULL); 