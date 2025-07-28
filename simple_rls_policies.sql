-- Basit RLS Policies - sadece temel güvenlik
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Basit policies - giriş yapmış kullanıcılar her şeyi yapabilir
CREATE POLICY "Enable all for authenticated users" ON conversations
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all for authenticated users" ON conversation_participants
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all for authenticated users" ON messages
    FOR ALL USING (auth.uid() IS NOT NULL); 