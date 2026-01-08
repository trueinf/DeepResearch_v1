-- Create token_usage table for cost tracking
-- Drop table if exists to avoid conflicts
DROP TABLE IF EXISTS token_usage CASCADE;

CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID,
  user_id UUID,
  function_name TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  input_cost_usd DECIMAL(10, 8) NOT NULL,
  output_cost_usd DECIMAL(10, 8) NOT NULL,
  total_cost_usd DECIMAL(10, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add foreign key constraints separately (if tables exist)
DO $$
BEGIN
  -- Add foreign key to researches if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'researches') THEN
    ALTER TABLE token_usage 
    ADD CONSTRAINT fk_token_usage_research_id 
    FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign key to auth.users if schema exists
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
      ALTER TABLE token_usage 
      ADD CONSTRAINT fk_token_usage_user_id 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_token_usage_research_id ON token_usage(research_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_function_name ON token_usage(function_name);

-- Create cost summary view (after table is created)
DROP VIEW IF EXISTS cost_summary CASCADE;

CREATE VIEW cost_summary AS
SELECT 
  research_id,
  user_id,
  function_name,
  model,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(input_cost_usd) as total_input_cost,
  SUM(output_cost_usd) as total_output_cost,
  SUM(total_cost_usd) as total_cost_usd,
  COUNT(*) as api_calls_count,
  MIN(created_at) as first_call,
  MAX(created_at) as last_call
FROM token_usage
GROUP BY research_id, user_id, function_name, model;

-- Enable RLS (Row Level Security)
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own token usage
CREATE POLICY "Users can view own token usage" ON token_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert token usage
CREATE POLICY "Service role can insert token usage" ON token_usage
  FOR INSERT
  WITH CHECK (true);

