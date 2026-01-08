-- Create model_configurations table
CREATE TABLE IF NOT EXISTS public.model_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_content TEXT NOT NULL,
  document_format TEXT DEFAULT 'text',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'model_configurations_document_content_key'
  ) THEN
    ALTER TABLE public.model_configurations 
    ADD CONSTRAINT model_configurations_document_content_key 
    UNIQUE (document_content);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.model_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read active models
CREATE POLICY "Allow read active models"
  ON public.model_configurations
  FOR SELECT
  USING (is_active = true);

-- Policy: Allow service role to manage models (for seeding)
-- This is handled by service role key, no policy needed for inserts

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_model_configurations_active 
  ON public.model_configurations(is_active) 
  WHERE is_active = true;

-- Seed default models
INSERT INTO public.model_configurations (document_content, document_format, version, is_active)
VALUES
  ('Provider: Gemini Model: gemini-1.5-pro-latest', 'text', 1, true),
  ('Provider: Claude Model: claude-sonnet-4-20250514', 'text', 1, true)
ON CONFLICT (document_content) DO NOTHING;

