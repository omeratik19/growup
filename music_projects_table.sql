-- Music Projects Table
CREATE TABLE IF NOT EXISTS music_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  audio_url TEXT,
  lyrics TEXT,
  duration TEXT,
  model TEXT DEFAULT 'v4',
  status TEXT DEFAULT 'completed',
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE music_projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own music projects" ON music_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own music projects" ON music_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music projects" ON music_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music projects" ON music_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_projects_user_id ON music_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_music_projects_created_at ON music_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_projects_status ON music_projects(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_music_projects_updated_at 
  BEFORE UPDATE ON music_projects 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 