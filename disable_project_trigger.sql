-- Projects tablosundaki trigger'ı geçici olarak devre dışı bırak
ALTER TABLE projects DISABLE TRIGGER trigger_project_shared_notification;

-- Test için proje ekleme deneyin
-- Eğer çalışırsa, trigger'ı tekrar açacağız 