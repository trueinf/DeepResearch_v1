# 🚀 How to Clone and Setup AskDepth Project

## 📥 Step 1: Clone the Repository

### If the repository is on GitHub:

```bash
# Clone the repository
git clone <repository-url>
cd askDepth_gemini
```

### If you have the repository locally:

```bash
# If you already have the files, navigate to the project directory
cd askDepth_gemini
```

---

## 🔧 Step 2: Install Dependencies

### Frontend Dependencies

```bash
# Install npm packages
npm install
```

This will install:
- React 18
- React Router
- Tailwind CSS
- Vite
- Supabase client
- PPTX generation library
- And other dependencies

---

## 🗄️ Step 3: Setup Supabase

### 3.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Note down your:
   - **Supabase URL** (e.g., `https://xxxxx.supabase.co`)
   - **Supabase Anon Key** (found in Settings → API)

### 3.2 Setup Database

Run the SQL migrations in your Supabase SQL Editor:

1. **Create profiles table:**
   - Run `create_profiles_table.sql`

2. **Create model configurations table:**
   - Run `create_model_configurations_table.sql`

3. **Run database migrations:**
   - Run files from `database/` folder:
     - `schema.sql`
     - `migration_add_metadata_column.sql`
     - `migration_add_report_columns.sql`
     - `migration_add_universal_research_output.sql`

### 3.3 Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy clarify-Questions-gemini
supabase functions deploy deep-Research-gemini
supabase functions deploy stream-research
supabase functions deploy chat-Research
supabase functions deploy build-research-graph
supabase functions deploy generate-ppt-agent
supabase functions deploy extract-file-text
```

**Or deploy via Supabase Dashboard:**
- Go to Edge Functions in Supabase Dashboard
- Create new functions and paste code from:
  - `1-clarify-Questions-gemini.ts`
  - `2-deep-Research-gemini.ts`
  - `3-stream-research.ts`
  - `4-chat-Research.ts`
  - `5-build-research-graph.ts`
  - `6-generate-ppt-agent.ts`

### 3.4 Set Environment Variables in Supabase

In Supabase Dashboard → Edge Functions → Secrets, add:

```
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here (optional)
```

---

## 🔑 Step 4: Get API Keys

### 4.1 Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 4.2 Anthropic API Key (Optional - for Claude)

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Copy the key

---

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5.2 Add to `.gitignore` (if not already):

```
.env
.env.local
.env.*.local
```

---

## 🏃 Step 6: Run the Application

### Development Mode

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

---

## 📋 Step 7: Verify Setup

### Checklist:

- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] Database tables created (profiles, model_configurations, etc.)
- [ ] Edge Functions deployed
- [ ] API keys set in Supabase secrets
- [ ] Environment variables set in `.env` file
- [ ] Development server running (`npm run dev`)

### Test the Application:

1. **Open** `http://localhost:5173`
2. **Sign up** for a new account
3. **Enter a research query** on the home page
4. **Verify** research generation works

---

## 🐛 Troubleshooting

### Issue: "GEMINI_API_KEY not configured"

**Solution:** Add the API key in Supabase Dashboard → Edge Functions → Secrets

### Issue: "Database error" or "profiles table not found"

**Solution:** Run the SQL migrations in Supabase SQL Editor

### Issue: "CORS error"

**Solution:** Check Supabase settings:
- Go to Settings → API
- Add your frontend URL to allowed origins

### Issue: Functions not deploying

**Solution:** 
- Check Supabase CLI is installed: `supabase --version`
- Verify you're logged in: `supabase login`
- Check project link: `supabase projects list`

---

## 📚 Additional Resources

- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Vite Docs:** [https://vitejs.dev](https://vitejs.dev)
- **React Docs:** [https://react.dev](https://react.dev)

---

## 🚀 Deployment Options

### Deploy to Vercel:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
```

### Deploy to Netlify:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

The `netlify.toml` file is already configured for Netlify deployment.

---

## 📝 Notes

- The project uses **Deno runtime** for Edge Functions (Supabase)
- Frontend uses **Vite + React**
- Database is **PostgreSQL** (via Supabase)
- API providers: **Gemini** (required) and **Claude** (optional)

---

## ✅ You're All Set!

Once all steps are complete, you should have a fully functional AskDepth application running locally or deployed.

For more detailed deployment instructions, see:
- `COMPLETE_DEPLOYMENT_STEPS.md`
- `DEPLOYMENT_GUIDE.md`
- `BACKEND_SETUP.md`
