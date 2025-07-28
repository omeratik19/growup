-- Geçici test için RLS'yi devre dışı bırak
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY; 