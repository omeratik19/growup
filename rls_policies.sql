-- RLS Policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (
        id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (true);

-- RLS Policies for conversation_participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view conversation participants for their conversations" ON conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can insert conversation participants" ON conversation_participants
    FOR INSERT WITH CHECK (true);

-- RLS Policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view messages from their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can insert messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id 
            FROM conversation_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY IF NOT EXISTS "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid()); 