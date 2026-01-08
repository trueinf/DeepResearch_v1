# Backend Setup Instructions

The AskDepth application requires a backend server to handle OpenAI API calls. Follow these steps to set it up.

## Step 1: Install Backend Dependencies

```bash
cd server
npm install
```

## Step 2: Set Up Environment Variables

1. Create a `.env` file in the `server` directory
2. Add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-your-api-key-here
PORT=3001
```

**To get your API key:**
- Go to https://console.anthropic.com/settings/keys
- Sign in or create an account
- Create a new API key
- Copy it to your `.env` file

## Step 3: Start the Backend Server

```bash
npm run dev
```

The server should start on `http://localhost:3001`

## Step 4: Start the Frontend (in a new terminal)

```bash
cd ..  # Go back to project root
npm run dev
```

The frontend will run on `http://localhost:5173` and proxy API requests to the backend.

## Verification

1. Both servers should be running:
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:5173`

2. Try creating a research query in the web app
3. You should see:
   - Clarifying questions appear first
   - Then the research progress with streaming updates

## Troubleshooting

- **"Failed to fetch" errors**: Make sure the backend server is running on port 3001
- **Anthropic API errors**: Verify your API key is correct and has credits
- **Model access errors**: You may need to adjust the model names in `server/index.js` based on your Anthropic account access

## Models Used

- **Clarify Phase**: `claude-sonnet-4-5-20250929`
- **Deep Research Phase**: `claude-sonnet-4-5-20250929`

You can modify these in `server/index.js` if needed.

