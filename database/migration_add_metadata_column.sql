-- Add metadata column to research_reports table
ALTER TABLE research_reports 
ADD COLUMN IF NOT EXISTS metadata TEXT;

