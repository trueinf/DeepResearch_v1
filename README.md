# AskDepth - Deep Research Application

A modern, premium web application for conducting deep research similar to ChatGPT's Deep Research mode.

## Features

- **Home Page**: Enter research topics with advanced options (Depth, Timeframe, Sources)
- **Research Progress**: Real-time progress tracking with animated timeline
- **Report View**: Comprehensive research reports with executive summary, key findings, and sources
- **Follow-up Chat**: Interactive chat interface for asking follow-up questions

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase project (get your credentials from https://app.supabase.com)

### Installation

```bash
npm install
```

### Environment Variables Setup

1. Create a `.env` file in the root directory:

```bash
# Copy the example file (if it exists) or create a new .env file
```

2. Add your Supabase credentials to the `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**How to get your Supabase credentials:**
- Go to your Supabase project dashboard: https://app.supabase.com
- Navigate to **Settings** → **API**
- Copy the **Project URL** and paste it as `VITE_SUPABASE_URL`
- Copy the **anon/public** key and paste it as `VITE_SUPABASE_ANON_KEY`

**Example:**
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTg3NjU4MCwiZXhwIjoxOTYxNDUyNTgwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **Restart your development server** after creating/updating the `.env` file

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Tech Stack

- React 18
- React Router
- Tailwind CSS
- Vite
- Lucide React (Icons)

## Design

- Modern, clean interface
- Premium styling with soft shadows and rounded corners
- Inter font family
- Responsive layout

