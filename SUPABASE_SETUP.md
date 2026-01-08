# Supabase Setup Guide

Follow these steps to connect your AskDepth application to Supabase.

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/vvrulvxeaejxhwnafwrq
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API** in the settings menu
4. Copy the following:
   - **Project URL** (found under "Project URL")
   - **anon public** key (found under "Project API keys" → "anon public")

## Step 2: Create Environment File

1. Create a `.env` file in the root of your project (same directory as `package.json`)
2. Add the following content:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 1

## Step 3: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `database/schema.sql` from this project
5. Copy all the SQL code and paste it into the SQL Editor
6. Click **Run** to execute the SQL

This will create:
- `researches` table - stores research topics and status
- `research_reports` table - stores completed research reports
- `chat_messages` table - stores follow-up chat messages
- Indexes for better performance
- Row Level Security policies (currently allowing all operations)

## Step 4: Restart Development Server

After setting up the environment variables, restart your development server:

```bash
npm run dev
```

## Verification

Once everything is set up:
1. The app will automatically load existing researches from Supabase on startup
2. New researches will be saved to Supabase
3. Reports and chat messages will be persisted in the database

## Troubleshooting

- **Error: "Missing Supabase environment variables"**
  - Make sure your `.env` file exists and contains the correct variables
  - Restart the development server after creating/updating `.env`

- **Error: "relation does not exist"**
  - Make sure you've run the SQL schema from `database/schema.sql` in your Supabase SQL Editor

- **Error: "permission denied"**
  - Check your Row Level Security policies in Supabase
  - The schema includes policies that allow all operations, but you may need to adjust them based on your authentication setup

