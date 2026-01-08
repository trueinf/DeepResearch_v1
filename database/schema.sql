-- Create researches table
CREATE TABLE IF NOT EXISTS researches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'In Progress',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create research_reports table
CREATE TABLE IF NOT EXISTS research_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  executive_summary TEXT,
  key_findings JSONB,
  sources JSONB,
  detailed_analysis TEXT,
  insights TEXT,
  conclusion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(research_id)
);

-- Create chat_messages table for follow-up questions
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  research_id UUID NOT NULL REFERENCES researches(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_researches_status ON researches(status);
CREATE INDEX IF NOT EXISTS idx_researches_created_at ON researches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_reports_research_id ON research_reports(research_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_research_id ON chat_messages(research_id);

-- Enable Row Level Security (RLS)
ALTER TABLE researches ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (you can customize these based on your auth requirements)
-- For now, allowing all operations. You can add authentication later.
CREATE POLICY "Allow all operations on researches" ON researches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on research_reports" ON research_reports
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on chat_messages" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_researches_updated_at
  BEFORE UPDATE ON researches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_reports_updated_at
  BEFORE UPDATE ON research_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

