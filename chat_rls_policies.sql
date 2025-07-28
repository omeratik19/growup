-- Mesajlaşma Sistemi RLS Politikaları

-- Conversations tablosu için RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar katıldıkları sohbetleri görebilir
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = conversations.id 
            AND user_id = auth.uid()
        )
    );

-- Sistem sohbet oluşturabilir
CREATE POLICY "System can insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

-- Conversation Participants tablosu için RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar katıldıkları sohbetlerin katılımcılarını görebilir
CREATE POLICY "Users can view participants of their conversations" ON conversation_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = conversation_participants.conversation_id
            AND cp2.user_id = auth.uid()
        )
    );

-- Kullanıcılar sohbete katılabilir
CREATE POLICY "Users can join conversations" ON conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar sohbetten ayrılabilir
CREATE POLICY "Users can leave conversations" ON conversation_participants
    FOR DELETE USING (auth.uid() = user_id);

-- Messages tablosu için RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar katıldıkları sohbetlerin mesajlarını görebilir
CREATE POLICY "Users can view messages of their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversation_participants
            WHERE conversation_id = messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Kullanıcılar mesaj gönderebilir
CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Kullanıcılar kendi mesajlarını güncelleyebilir
CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Kullanıcılar kendi mesajlarını silebilir
CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Updated at trigger'ları
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 