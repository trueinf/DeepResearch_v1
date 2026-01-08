-- Migration: Add new columns to research_reports table
-- Run this in your Supabase SQL Editor

-- Add detailed_analysis column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'research_reports' 
    AND column_name = 'detailed_analysis'
  ) THEN
    ALTER TABLE research_reports 
    ADD COLUMN detailed_analysis TEXT;
  END IF;
END $$;

-- Add insights column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'research_reports' 
    AND column_name = 'insights'
  ) THEN
    ALTER TABLE research_reports 
    ADD COLUMN insights TEXT;
  END IF;
END $$;

-- Add conclusion column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'research_reports' 
    AND column_name = 'conclusion'
  ) THEN
    ALTER TABLE research_reports 
    ADD COLUMN conclusion TEXT;
  END IF;
END $$;

