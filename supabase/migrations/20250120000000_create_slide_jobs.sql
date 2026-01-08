-- Create slide_jobs table for Level-6 PPT rendering
CREATE TABLE IF NOT EXISTS slide_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES researches(id) ON DELETE SET NULL,
  research_id UUID REFERENCES researches(id) ON DELETE SET NULL,
  ppt_plan JSONB NOT NULL,
  template TEXT DEFAULT 'default',
  template_drive_id TEXT,
  presentation_style TEXT DEFAULT 'executive' CHECK (presentation_style IN ('executive', 'technical', 'visual', 'academic')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  final_ppt_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_slide_jobs_user_id ON slide_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_jobs_status ON slide_jobs(status);
CREATE INDEX IF NOT EXISTS idx_slide_jobs_research_id ON slide_jobs(research_id);

-- Enable RLS
ALTER TABLE slide_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own jobs
CREATE POLICY "Users can view own slide jobs"
  ON slide_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own jobs
CREATE POLICY "Users can create own slide jobs"
  ON slide_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can do everything (for backend updates)
CREATE POLICY "Service role full access"
  ON slide_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_slide_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_slide_jobs_updated_at
  BEFORE UPDATE ON slide_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_slide_jobs_updated_at();

-- Create storage bucket for PPT files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ppt-results', 'ppt-results', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Users can upload/download their own PPTs
CREATE POLICY "Users can upload own PPTs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ppt-results' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view PPTs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ppt-results');

