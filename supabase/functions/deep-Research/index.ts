// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
// @ts-ignore - Deno runtime
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY');
// @ts-ignore - Deno runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
// @ts-ignore - Deno runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// Pricing per 1M tokens (as of 2025)
const PRICING = {
  'claude-sonnet-4-5-20250929': {
    input: 3.0,
    output: 15.0
  },
  'gemini-3-pro': {
    input: 0.50,
    output: 1.50
  },
  'gemini-3-pro-preview': {
    input: 0.50,
    output: 1.50
  }
};
function calculateCost(model, inputTokens, outputTokens) {
  const prices = PRICING[model] || PRICING['claude-sonnet-4-5-20250929'];
  return inputTokens / 1_000_000 * prices.input + outputTokens / 1_000_000 * prices.output;
}
async function saveTokenUsage(researchId, functionName, inputTokens, outputTokens, model) {
  if (!researchId) {
    console.warn('⚠️ Token usage not saved: researchId is missing');
    return;
  }
  if (!SUPABASE_URL) {
    console.error('❌ Token usage not saved: SUPABASE_URL environment variable is not set');
    console.error('   Set it in Supabase Dashboard → Settings → Edge Functions → Secrets');
    return;
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Token usage not saved: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    console.error('   Set it in Supabase Dashboard → Settings → Edge Functions → Secrets');
    return;
  }
  try {
    const totalTokens = inputTokens + outputTokens;
    const prices = PRICING[model] || PRICING['claude-sonnet-4-5-20250929'];
    // Calculate costs
    const inputCostUsd = inputTokens / 1_000_000 * prices.input;
    const outputCostUsd = outputTokens / 1_000_000 * prices.output;
    const costUsd = inputCostUsd + outputCostUsd;
    // Calculate per-token costs
    const costPerInputToken = inputTokens > 0 ? inputCostUsd / inputTokens : 0;
    const costPerOutputToken = outputTokens > 0 ? outputCostUsd / outputTokens : 0;
    console.log(`💾 Attempting to save token usage: ${inputTokens} input, ${outputTokens} output, $${costUsd.toFixed(6)}`);
    console.log(`   Per-token: Input $${costPerInputToken.toFixed(12)}, Output $${costPerOutputToken.toFixed(12)}`);
    // @ts-ignore - Deno runtime supports URL imports
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('token_usage').insert({
      research_id: researchId,
      function_name: functionName,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
      input_cost_usd: inputCostUsd,
      output_cost_usd: outputCostUsd,
      cost_per_input_token: costPerInputToken,
      cost_per_output_token: costPerOutputToken,
      model: model
    }).select();
    if (error) {
      console.error('❌ Failed to save token usage:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log(`✅ Token usage saved successfully: ${inputTokens} input, ${outputTokens} output, $${costUsd.toFixed(6)}`);
      console.log('   Saved record:', data);
    }
  } catch (error) {
    console.error('❌ Error saving token usage:', error);
    console.error('   Error stack:', error instanceof Error ? error.stack : String(error));
  }
}
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
interface SerpResult {
  title: string;
  url: string;
  snippet?: string;
  date?: string;
}

async function fetchSerpResults(query: string, numResults = 10): Promise<SerpResult[]> {
  if (!SERPAPI_KEY) {
    console.warn('SERPAPI_KEY not configured, skipping web search');
    return [];
  }
  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: query,
      num: String(numResults),
      hl: 'en',
      api_key: SERPAPI_KEY
    });
    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    if (!response.ok) {
      console.error('SerpAPI error:', response.status, await response.text());
      return [];
    }
    const data = await response.json();
    const results: SerpResult[] = [];
    const addResult = (item)=>{
      if (!item) return;
      const url = item.link || item.url;
      if (!url) return;
      results.push({
        title: item.title || item.source || url,
        url,
        snippet: item.snippet || item.snippet_highlighted_words?.join(' ') || item.summary,
        date: item.date || item.published_datetime || item.time
      });
    };
    if (Array.isArray(data.organic_results)) {
      data.organic_results.forEach(addResult);
    }
    if (Array.isArray(data.news_results)) {
      data.news_results.forEach(addResult);
    }
    if (Array.isArray(data.top_stories)) {
      data.top_stories.forEach(addResult);
    }
    return results.slice(0, numResults);
  } catch (error) {
    console.error('Failed to fetch SerpAPI results:', error);
    return [];
  }
}
function normalizeUrl(url) {
  try {
    const cleanUrl = url.replace(/[)\],]+$/, '').trim();
    const urlObj = new URL(cleanUrl);
    urlObj.hash = '';
    urlObj.search = '';
    return urlObj.toString();
  } catch  {
    return null;
  }
}
function classifyTopicAndSelectFrameworks(query) {
  const lowerQuery = query.toLowerCase();
  // AI/Technology topics
  if (lowerQuery.includes('ai') || lowerQuery.includes('artificial intelligence') || lowerQuery.includes('machine learning') || lowerQuery.includes('ml') || lowerQuery.includes('deep learning') || lowerQuery.includes('neural network') || lowerQuery.includes('llm') || lowerQuery.includes('large language model') || lowerQuery.includes('rag') || lowerQuery.includes('retrieval-augmented') || lowerQuery.includes('transformer') || lowerQuery.includes('gpt') || lowerQuery.includes('algorithm') || lowerQuery.includes('model') || lowerQuery.includes('technology') || lowerQuery.includes('tech') || lowerQuery.includes('software') || lowerQuery.includes('system') || lowerQuery.includes('engineering') || lowerQuery.includes('architecture')) {
    return {
      category: 'Technology / AI',
      frameworks: [
        'Technical Deep-Dive',
        'Business Strategy',
        'Explanatory'
      ],
      frameworkInstructions: `Use the TECHNICAL + BUSINESS FRAMEWORKS. Structure your systematic output as:

1. One-Line Summary
   [A single sentence capturing the essence]

2. 30-Second Summary
   [2-3 sentences explaining what it is and why it matters]

3. How It Works (Technical Framework)
   [Break down the mechanism, architecture, or process step-by-step]

4. Why It's Important (Business Framework)
   [Business value, market impact, strategic implications]

5. Risks / Limitations
   [Key challenges, constraints, potential issues]

6. Practical Use Cases
   [Real-world applications and examples]

7. Evidence
   [Key quotes, data points, citations from sources]`
    };
  }
  // Cinema/Creative topics
  if (lowerQuery.includes('movie') || lowerQuery.includes('film') || lowerQuery.includes('cinema') || lowerQuery.includes('director') || lowerQuery.includes('actor') || lowerQuery.includes('screenplay') || lowerQuery.includes('plot') || lowerQuery.includes('character') || lowerQuery.includes('theme') || lowerQuery.includes('narrative') || lowerQuery.includes('story') || lowerQuery.includes('scene') || lowerQuery.includes('interstellar') || lowerQuery.includes('nolan') || lowerQuery.includes('about') && (lowerQuery.includes('really') || lowerQuery.includes('meaning'))) {
    return {
      category: 'Cinema / Creative Works',
      frameworks: [
        'Narrative Analysis'
      ],
      frameworkInstructions: `Use the NARRATIVE FRAMEWORK. Structure your systematic output as:

1. One-Line Summary
   [Core meaning or central message]

2. Plot Summary
   [Brief overview of the narrative]

3. Core Themes
   [Main thematic elements and their significance]

4. Symbolism
   [Key symbols, metaphors, and their meanings]

5. Character Arcs
   [How main characters develop and transform]

6. Directorial Intent (Evidence)
   [Quotes, interviews, or statements from creators]

7. Audience & Critical Reception
   [How it was received and interpreted]

8. Conflicting Interpretations
   [Different perspectives and debates]`
    };
  }
  // Politics/Geopolitics topics
  if (lowerQuery.includes('politics') || lowerQuery.includes('political') || lowerQuery.includes('government') || lowerQuery.includes('policy') || lowerQuery.includes('election') || lowerQuery.includes('vote') || lowerQuery.includes('war') || lowerQuery.includes('conflict') || lowerQuery.includes('geopolitics') || lowerQuery.includes('geopolitical') || lowerQuery.includes('withdrawal') || lowerQuery.includes('afghanistan') || lowerQuery.includes('crisis') || lowerQuery.includes('diplomacy') || lowerQuery.includes('treaty') || lowerQuery.includes('alliance') || lowerQuery.includes('sanction') || lowerQuery.includes('trade war')) {
    return {
      category: 'Politics / Geopolitics / Modern History',
      frameworks: [
        'Event Analysis',
        'Analytical',
        'Historical'
      ],
      frameworkInstructions: `Use the EVENT ANALYSIS + ANALYTICAL + HISTORICAL FRAMEWORKS. Structure your systematic output as:

1. One-Line Summary
   [Core event or issue in one sentence]

2. Background / Timeline
   [Key events leading up to the main topic]

3. Causes
   [Root causes, contributing factors, triggers]

4. Stakeholders
   [Key actors, groups, or entities involved]

5. Conflicting Narratives
   [Different perspectives and interpretations]

6. Political Implications
   [Impact on power dynamics, relationships, systems]

7. Future Outlook
   [Potential outcomes, scenarios, predictions]

8. Evidence
   [Sourced quotes, policy statements, reports]`
    };
  }
  // Business/Economics topics
  if (lowerQuery.includes('market') || lowerQuery.includes('business') || lowerQuery.includes('economy') || lowerQuery.includes('economic') || lowerQuery.includes('company') || lowerQuery.includes('industry') || lowerQuery.includes('revenue') || lowerQuery.includes('profit') || lowerQuery.includes('investment') || lowerQuery.includes('strategy') || lowerQuery.includes('competitor') || lowerQuery.includes('startup')) {
    return {
      category: 'Business / Economics',
      frameworks: [
        'Business Strategy',
        'Market Analysis',
        'Explanatory'
      ],
      frameworkInstructions: `Use the BUSINESS + MARKET ANALYSIS FRAMEWORKS. Structure your systematic output as:

1. One-Line Summary
   [Core business insight or finding]

2. 30-Second Summary
   [Key market dynamics and implications]

3. Market Overview
   [Size, trends, key players]

4. Business Model / Strategy
   [How it works, competitive advantages]

5. Market Opportunities
   [Growth areas, potential]

6. Risks / Challenges
   [Threats, obstacles, limitations]

7. Key Players / Stakeholders
   [Major companies, organizations involved]

8. Evidence
   [Data, statistics, expert quotes]`
    };
  }
  // Science/Research topics
  if (lowerQuery.includes('research') || lowerQuery.includes('study') || lowerQuery.includes('scientific') || lowerQuery.includes('science') || lowerQuery.includes('experiment') || lowerQuery.includes('hypothesis') || lowerQuery.includes('theory') || lowerQuery.includes('discovery') || lowerQuery.includes('paper') || lowerQuery.includes('journal')) {
    return {
      category: 'Science / Research',
      frameworks: [
        'Technical Deep-Dive',
        'Explanatory',
        'Analytical'
      ],
      frameworkInstructions: `Use the TECHNICAL + EXPLANATORY + ANALYTICAL FRAMEWORKS. Structure your systematic output as:

1. One-Line Summary
   [Core scientific finding or concept]

2. 30-Second Summary
   [What it is and why it matters]

3. Scientific Background
   [Theory, methodology, context]

4. Key Findings
   [Main discoveries, results, data]

5. Implications
   [What this means for the field and beyond]

6. Limitations / Criticisms
   [Constraints, debates, alternative views]

7. Future Research
   [Open questions, next steps]

8. Evidence
   [Citations, data, expert quotes]`
    };
  }
  // Default: General/Explanatory
  return {
    category: 'General / Explanatory',
    frameworks: [
      'Explanatory',
      'Analytical'
    ],
    frameworkInstructions: `Use the EXPLANATORY + ANALYTICAL FRAMEWORKS. Structure your systematic output as:

1. One-Line Summary
   [Core concept or finding]

2. 30-Second Summary
   [Brief overview and significance]

3. Key Concepts
   [Main ideas, definitions, components]

4. Context and Background
   [Why this matters, historical context]

5. Analysis
   [Deep dive into implications and connections]

6. Different Perspectives
   [Various viewpoints and interpretations]

7. Practical Applications
   [Real-world relevance and uses]

8. Evidence
   [Key sources, quotes, data]`
  };
}
function mergeSerpSources(report, serpResults) {
  if (!serpResults?.length) return;
  if (!report.sources) {
    report.sources = [];
  }
  const existingUrls = new Set(report.sources.map((source)=>normalizeUrl(source.url) || source.url).filter((url)=>!!url));
  serpResults.forEach((result)=>{
    if (!result.url) return;
    const normalized = normalizeUrl(result.url);
    if (!normalized) return;
    const lower = normalized.toLowerCase();
    if (existingUrls.has(normalized) || lower.includes('example.com') || lower.includes('placeholder') || lower.includes('research-source') || lower.includes('test') || lower.includes('fake')) {
      return;
    }
    try {
      const urlObj = new URL(normalized);
      const domain = urlObj.hostname.replace('www.', '');
      const date = result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date) ? result.date : new Date().toISOString().split('T')[0];
      report.sources.push({
        url: normalized,
        domain,
        date,
        title: result.title || domain
      });
      existingUrls.add(normalized);
    } catch (error) {
      console.error('Failed to merge Serp source:', error);
    }
  });
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : String(parseError)
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    console.log('Received request:', {
      hasOriginalQuery: !!requestBody.originalQuery,
      originalQueryType: typeof requestBody.originalQuery,
      originalQueryLength: requestBody.originalQuery?.length,
      originalQueryPreview: requestBody.originalQuery?.substring(0, 100),
      hasClarifyingAnswers: !!requestBody.clarifyingAnswers,
      researchId: requestBody.researchId,
      model: requestBody.model
    });
    
    const { originalQuery, clarifyingAnswers, researchId, model } = requestBody;
    
    if (!originalQuery || (typeof originalQuery === 'string' && originalQuery.trim() === '')) {
      console.error('Missing or empty originalQuery:', {
        originalQuery,
        type: typeof originalQuery,
        isEmpty: originalQuery === '',
        isUndefined: originalQuery === undefined,
        isNull: originalQuery === null
      });
      return new Response(JSON.stringify({
        error: 'originalQuery is required and cannot be empty',
        received: {
          originalQuery: originalQuery,
          type: typeof originalQuery
        }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    // Determine which API to use based on model
    const useGemini = model === 'gemini-2.0-flash-lite' || model === 'gemini-3-pro' || model === 'gemini-3-pro-preview' || model === 'gemini-3.0-pro-preview';
    const selectedModel = model || 'claude-sonnet-4-5-20250929';
    if (useGemini && !GEMINI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'GEMINI_API_KEY secret not configured'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    if (!useGemini && !ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({
        error: 'ANTHROPIC_API_KEY secret not configured'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    const startTime = Date.now();
    const serpQuery = [
      originalQuery,
      clarifyingAnswers
    ].filter(Boolean).join(' ');
    const serpResults = await fetchSerpResults(serpQuery, 12);
    const serpContext = serpResults.length ? serpResults.map((result, index)=>{
      const snippet = result.snippet?.replace(/\s+/g, ' ').trim() || '';
      return `${index + 1}. ${result.title || result.url} — ${result.url}${snippet ? ` — ${snippet}` : ''}`;
    }).join('\n') : 'No real-time search results retrieved (SerpAPI returned no data).';
    // Calculate real-time metrics
    const durationBeforeAPI = Math.round((Date.now() - startTime) / 60000) || 1;
    const sourceCount = serpResults.length;
    const searchCount = 1 // Single SerpAPI query
    ;
    // Classify topic and select frameworks
    const topicClassification = classifyTopicAndSelectFrameworks(originalQuery);
    console.log('Topic Classification:', JSON.stringify(topicClassification, null, 2));
    console.log('Query:', originalQuery);
    console.log('Category:', topicClassification.category);
    console.log('Frameworks:', topicClassification.frameworks);
    // Construct comprehensive research prompt combining query, clarifications, and live web search context
    const researchPrompt = `YOU ARE A DEEP-RESEARCH ANALYSIS ENGINE WITH MULTI-AGENT CAPABILITIES. YOU MUST USE REAL SOURCES AND REAL URLs.

MULTI-AGENT SYSTEM:
- Discovery Agent: Finds papers, blogs, videos, authoritative sources
- Evidence Agent: Extracts definitions, mechanisms, benchmarks, data points
- Critic Agent: Identifies contradictions, conflicting viewpoints, limitations
- Synthesis Agent: Combines findings using selected frameworks

TOPIC CLASSIFICATION:
Category: ${topicClassification.category}
Selected Frameworks: ${topicClassification.frameworks.join(' + ')}

FABRICATED, NON-EXISTENT, OR PLACEHOLDER URLs ARE STRICTLY FORBIDDEN.

---------------------------------------------------------------------
Research the following topic with the specified scope and requirements:

RESEARCH TOPIC: ${originalQuery}

CLARIFYING SCOPE AND REQUIREMENTS:
${clarifyingAnswers || 'No specific clarifications provided. Conduct comprehensive research covering all relevant aspects.'}

---------------------------------------------------------------------
REAL-TIME WEB SEARCH FINDINGS (SerpAPI):
${serpContext}
---------------------------------------------------------------------

---------------------------------------------------------------------

ABSOLUTE RULES — NO EXCEPTIONS:
1. YOU MUST PERFORM REAL WEB RESEARCH
   - Use real websites, real articles, real government pages, real research papers, and real databases.
   - ONLY cite URLs that currently exist in the real world.

2. REAL SOURCES ONLY
   - No invented domains
   - No fabricated URLs
   - No placeholders
  

3. SOURCES MUST MATCH CONTENT
   - Every source in the final “Sources” section MUST come from material you actually used in the research.
   - Minimum 8–15 real sources required.

4. SELF-VERIFICATION BEFORE FINALIZING
   You MUST verify each URL:
   - Exists in reality
   - Points to a real page
   - Is not fictional, placeholder, or synthetic
   - Contains no tracking parameters such as “utm_”
   - Does not contain: “example”, “lorem”, “placeholder”, “test”, “fake”

---------------------------------------------------------------------
RESEARCH REQUIREMENTS:
- Include verifiable statistics, measurable trends, real data, and referenced findings.
- Prioritize authoritative and up-to-date sources.
- Each insight must be evidence-based.
- Write analytically, avoid generalities.
- NO fabricated information, NO hallucinated citations.

PROHIBITED CONTENT:
- No JSON, metadata, code objects, URL fragments, query parameters, or technical strings.
- No partial URLs (e.g., “https://www”).
- No tracking parameters (utm_source, utm_campaign, etc.).
- Output MUST be 100% clean, human-readable prose.

---------------------------------------------------------------------
OUTPUT FORMAT (MANDATORY - FOLLOW THIS EXACT SEQUENCE):

STEP 1: Start with metadata line:
**Research completed in ${durationBeforeAPI}m · ${sourceCount} sources · ${searchCount} searches**

STEP 2: Generate the "Structured Research Output" section FIRST (MANDATORY):
# ⭐ Structured Research Output (Systematic Output)

Now, using the ${topicClassification.category} category and ${topicClassification.frameworks.join(' + ')} frameworks, generate the following structured sections:

${topicClassification.frameworkInstructions}

CRITICAL: Fill in ALL numbered sections above with actual content from your research. Do NOT skip any section. Each section must contain substantive information based on the research findings.

VERY IMPORTANT: You MUST write out the section numbers (1., 2., 3., etc.) followed by the section titles, then provide the content for each section. Do NOT just list the instructions - actually generate the content for each numbered section.

STEP 3: ONLY AFTER completing the Structured Research Output above, continue with:

# Executive Summary
Write 2–3 rich, detailed paragraphs summarizing the highest-value insights.

# Context and Background
Write full paragraphs describing why the topic matters, definitions, scope, region, timeframe, and key parameters.

# Web Research & Findings
Group sections using markdown subheadings (###), for example:
### Market Trends
### Regional Overview
### Key Players
### Policy Developments
### Technical Architecture
Each subsection must contain detailed paragraphs with evidence-driven insights.

# Deep Analysis and Interpretation
Provide multi-paragraph, high-level analytical reasoning, comparisons, causations, risks, opportunities, and predictions.

# Insights and Implications
Explain why the findings matter. Write full paragraphs with strategic implications.

# Conclusion and Recommendations
Offer detailed conclusion paragraphs with actionable recommendations. End with a strong final synthesis statement.

---------------------------------------------------------------------
SOURCES SECTION — STRICT FORMAT:
# Sources
You MUST list ONLY real sources actually used in the analysis.
Minimum 8–15 sources.
Format each source EXACTLY:
1. Source Title – https://www.domain.com/path – YYYY-MM-DD
2. Source Title – https://www.domain.com/path – YYYY-MM-DD

RULES:
- URLs MUST start with https://
- URLs MUST be real and accessible
- Publication date must be the known date; if unknown, use today’s date: 2025-01-19
- No placeholders or fictional links allowed

---------------------------------------------------------------------
FINAL VERIFICATION CHECKLIST (MANDATORY BEFORE YOU SUBMIT OUTPUT):
You MUST scan your entire output and REMOVE any occurrence of:
- “utm_”
- “example”
- “placeholder”
- “test”
- “lorem”
- “fake”
- “end_index”
- “start_index”
- “url_citation”
- “{” or “}”

Additionally verify:
- All URLs are complete, real, and accessible
- Only clean prose appears in all sections
- Sources section is the FINAL section
- At least 8 REAL URLs are present
- Every URL corresponds to actual research you used

---------------------------------------------------------------------
Your final output MUST be clean, professional, academic-grade research prose with ONLY real, verifiable sources. ZERO fabricated URLs or citations. NO EXCEPTIONS.`;
    // Call API based on model selection
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 250000) // 250 second timeout for long research
    ;
    let response;
    let responseData;
    let outputText = '';
    let inputTokens = 0;
    let outputTokens = 0;
    try {
      if (useGemini) {
        // Call Gemini API
        const requestBody = JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: researchPrompt
                }
              ]
            }
          ]
        });
        const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
        response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'x-goog-api-key': GEMINI_API_KEY,
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          body: requestBody
        });
      } else {
        // Call Anthropic Messages API
        const maxTokens = 4096;
        const requestBody = JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: maxTokens,
          messages: [
            {
              role: "user",
              content: researchPrompt
            }
          ]
        });
        const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
        response = await fetch(ANTHROPIC_API_URL, {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          signal: controller.signal,
          body: requestBody
        });
      }
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return new Response(JSON.stringify({
          error: `Request timeout - ${useGemini ? 'Gemini' : 'Anthropic'} API took too long to respond`,
          details: 'The request exceeded 250 seconds. Try again or use a simpler query.'
        }), {
          status: 504,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
      throw fetchError;
    }
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch  {
        errorData = {
          message: errorText
        };
      }
      console.error(`${useGemini ? 'Gemini' : 'Anthropic'} API error:`, response.status, errorData);
      let errorMessage = 'Failed to perform deep research';
      const errorMessageText = errorData?.error?.message || errorData?.message || '';
      
      // Extract the actual error message from the API response
      if (errorMessageText) {
        errorMessage = errorMessageText;
      } else if (response.status === 401) {
        errorMessage = `Invalid ${useGemini ? 'Gemini' : 'Anthropic'} API key. Please check your API key configuration.`;
      } else if (response.status === 404) {
        errorMessage = 'Model not found. Please verify the model name.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status >= 500) {
        errorMessage = `${useGemini ? 'Gemini' : 'Anthropic'} API server error. Please try again later.`;
      }
      
      // Add helpful message for credit balance issues
      if (errorMessageText && (errorMessageText.includes('credit') || errorMessageText.includes('balance') || errorMessageText.includes('billing'))) {
        errorMessage = `${errorMessageText}\n\n💡 Tip: Try using Gemini model instead (gemini-3-pro or gemini-3-pro-preview) which may have different billing requirements.`;
      }
      return new Response(JSON.stringify({
        error: errorMessage,
        status: response.status,
        details: errorData,
        apiError: true
      }), {
        status: response.status >= 500 ? 500 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    responseData = await response.json();
    if (useGemini) {
      // Parse Gemini API response
      if (responseData.candidates && Array.isArray(responseData.candidates) && responseData.candidates.length > 0) {
        const candidate = responseData.candidates[0];
        if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
          outputText = candidate.content.parts.filter((part)=>part.text).map((part)=>part.text).join('\n\n');
        }
      }
      // Extract token usage from Gemini
      const usageMetadata = responseData.usageMetadata || {};
      inputTokens = usageMetadata.promptTokenCount || 0;
      outputTokens = usageMetadata.candidatesTokenCount || 0;
    } else {
      // Parse Anthropic API response
      if (responseData.content && Array.isArray(responseData.content)) {
        outputText = responseData.content.filter((item)=>item.type === 'text').map((item)=>item.text).join('\n\n');
      }
      // Extract token usage from Anthropic
      const usage = responseData.usage || {};
      inputTokens = usage.input_tokens || 0;
      outputTokens = usage.output_tokens || 0;
    }
    if (!outputText) {
      outputText = JSON.stringify(responseData, null, 2);
    }
    // Save token usage to database (non-blocking)
    if (inputTokens > 0 || outputTokens > 0) {
      saveTokenUsage(researchId, 'deep-Research', inputTokens, outputTokens, selectedModel).catch((err)=>console.error('Token usage save failed:', err));
    }
    const report = parseReport(outputText);
    mergeSerpSources(report, serpResults);
    // Generate Universal Research Framework output using Claude
    let universalResearchOutput = null;
    let universalInputTokens = 0;
    let universalOutputTokens = 0;
    try {
      console.log('Generating Universal Research Framework output with Claude...');
      const universalPrompt = `You are a Universal Research Intelligence Agent. Generate CRISP, PRECISE, CONCISE output following the format below.

RESEARCH TOPIC: ${originalQuery}

CLARIFYING SCOPE: ${clarifyingAnswers || 'None'}

REAL-TIME WEB SEARCH FINDINGS:

${serpContext}

UNIVERSAL RESEARCH OUTPUT FORMAT (MANDATORY - BE CONCISE):

# 🔬 Universal Research Framework Output

## 1. Research Question Precision

[1-2 sentences: Restate question precisely, identify scope and key terms]

## 2. One-Sentence Answer

[Single sentence directly answering the research question]

## 3. Key Insights (3-5 bullet points)

- [Insight 1 with source]

- [Insight 2 with source]

- [Insight 3 with source]

- [Insight 4 with source]

- [Insight 5 with source]

## 4. Evidence Summary

**Primary Sources:** [2-3 authoritative sources]

**Secondary Sources:** [2-3 news/analysis sources]

**Conflicting Views:** [1-2 sentences on contradictions if any]

## 5. Confidence Level

[High/Medium/Low] - [1 sentence explanation]

## 6. Limitations

[2-3 bullet points on information gaps or constraints]

## 7. Key Takeaways

[3-4 actionable points or implications]

CRITICAL: Keep each section SHORT (1-3 sentences max per item). Be precise, not verbose. Use ONLY real sources from search results.`;
      
      const universalRequestBody = JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: universalPrompt
          }
        ]
      });
      
      const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
      const universalResponse = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: universalRequestBody
      });
      
      if (universalResponse.ok) {
        const universalData = await universalResponse.json();
        // Extract token usage from Anthropic
        const universalUsage = universalData.usage || {};
        universalInputTokens = universalUsage.input_tokens || 0;
        universalOutputTokens = universalUsage.output_tokens || 0;
        // Extract text from Anthropic response
        if (universalData.content && Array.isArray(universalData.content)) {
          universalResearchOutput = universalData.content.filter((item)=>item.type === 'text').map((item)=>item.text).join('\n\n');
        }
        console.log('Universal Research Framework output generated successfully');
      } else {
        const errorText = await universalResponse.text();
        console.error('Universal Research Framework API error:', universalResponse.status, errorText);
      }
    } catch (error) {
      console.error('Error generating Universal Research Framework:', error);
      // Don't fail the entire request if Universal Research Framework fails
    }
    // Save token usage for Universal Research Framework
    if (universalInputTokens > 0 || universalOutputTokens > 0) {
      saveTokenUsage(researchId, 'universal-Research-Framework', universalInputTokens, universalOutputTokens, 'claude-sonnet-4-5-20250929').catch((err)=>{
        console.error('Failed to save Universal Research Framework token usage (non-blocking):', err);
      });
    }
    // Calculate final real-time metrics
    const finalDurationMs = Date.now() - startTime;
    const finalDurationMinutes = Math.max(1, Math.ceil(finalDurationMs / 60000)) // Round up to nearest minute, minimum 1
    ;
    const finalSourceCount = report.sources.length;
    const finalSearchCount = serpResults.length;
    // Update metadata with real-time data
    report.metadata = `Research completed in ${finalDurationMinutes}m · ${finalSourceCount} sources · ${finalSearchCount} searches`;
    console.log('Deep research completed');
    return new Response(JSON.stringify({
      status: 'completed',
      report: report,
      universalResearchOutput: universalResearchOutput,
      raw: outputText.substring(0, 2000),
      serpResults
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
interface KeyFinding {
  text: string;
  citations: number[];
}

interface Source {
  url: string;
  domain: string;
  date: string;
  title: string;
}

interface Report {
  keyFindings: KeyFinding[];
  sources: Source[];
  systematicOutput: string | null;
  executiveSummary: string | null;
  detailedAnalysis: string | null;
  insights: string | null;
  conclusion: string | null;
  metadata: string | null;
}

function parseReport(text: string): Report {
  const report: Report = {
    keyFindings: [],
    sources: [],
    systematicOutput: null,
    executiveSummary: null,
    detailedAnalysis: null,
    insights: null,
    conclusion: null,
    metadata: null
  };
  // Don't extract metadata from LLM response - it will be set with real-time data later
  // Just remove the metadata line if present
  let cleanText = text.replace(/^\*\*Research completed in.*?\*\*\s*\n?/i, '').trim();
  // Extract Systematic Output (appears before Executive Summary)
  // Try multiple patterns to catch variations
  let systematicOutputMatch = cleanText.match(/#\s*⭐\s*Structured Research Output\s*\(?Systematic Output\)?\s*\n(.*?)(?=\n\s*#\s*Executive Summary|$)/is);
  if (systematicOutputMatch) {
    report.systematicOutput = systematicOutputMatch[1].trim();
  } else {
    // Try without emoji
    systematicOutputMatch = cleanText.match(/#\s*Structured Research Output\s*\(?Systematic Output\)?\s*\n(.*?)(?=\n\s*#\s*Executive Summary|$)/is);
    if (systematicOutputMatch) {
      report.systematicOutput = systematicOutputMatch[1].trim();
    } else {
      // Try just "Structured Research Output"
      systematicOutputMatch = cleanText.match(/#\s*Structured Research Output\s*\n(.*?)(?=\n\s*#\s*Executive Summary|$)/is);
      if (systematicOutputMatch) {
        report.systematicOutput = systematicOutputMatch[1].trim();
      } else {
        // Try to find numbered list sections before Executive Summary (1. One-Line Summary, etc.)
        const beforeExecSummary = cleanText.split(/#\s*Executive Summary/is)[0];
        if (beforeExecSummary && beforeExecSummary.match(/^\d+\.\s*(One-Line|30-Second|Summary|How|Why|Risks|Use Cases|Evidence)/im)) {
          report.systematicOutput = beforeExecSummary.trim();
        }
      }
    }
  }
  // Extract Executive Summary
  const execSummaryMatch = cleanText.match(/#\s*Executive Summary\s*\n(.*?)(?=\n\s*#|$)/is);
  if (execSummaryMatch) {
    report.executiveSummary = execSummaryMatch[1].trim();
  }
  // Extract Web Research & Findings
  const webResearchMatch = cleanText.match(/#\s*Web Research\s*&\s*Findings\s*\n(.*?)(?=\n\s*#\s*(Deep Analysis|Insights|Conclusion)|$)/is);
  // Extract Deep Analysis and Interpretation
  const deepAnalysisMatch = cleanText.match(/#\s*Deep Analysis\s*and\s*Interpretation\s*\n(.*?)(?=\n\s*#\s*(Insights|Conclusion)|$)/is);
  // Combine both sections into detailedAnalysis
  let analysisText = '';
  if (webResearchMatch) {
    analysisText += webResearchMatch[1].trim() + '\n\n';
  }
  if (deepAnalysisMatch) {
    analysisText += deepAnalysisMatch[1].trim();
  }
  if (analysisText) {
    report.detailedAnalysis = analysisText.trim();
    // Extract key findings - PRIORITIZE clean sections first, then clean analysis
    // Strategy: Extract from Executive Summary first (usually cleanest), then clean analysis sections
    // First, try to extract from Executive Summary (usually the cleanest)
    if (report.executiveSummary) {
      const execSentences = report.executiveSummary.split(/[.!?]+/).filter((s)=>{
        const trimmed = s.trim();
        return trimmed.length > 40 && trimmed.length < 300 && !trimmed.match(/utm_source|end_index|start_index|"type"|url_citation/i) && !trimmed.match(/[a-z]+\.(org|com|net)/gi) && trimmed.split(/\s+/).length > 8;
      });
      if (execSentences.length > 0) {
        execSentences.slice(0, 3).forEach((sentence, idx)=>{
          const clean = sentence.trim() + '.';
          if (clean.length > 50 && clean.length < 500) {
            report.keyFindings.push({
              text: clean,
              citations: [
                idx + 1
              ]
            });
          }
        });
      }
    }
    // Now process analysis sections with ULTRA aggressive filtering
    let cleanedAnalysis = analysisText;
    // Remove JSON citation objects completely (ALL patterns - be exhaustive)
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"type"[^}]*"url_citation"[^}]*\}/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"end_index"[^}]*\}/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"start_index"[^}]*\}/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"title"[^}]*"url"[^}]*\}/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/"type":\s*"[^"]*",\s*"end_index":\s*\d+,\s*"start_index":\s*\d+[^}]*/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/utm_source=anthropic[^}]*\}/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/utm_source=[^\s\)]+/gi, '');
    cleanedAnalysis = cleanedAnalysis.replace(/utm_source=anthropic"\s*\},\s*\{/g, '');
    // Remove URL fragments and domain paths (exhaustive patterns)
    cleanedAnalysis = cleanedAnalysis.replace(/https?:\/\/[^\s\)]+/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/https?:\/\/www\.[^\s\)]+/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/https?:\/\/en\.[^\s\)]+/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)\/[^\s\)]+/gi, '');
    cleanedAnalysis = cleanedAnalysis.replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)\/[^\s\)]*/gi, '');
    cleanedAnalysis = cleanedAnalysis.replace(/blog\/[a-z0-9\-]+\/[a-z0-9\-]+/gi, '') // blog paths
    ;
    cleanedAnalysis = cleanedAnalysis.replace(/\/[a-z0-9\-]+\/[a-z0-9\-]+\/[a-z0-9\-]+/gi, '') // Path fragments
    ;
    cleanedAnalysis = cleanedAnalysis.replace(/\/[a-z0-9\-]+\/[a-z0-9\-]+/gi, '') // Shorter paths
    ;
    // Remove standalone domain fragments
    cleanedAnalysis = cleanedAnalysis.replace(/\b[a-z]+\.(org|com|net|edu|gov|io|co|uk)\b/gi, '');
    cleanedAnalysis = cleanedAnalysis.replace(/\b(org|com|net|edu|gov|io|co|uk)\/[^\s\)]+/gi, '');
    // Remove any remaining JSON-like structures (more aggressive)
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]{0,500}\}/g, '') // Any JSON objects (larger)
    ;
    cleanedAnalysis = cleanedAnalysis.replace(/"title":\s*"[^"]*"/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/"url":\s*"[^"]*"/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/"type":\s*"[^"]*"/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/"end_index":\s*\d+/g, '');
    cleanedAnalysis = cleanedAnalysis.replace(/"start_index":\s*\d+/g, '');
    // Remove lines that are mostly technical artifacts
    const lines = cleanedAnalysis.split('\n');
    cleanedAnalysis = lines.filter((line)=>{
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Reject lines that are mostly technical
      const techCount = (trimmed.match(/utm_source|end_index|start_index|"type"|url_citation|"url"|"title"/gi) || []).length;
      const domainCount = (trimmed.match(/[a-z]+\.(org|com|net)/gi) || []).length;
      const jsonCount = (trimmed.match(/\{[^}]*\}/g) || []).length;
      const wordCount = trimmed.split(/\s+/).length;
      // If more than 20% of content is technical, reject
      if (techCount > 0 || domainCount > 1 || jsonCount > 0) return false;
      if (wordCount < 5) return false;
      return true;
    }).join('\n');
    // Split by paragraphs and filter aggressively
    const paragraphs = cleanedAnalysis.split(/\n\n+/).filter((p)=>{
      const trimmed = p.trim();
      // Exclude: subheadings, very short text, technical artifacts
      if (trimmed.length < 100) return false // Require longer paragraphs for quality
      ;
      if (trimmed.match(/^#+\s/)) return false // Subheadings
      ;
      if (trimmed.match(/^[\d\.\)\*\-\#]\s*$/)) return false // Just bullets/numbers
      ;
      // Check for technical content - reject if contains too many technical artifacts
      const hasJson = (trimmed.match(/\{[^}]*\}/g) || []).length > 0;
      const hasUrls = (trimmed.match(/https?:\/\//g) || []).length > 0;
      const hasDomainFragments = (trimmed.match(/[a-z]+\.(org|com|net)/gi) || []).length > 2;
      const hasTechnicalFields = trimmed.match(/utm_source|end_index|start_index|"type"/i);
      if (hasJson || hasUrls || hasDomainFragments || hasTechnicalFields) return false;
      // Check if it contains mostly readable text (not technical)
      const wordCount = trimmed.split(/\s+/).length;
      if (wordCount < 15) return false // Need substantial content
      ;
      return true;
    });
    // Extract meaningful findings from clean paragraphs
    paragraphs.forEach((paragraph, index)=>{
      let cleanText = paragraph.trim();
      // Remove markdown formatting
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      ;
      cleanText = cleanText.replace(/\*(.*?)\*/g, '$1') // Italic
      ;
      cleanText = cleanText.replace(/`(.*?)`/g, '$1') // Code
      ;
      cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      ;
      // Remove leading bullets, numbers, dashes
      cleanText = cleanText.replace(/^[\d\.\)\*\-\#]\s*/, '');
      // Final aggressive cleanup - remove ANY remaining artifacts
      cleanText = cleanText.replace(/\{[^}]*\}/g, '') // Any remaining JSON
      ;
      cleanText = cleanText.replace(/"[^"]*":\s*[^,}]+/g, '') // JSON key-value pairs
      ;
      cleanText = cleanText.replace(/https?:\/\/[^\s\)]+/g, '') // Any URLs
      ;
      cleanText = cleanText.replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)[^\s\)]*/gi, '') // Domain fragments
      ;
      cleanText = cleanText.replace(/utm_source=[^\s\)]+/gi, '') // UTM params
      ;
      cleanText = cleanText.replace(/\s+/g, ' ').trim() // Normalize whitespace
      ;
      // Extract complete sentences - take first 2-3 substantial sentences
      const sentences = cleanText.split(/[.!?]+/).filter((s)=>{
        const trimmed = s.trim();
        // Must be substantial and readable - NO technical content
        if (trimmed.length < 50 || trimmed.length > 500) return false;
        if (trimmed.split(/\s+/).length < 8) return false // At least 8 words
        ;
        // AGGRESSIVE filtering - reject if ANY technical content detected
        if (trimmed.match(/utm_source|end_index|start_index|"type"|url_citation|"url"|"title"/i)) return false;
        if (trimmed.match(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)/i)) return false // No domains
        ;
        if (trimmed.match(/\{[^}]*\}/)) return false // No JSON
        ;
        if (trimmed.match(/https?:\/\//)) return false // No URLs
        ;
        if (trimmed.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+/)) return false // No paths
        ;
        if ((trimmed.match(/[a-z]+\.(org|com|net)/gi) || []).length > 0) return false;
        // Check character composition - reject if too many special chars (likely technical)
        const specialCharRatio = (trimmed.match(/[{}":,\[\]\/]/g) || []).length / trimmed.length;
        if (specialCharRatio > 0.1) return false // More than 10% special chars = likely technical
        ;
        return true;
      });
      if (sentences.length > 0) {
        // Take first 2-3 sentences as a finding
        let findingText = sentences.slice(0, 3).join('. ').trim();
        if (!findingText.endsWith('.')) findingText += '.';
        // FINAL STRICT VERIFICATION - reject if ANY technical content remains
        const hasTechnical = findingText.match(/utm_source|end_index|start_index|"type"|url_citation|"url"|"title"|"end_index"|"start_index"/i);
        const hasDomains = findingText.match(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)/gi);
        const hasJson = findingText.match(/\{[^}]*\}/);
        const hasUrls = findingText.match(/https?:\/\//);
        const hasPaths = findingText.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+/);
        // Reject URL path patterns like "com/education/news/..." or "/city/lucknow/..."
        const hasUrlPathPattern = findingText.match(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\//i) || findingText.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+\/[a-z0-9\-]+/i) || findingText.match(/^[a-z]+\.(com|org|net)\//i) || findingText.match(/\/articleshow\/|\/news\/|\/education\//i);
        // Reject if it looks like a URL path (starts with domain or path pattern)
        if (findingText.match(/^(com|org|net|edu|gov|io|co|uk)\//i) || findingText.match(/^\/[a-z0-9\-]+\//i) || findingText.split(/\s+/).length < 10) {
          return; // Skip - looks like a URL path, not readable text
        }
        if (hasTechnical || hasDomains || hasJson || hasUrls || hasPaths || hasUrlPathPattern) {
          return; // Skip this finding completely
        }
        if (findingText.length > 80 && findingText.length < 800) {
          report.keyFindings.push({
            text: findingText,
            citations: [
              report.keyFindings.length + 1
            ]
          });
        }
      }
    });
  }
  // If we still don't have enough findings, extract from cleaner sections
  if (report.keyFindings.length < 3) {
    // Try Insights section
    if (report.insights) {
      const insightsText = report.insights.replace(/\{[^}]*\}/g, '').replace(/utm_source=[^\s\)]+/gi, '').replace(/https?:\/\/[^\s\)]+/g, '').replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)[^\s\)]*/gi, '');
      const insightsSentences = insightsText.split(/[.!?]+/).filter((s)=>{
        const trimmed = s.trim();
        return trimmed.length > 60 && trimmed.length < 400 && !trimmed.match(/utm_source|end_index|start_index|"type"|url_citation/i) && !trimmed.match(/[a-z]+\.(org|com|net)/gi) && trimmed.split(/\s+/).length > 12;
      });
      insightsSentences.slice(0, 3).forEach((sentence)=>{
        const clean = sentence.trim() + '.';
        if (clean.length > 80 && clean.length < 600 && !clean.match(/utm_source|end_index|start_index|"type"|url_citation|[a-z]+\.(org|com|net)/gi)) {
          report.keyFindings.push({
            text: clean,
            citations: [
              report.keyFindings.length + 1
            ]
          });
        }
      });
    }
    // Try Conclusion section as last resort
    if (report.keyFindings.length < 3 && report.conclusion) {
      const conclusionText = report.conclusion.replace(/\{[^}]*\}/g, '').replace(/utm_source=[^\s\)]+/gi, '').replace(/https?:\/\/[^\s\)]+/g, '').replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)[^\s\)]*/gi, '');
      const conclusionSentences = conclusionText.split(/[.!?]+/).filter((s)=>{
        const trimmed = s.trim();
        return trimmed.length > 60 && trimmed.length < 400 && !trimmed.match(/utm_source|end_index|start_index|"type"|url_citation/i) && !trimmed.match(/[a-z]+\.(org|com|net)/gi) && trimmed.split(/\s+/).length > 12;
      });
      conclusionSentences.slice(0, 2).forEach((sentence)=>{
        const clean = sentence.trim() + '.';
        if (clean.length > 80 && clean.length < 600 && !clean.match(/utm_source|end_index|start_index|"type"|url_citation|[a-z]+\.(org|com|net)/gi)) {
          report.keyFindings.push({
            text: clean,
            citations: [
              report.keyFindings.length + 1
            ]
          });
        }
      });
    }
  }
  // Extract Insights and Implications
  const insightsMatch = cleanText.match(/#\s*Insights\s*and\s*Implications\s*\n(.*?)(?=\n\s*#\s*(Conclusion|Recommendations)|$)/is);
  if (insightsMatch) {
    report.insights = insightsMatch[1].trim();
  }
  // Extract Conclusion and Recommendations
  const conclusionMatch = cleanText.match(/#\s*Conclusion\s*and\s*Recommendations\s*\n(.*?)$/is);
  if (conclusionMatch) {
    report.conclusion = conclusionMatch[1].trim();
  }
  // Fallback: if no structured findings, extract meaningful sentences from Detailed Analysis or whole text
  if (report.keyFindings.length === 0) {
    const sourceText = report.detailedAnalysis || cleanText;
    const sentences = sourceText.split(/[.!?]+/).filter((s)=>{
      const trimmed = s.trim();
      // Filter out technical artifacts and URL patterns
      if (trimmed.length < 50 || trimmed.length > 500) return false;
      if (trimmed.match(/^#+\s/)) return false // Headings
      ;
      if (trimmed.match(/https?:\/\//)) return false // URLs
      ;
      if (trimmed.match(/\{[^}]*"type"/)) return false // JSON
      ;
      if (trimmed.match(/utm_source|end_index/i)) return false // JSON fields
      ;
      // Reject URL path patterns
      if (trimmed.match(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\//i)) return false;
      if (trimmed.match(/^[a-z]+\.(com|org|net)\//i)) return false;
      if (trimmed.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+\//i)) return false;
      // Must have substantial word count
      if (trimmed.split(/\s+/).length < 10) return false;
      return true;
    });
    const findings: KeyFinding[] = sentences.slice(0, 8).map((s, i)=>{
      let clean = s.trim();
      // Clean up any remaining artifacts
      clean = clean.replace(/https?:\/\/[^\s\)]+/g, '');
      clean = clean.replace(/\{[^}]*\}/g, '');
      clean = clean.replace(/[a-z]+\.(com|org|net|edu|gov|io|co|uk)\/[^\s\)]+/gi, '') // Remove domain paths
      ;
      clean = clean.replace(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\//gi, '') // Remove path patterns
      ;
      clean = clean.replace(/\s+/g, ' ').trim();
      // Final check - reject if it still looks like a URL path
      if (clean.match(/^(com|org|net|edu|gov|io|co|uk)\//i) || clean.match(/^\/[a-z0-9\-]+\//i) || clean.split(/\s+/).length < 10) {
        return null;
      }
      return {
        text: clean,
        citations: [
          i + 1
        ]
      };
    }).filter((f): f is KeyFinding => f !== null && typeof f.text === 'string' && f.text.length > 50);
    report.keyFindings = findings;
  }
  // Final safety check - remove any findings that look like URL paths
  report.keyFindings = report.keyFindings.filter((finding)=>{
    const text = finding.text;
    // Reject if it looks like a URL path
    if (text.match(/^(com|org|net|edu|gov|io|co|uk)\//i)) return false;
    if (text.match(/^\/[a-z0-9\-]+\//i)) return false;
    if (text.match(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\/[a-z0-9\-]+/i)) return false;
    if (text.split(/\s+/).length < 10) return false // Must have substantial words
    ;
    // Must contain readable words, not just path segments
    const wordCount = text.split(/\s+/).length;
    const hasReadableWords = text.match(/\b(the|a|an|is|are|was|were|and|or|but|in|on|at|to|for|of|with|by)\b/i);
    if (!hasReadableWords && wordCount < 15) return false;
    return true;
  });
  // Extract Sources section with format: "1. Title - https://url.com - 2024-01-15"
  const sourcesMatch = cleanText.match(/#\s*Sources\s*\n(.*?)(?=\n\s*#|$)/is);
  if (sourcesMatch) {
    const sourcesText = sourcesMatch[1].trim();
    const sourceLines = sourcesText.split('\n').filter((line)=>line.trim());
    sourceLines.forEach((line)=>{
      // Match format: "1. Title - https://url.com - 2024-01-15"
      // Also handle variations: "1. Title - https://url.com - Date" or "1. Title - URL - Date"
      const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(https?:\/\/[^\s-]+)\s*-\s*(\d{4}-\d{2}-\d{2}|[^\n]+)/i);
      if (match) {
        const title = match[1].trim();
        const url = match[2].trim();
        const date = match[3].trim();
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.replace('www.', '');
          // Validate date format (YYYY-MM-DD) or use current date
          let validDate = date;
          if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            validDate = new Date().toISOString().split('T')[0];
          }
          report.sources.push({
            url,
            domain,
            date: validDate,
            title
          });
        } catch (e) {
          // Skip invalid URLs
          console.log('Invalid URL in sources:', url);
        }
      } else {
        // Fallback: try to extract just URL if format doesn't match exactly
        const urlMatch = line.match(/(https?:\/\/[^\s-]+)/i);
        if (urlMatch) {
          try {
            const url = urlMatch[1].trim();
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            // Extract title (everything before the URL)
            const titleMatch = line.match(/^\d+\.\s*(.+?)\s*-\s*https?:\/\//i);
            const title = titleMatch ? titleMatch[1].trim() : domain;
            report.sources.push({
              url,
              domain,
              date: new Date().toISOString().split('T')[0],
              title
            });
          } catch (e) {
          // Skip invalid URLs
          }
        }
      }
    });
  }
  // Try to extract any URLs mentioned anywhere in the text (even if Sources section format doesn't match)
  if (report.sources.length === 0) {
    console.log('No Sources section found, searching entire text for URLs...');
    const urlRegex = /https?:\/\/[^\s\)\n]+/g;
    const allUrls = text.match(urlRegex) || [];
    const uniqueUrls: string[] = [
      ...new Set(allUrls)
    ];
    // Filter out placeholder/example URLs
    const realUrls = uniqueUrls.filter((url: string)=>{
      const lowerUrl = url.toLowerCase();
      return !lowerUrl.includes('example.com') && !lowerUrl.includes('research-source') && !lowerUrl.includes('placeholder') && !lowerUrl.includes('mock') && (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('.org') || lowerUrl.includes('.com') || lowerUrl.includes('.net') || lowerUrl.includes('.io'));
    });
    console.log(`Found ${realUrls.length} real URLs in text`);
    realUrls.slice(0, 15).forEach((url, index)=>{
      try {
        // Clean URL (remove trailing punctuation, utm params, etc.)
        let cleanUrl = (url as string).replace(/[.,;:!?)\]]+$/, '').trim();
        // Remove utm parameters
        cleanUrl = cleanUrl.split('?')[0].split('#')[0];
        const urlObj = new URL(cleanUrl);
        const domain = urlObj.hostname.replace('www.', '');
        // Extract title from domain or try to find it in context
        let title = domain;
        const urlIndex = text.indexOf(url);
        if (urlIndex > 0) {
          const beforeUrl = text.substring(Math.max(0, urlIndex - 100), urlIndex);
          const titleMatch = beforeUrl.match(/([A-Z][^.!?]{10,80})\s*[-–—]\s*https?:\/\//i);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }
        }
        report.sources.push({
          url: cleanUrl,
          domain,
          date: new Date().toISOString().split('T')[0],
          title: title || domain
        });
      } catch (e) {
        console.log('Invalid URL found:', url);
      }
    });
  }
  // Only generate placeholders if absolutely no real URLs found anywhere
  if (report.sources.length === 0) {
    console.log('WARNING: No real sources found! Generating empty sources array.');
  // Don't generate placeholders - return empty array instead
  // This will show "No sources found" in the UI, which is better than fake sources
  }
  // Fallback: if no structured findings, extract from Detailed Analysis or entire text
  if (report.keyFindings.length === 0) {
    const fallbackText = report.detailedAnalysis || text;
    const sentences = fallbackText.split(/[.!?]+/).filter((s)=>s.trim().length > 20 && s.trim().length < 300);
    report.keyFindings = sentences.slice(0, 6).map((s, i)=>({
        text: s.trim(),
        citations: [
          i + 1
        ]
      }));
  }
  return report;
}
