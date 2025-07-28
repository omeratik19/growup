-- Conversations tablosu
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants tablosu
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Messages tablosu
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

-- Conversation participants policies
CREATE POLICY "Users can view conversation participants for their conversations" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert conversation participants" ON conversation_participants
    FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages from their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Updated at trigger for conversations
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_updated_at_trigger
    AFTER INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at(); 