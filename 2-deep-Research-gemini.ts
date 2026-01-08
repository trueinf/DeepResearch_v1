// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// @ts-ignore - Deno runtime
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
// @ts-ignore - Deno runtime
const USE_CLAUDE = Deno.env.get('USE_CLAUDE') === 'true' || !!ANTHROPIC_API_KEY

interface DeepResearchRequest {
  originalQuery: string
  clarifyingAnswers: string
  researchId?: string
  model?: string
  documentContext?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }

  // Read request body once and store it
  let requestBody: DeepResearchRequest
  try {
    requestBody = await req.json() as DeepResearchRequest
  } catch (parseError) {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }

  try {
    const { originalQuery, clarifyingAnswers, researchId, model, documentContext } = requestBody

    // Debug: Log incoming request
    console.log('=== DEEP RESEARCH REQUEST ===')
    console.log('Request body:', { 
      originalQuery: originalQuery?.substring(0, 50) + '...',
      model,
      hasModel: !!model,
      researchId,
      hasClarifyingAnswers: !!clarifyingAnswers
    })
    console.log('API Keys available:', {
      hasGeminiKey: !!GEMINI_API_KEY,
      hasAnthropicKey: !!ANTHROPIC_API_KEY,
      geminiKeyLength: GEMINI_API_KEY?.length || 0,
      anthropicKeyLength: ANTHROPIC_API_KEY?.length || 0
    })

    if (!originalQuery) {
      return new Response(
        JSON.stringify({ error: 'originalQuery is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Determine which model to use - STRICT: use exactly what user selected
    if (!model) {
      console.error('ERROR: Model parameter is missing!')
      return new Response(
        JSON.stringify({ error: 'Model parameter is required. Please specify claude-sonnet-4-20250514 or gemini-1.5-pro-latest' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    const selectedModel = model
    const isClaude = selectedModel.includes('claude')
    const isGemini = selectedModel.includes('gemini')
    
    // Strict model enforcement - only use the selected model
    const useClaude = isClaude && ANTHROPIC_API_KEY
    const useGemini = isGemini && GEMINI_API_KEY
    
    console.log('Model selection (STRICT):', { 
      requestedModel: model, 
      selectedModel, 
      isClaude,
      isGemini,
      useClaude, 
      useGemini,
      hasClaudeKey: !!ANTHROPIC_API_KEY,
      hasGeminiKey: !!GEMINI_API_KEY
    })
    
    // Validate API keys are available
    if (isGemini && !GEMINI_API_KEY) {
      console.error('ERROR: Gemini selected but GEMINI_API_KEY is missing!')
      return new Response(
        JSON.stringify({ error: 'Gemini selected but GEMINI_API_KEY not configured. Please set it in Supabase secrets.' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    if (isClaude && !ANTHROPIC_API_KEY) {
      console.error('ERROR: Claude selected but ANTHROPIC_API_KEY is missing!')
      return new Response(
        JSON.stringify({ error: 'Claude selected but ANTHROPIC_API_KEY not configured. Please set it in Supabase secrets.' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    if (!useClaude && !useGemini) {
      console.error('ERROR: Invalid model or missing API key!', {
        selectedModel,
        isClaude,
        isGemini,
        hasClaudeKey: !!ANTHROPIC_API_KEY,
        hasGeminiKey: !!GEMINI_API_KEY
      })
      return new Response(
        JSON.stringify({ error: `Invalid model: ${selectedModel}. Must be claude-sonnet-4-20250514 or gemini-1.5-pro-latest` }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }
    
    // Log which model will be used
    if (useClaude) {
      console.log('✅ Using Claude API ONLY - model:', selectedModel)
    } else if (useGemini) {
      console.log('✅ Using Gemini API ONLY - model:', selectedModel)
    }

    // Construct concise research prompt
    let researchPrompt = `Research: ${originalQuery}
${clarifyingAnswers ? `Scope: ${clarifyingAnswers.substring(0, 500)}` : ''}`

    // Add document context if provided (reduced size for faster processing)
    if (documentContext && documentContext.trim().length > 0) {
      researchPrompt += `\n\n--- UPLOADED DOCUMENTS ---
${documentContext.substring(0, 20000)}

IMPORTANT: Base research on documents above. Use document content as primary source.`
    }

    researchPrompt += `\n\nGenerate a concise research report (be brief and direct):
1. Executive Summary (2 short paragraphs)
2. Key Findings (4-5 bullet points, one sentence each)
3. Analysis (2 concise paragraphs)
4. Insights (1 short paragraph)
5. Conclusion (1 short paragraph)
${documentContext ? '6. Document References (brief)' : '6. Sources (5-6 URLs: "Title – URL – Date")'}

Rules: ${documentContext ? 'Focus on documents. ' : ''}Be concise. Short sentences. Real URLs only. Today: ${new Date().toISOString().split('T')[0]}`

    // Supabase Edge Functions have a 60s timeout on free tier, 300s on paid
    // Use 58 seconds to maximize time while staying safe (allows for retries)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 58000) // 58 second timeout
    
    let outputText = ''
    
    // STRICT: Use Claude ONLY if Claude is selected
    if (isClaude && useClaude) {
      // Use Claude API - no fallback to Gemini
      console.log('Executing with Claude API ONLY - model:', selectedModel)
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: selectedModel.includes('claude') ? (selectedModel.includes('4') || selectedModel.includes('sonnet-4') ? selectedModel : 'claude-sonnet-4-20250514') : 'claude-sonnet-4-20250514',
                max_tokens: 4096, // Reduced for faster processing
            messages: [{
              role: 'user',
              content: researchPrompt
            }],
          }),
        })
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          
          console.error('Claude API error:', response.status, errorData)
          
          // Use generic error messages - no rate limit mentions
          let errorMessage = 'API request failed. Please try again.'
          if (response.status === 401) {
            errorMessage = 'Invalid Anthropic API key. Please check your API key configuration.'
          } else if (response.status >= 500) {
            errorMessage = 'API server error. Please try again later.'
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              status: response.status,
              details: {} // Don't pass through API error details
            }),
            { 
              status: response.status >= 400 && response.status < 500 ? response.status : 500,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
        
        const data = await response.json()
        outputText = data.content?.[0]?.text || data.content || JSON.stringify(data, null, 2)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          return new Response(
            JSON.stringify({ 
              error: 'Request timeout - Claude API took too long to respond',
              details: 'The request exceeded 55 seconds. Try again or use a simpler query.'
            }),
            { 
              status: 504, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
        throw fetchError
      }
    } else if (isGemini && useGemini) {
      // Use Gemini API ONLY - no fallback to Claude
      console.log('Executing with Gemini API ONLY - model:', selectedModel)
      try {
        const requestBody = JSON.stringify({
          contents: [{
            parts: [{ text: researchPrompt }]
          }],
          generationConfig: {
            temperature: 0.6, // Lower temperature for faster, more deterministic responses
            maxOutputTokens: 2560, // Optimized for speed while maintaining quality
            topP: 0.85, // Slightly lower for faster sampling
            topK: 20, // Reduced for faster processing
          },
        })

        // Use only Gemini 1.5 Pro - no other Gemini models
        const geminiModel = 'gemini-1.5-pro-latest'
        
        console.log('=== GEMINI API CALL ===')
        console.log('Using Gemini model:', geminiModel)
        console.log('API Key present:', !!GEMINI_API_KEY)
        console.log('API Key length:', GEMINI_API_KEY?.length || 0)
        console.log('Full API endpoint:', `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`)
        
        if (!GEMINI_API_KEY) {
          console.error('FATAL ERROR: GEMINI_API_KEY is undefined or empty!')
          return new Response(
            JSON.stringify({ 
              error: 'GEMINI_API_KEY not configured. Please set it in Supabase Dashboard → Edge Functions → Secrets.',
              details: 'The API key is missing or not accessible. Check Supabase secrets configuration.'
            }),
            { 
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
        
        // Call Gemini 1.5 Pro API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`, {
          method: 'POST',
          headers: {
            'x-goog-api-key': GEMINI_API_KEY,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: requestBody,
        })
        clearTimeout(timeoutId)
        
        // Handle errors
        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          
          console.error('Gemini API error:', response.status, errorData)
          
          // Use generic error messages - no rate limit mentions
          let errorMessage = 'API request failed. Please try again.'
          if (response.status === 401) {
            errorMessage = 'Invalid Gemini API key. Please check your API key configuration.'
          } else if (response.status === 404) {
            errorMessage = 'Model not found. Please check your Gemini API key and model name.'
          } else if (response.status >= 500) {
            errorMessage = 'API server error. Please try again later.'
          }
          
          return new Response(
            JSON.stringify({ 
              error: errorMessage,
              status: response.status,
              details: {} // Don't pass through API error details
            }),
            { 
              status: response.status >= 400 && response.status < 500 ? response.status : 500,
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }

        // Only parse response if we haven't already set outputText from fallback
        if (!outputText) {
          const responseData = await response.json()
          
          // Gemini API response structure: candidates[0].content.parts[0].text
          if (responseData.candidates && Array.isArray(responseData.candidates) && responseData.candidates.length > 0) {
            const candidate = responseData.candidates[0]
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
              outputText = candidate.content.parts
                .filter((part: any) => part.text)
                .map((part: any) => part.text)
                .join('\n\n')
            }
          }

          if (!outputText) {
            outputText = JSON.stringify(responseData, null, 2)
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          return new Response(
            JSON.stringify({ 
              error: 'Request timeout - Gemini API took too long to respond',
              details: 'The request exceeded 50 seconds. Try again with a simpler query or smaller document.'
            }),
            { 
              status: 504, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
        throw fetchError
      }
    }

    const report = parseReport(outputText)

    console.log('Deep research completed')

    return new Response(
      JSON.stringify({
        status: 'completed',
        report: report,
        raw: outputText.substring(0, 2000),
        model: selectedModel // Return the exact model that was used
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }
})

function parseReport(text: string) {
  const report: {
    keyFindings: Array<{ text: string; citations: number[] }>
    sources: Array<{ url: string; domain: string; date: string; title?: string }>
    executiveSummary: string | null
    detailedAnalysis: string | null
    insights: string | null
    conclusion: string | null
    metadata: string | null
  } = {
    keyFindings: [],
    sources: [],
    executiveSummary: null,
    detailedAnalysis: null,
    insights: null,
    conclusion: null,
    metadata: null
  }

  // Extract metadata line from the beginning
  const metadataMatch = text.match(/^\*\*Research completed in.*?\*\*/i)
  if (metadataMatch) {
    report.metadata = metadataMatch[0].replace(/\*\*/g, '').trim()
  }

  // Remove metadata line from the beginning if present
  let cleanText = text.replace(/^\*\*Research completed in.*?\*\*\s*\n?/i, '').trim()

  // Extract Executive Summary
  const execSummaryMatch = cleanText.match(/#\s*Executive Summary\s*\n(.*?)(?=\n\s*#|$)/is)
  if (execSummaryMatch) {
    report.executiveSummary = execSummaryMatch[1].trim()
  }

  // Extract Web Research & Findings
  const webResearchMatch = cleanText.match(/#\s*Web Research\s*&\s*Findings\s*\n(.*?)(?=\n\s*#\s*(Deep Analysis|Insights|Conclusion)|$)/is)
  // Extract Deep Analysis and Interpretation
  const deepAnalysisMatch = cleanText.match(/#\s*Deep Analysis\s*and\s*Interpretation\s*\n(.*?)(?=\n\s*#\s*(Insights|Conclusion)|$)/is)
  
  // Combine both sections into detailedAnalysis
  let analysisText = ''
  if (webResearchMatch) {
    analysisText += webResearchMatch[1].trim() + '\n\n'
  }
  if (deepAnalysisMatch) {
    analysisText += deepAnalysisMatch[1].trim()
  }
  
  if (analysisText) {
    report.detailedAnalysis = analysisText.trim()
    
    // Extract key findings - PRIORITIZE clean sections first, then clean analysis
    // Strategy: Extract from Executive Summary first (usually cleanest), then clean analysis sections
    
    // First, try to extract from Executive Summary (usually the cleanest)
    if (report.executiveSummary) {
      const execSentences = report.executiveSummary.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim()
        return trimmed.length > 40 && trimmed.length < 300 && 
               !trimmed.match(/utm_source|end_index|start_index|"type"|url_citation/i) &&
               !trimmed.match(/[a-z]+\.(org|com|net)/gi) &&
               trimmed.split(/\s+/).length > 8
      })
      
      if (execSentences.length > 0) {
        execSentences.slice(0, 3).forEach((sentence, idx) => {
          const clean = sentence.trim() + '.'
          if (clean.length > 50 && clean.length < 500) {
            report.keyFindings.push({
              text: clean,
              citations: [idx + 1]
            })
          }
        })
      }
    }
    
    // Now process analysis sections with ULTRA aggressive filtering
    let cleanedAnalysis = analysisText
    
    // Remove JSON citation objects completely (ALL patterns - be exhaustive)
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"type"[^}]*"url_citation"[^}]*\}/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"end_index"[^}]*\}/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"start_index"[^}]*\}/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]*"title"[^}]*"url"[^}]*\}/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/"type":\s*"[^"]*",\s*"end_index":\s*\d+,\s*"start_index":\s*\d+[^}]*/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/utm_source=anthropic[^}]*\}/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/utm_source=[^\s\)]+/gi, '')
    cleanedAnalysis = cleanedAnalysis.replace(/utm_source=anthropic"\s*\},\s*\{/g, '')
    
    // Remove URL fragments and domain paths (exhaustive patterns)
    cleanedAnalysis = cleanedAnalysis.replace(/https?:\/\/[^\s\)]+/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/https?:\/\/www\.[^\s\)]+/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/https?:\/\/en\.[^\s\)]+/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)\/[^\s\)]+/gi, '')
    cleanedAnalysis = cleanedAnalysis.replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)\/[^\s\)]*/gi, '')
    cleanedAnalysis = cleanedAnalysis.replace(/blog\/[a-z0-9\-]+\/[a-z0-9\-]+/gi, '') // blog paths
    cleanedAnalysis = cleanedAnalysis.replace(/\/[a-z0-9\-]+\/[a-z0-9\-]+\/[a-z0-9\-]+/gi, '') // Path fragments
    cleanedAnalysis = cleanedAnalysis.replace(/\/[a-z0-9\-]+\/[a-z0-9\-]+/gi, '') // Shorter paths
    
    // Remove standalone domain fragments
    cleanedAnalysis = cleanedAnalysis.replace(/\b[a-z]+\.(org|com|net|edu|gov|io|co|uk)\b/gi, '')
    cleanedAnalysis = cleanedAnalysis.replace(/\b(org|com|net|edu|gov|io|co|uk)\/[^\s\)]+/gi, '')
    
    // Remove any remaining JSON-like structures (more aggressive)
    cleanedAnalysis = cleanedAnalysis.replace(/\{[^}]{0,500}\}/g, '') // Any JSON objects (larger)
    cleanedAnalysis = cleanedAnalysis.replace(/"title":\s*"[^"]*"/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/"url":\s*"[^"]*"/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/"type":\s*"[^"]*"/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/"end_index":\s*\d+/g, '')
    cleanedAnalysis = cleanedAnalysis.replace(/"start_index":\s*\d+/g, '')
    
    // Remove lines that are mostly technical artifacts
    const lines = cleanedAnalysis.split('\n')
    cleanedAnalysis = lines.filter(line => {
      const trimmed = line.trim()
      if (!trimmed) return false
      // Reject lines that are mostly technical
      const techCount = (trimmed.match(/utm_source|end_index|start_index|"type"|url_citation|"url"|"title"/gi) || []).length
      const domainCount = (trimmed.match(/[a-z]+\.(org|com|net)/gi) || []).length
      const jsonCount = (trimmed.match(/\{[^}]*\}/g) || []).length
      const wordCount = trimmed.split(/\s+/).length
      
      // If more than 20% of content is technical, reject
      if (techCount > 0 || domainCount > 1 || jsonCount > 0) return false
      if (wordCount < 5) return false
      return true
    }).join('\n')
    
    // Split by paragraphs and filter aggressively
    const paragraphs = cleanedAnalysis.split(/\n\n+/).filter(p => {
      const trimmed = p.trim()
      // Exclude: subheadings, very short text, technical artifacts
      if (trimmed.length < 100) return false // Require longer paragraphs for quality
      if (trimmed.match(/^#+\s/)) return false // Subheadings
      if (trimmed.match(/^[\d\.\)\*\-\#]\s*$/)) return false // Just bullets/numbers
      
      // Check for technical content - reject if contains too many technical artifacts
      const hasJson = (trimmed.match(/\{[^}]*\}/g) || []).length > 0
      const hasUrls = (trimmed.match(/https?:\/\//g) || []).length > 0
      const hasDomainFragments = (trimmed.match(/[a-z]+\.(org|com|net)/gi) || []).length > 2
      const hasTechnicalFields = trimmed.match(/utm_source|end_index|start_index|"type"/i)
      
      if (hasJson || hasUrls || hasDomainFragments || hasTechnicalFields) return false
      
      // Check if it contains mostly readable text (not technical)
      const wordCount = trimmed.split(/\s+/).length
      if (wordCount < 15) return false // Need substantial content
      return true
    })
    
    // Extract meaningful findings from clean paragraphs
    paragraphs.forEach((paragraph, index) => {
      let cleanText = paragraph.trim()
      
      // Remove markdown formatting
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      cleanText = cleanText.replace(/\*(.*?)\*/g, '$1') // Italic
      cleanText = cleanText.replace(/`(.*?)`/g, '$1') // Code
      cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      
      // Remove leading bullets, numbers, dashes
      cleanText = cleanText.replace(/^[\d\.\)\*\-\#]\s*/, '')
      
      // Final aggressive cleanup - remove ANY remaining artifacts
      cleanText = cleanText.replace(/\{[^}]*\}/g, '') // Any remaining JSON
      cleanText = cleanText.replace(/"[^"]*":\s*[^,}]+/g, '') // JSON key-value pairs
      cleanText = cleanText.replace(/https?:\/\/[^\s\)]+/g, '') // Any URLs
      cleanText = cleanText.replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)[^\s\)]*/gi, '') // Domain fragments
      cleanText = cleanText.replace(/utm_source=[^\s\)]+/gi, '') // UTM params
      cleanText = cleanText.replace(/\s+/g, ' ').trim() // Normalize whitespace
      
      // Extract complete sentences - take first 2-3 substantial sentences
      const sentences = cleanText.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim()
        // Must be substantial and readable - NO technical content
        if (trimmed.length < 50 || trimmed.length > 500) return false
        if (trimmed.split(/\s+/).length < 8) return false // At least 8 words
        
        // AGGRESSIVE filtering - reject if ANY technical content detected
        if (trimmed.match(/utm_source|end_index|start_index|"type"|url_citation|"url"|"title"/i)) return false
        if (trimmed.match(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)/i)) return false // No domains
        if (trimmed.match(/\{[^}]*\}/)) return false // No JSON
        if (trimmed.match(/https?:\/\//)) return false // No URLs
        if (trimmed.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+/)) return false // No paths
        if ((trimmed.match(/[a-z]+\.(org|com|net)/gi) || []).length > 0) return false
        
        // Check character composition - reject if too many special chars (likely technical)
        const specialCharRatio = (trimmed.match(/[{}":,\[\]\/]/g) || []).length / trimmed.length
        if (specialCharRatio > 0.1) return false // More than 10% special chars = likely technical
        
        return true
      })
      
      if (sentences.length > 0) {
        // Take first 2-3 sentences as a finding
        let findingText = sentences.slice(0, 3).join('. ').trim()
        if (!findingText.endsWith('.')) findingText += '.'
        
        // FINAL STRICT VERIFICATION - reject if ANY technical content remains
        const hasTechnical = findingText.match(/utm_source|end_index|start_index|"type"|url_citation|"url"|"title"|"end_index"|"start_index"/i)
        const hasDomains = findingText.match(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)/gi)
        const hasJson = findingText.match(/\{[^}]*\}/)
        const hasUrls = findingText.match(/https?:\/\//)
        const hasPaths = findingText.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+/)
        // Reject URL path patterns like "com/education/news/..." or "/city/lucknow/..."
        const hasUrlPathPattern = findingText.match(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\//i) || 
                                  findingText.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+\/[a-z0-9\-]+/i) ||
                                  findingText.match(/^[a-z]+\.(com|org|net)\//i) ||
                                  findingText.match(/\/articleshow\/|\/news\/|\/education\//i)
        
        // Reject if it looks like a URL path (starts with domain or path pattern)
        if (findingText.match(/^(com|org|net|edu|gov|io|co|uk)\//i) || 
            findingText.match(/^\/[a-z0-9\-]+\//i) ||
            findingText.split(/\s+/).length < 10) {
          return // Skip - looks like a URL path, not readable text
        }
        
        if (hasTechnical || hasDomains || hasJson || hasUrls || hasPaths || hasUrlPathPattern) {
          return // Skip this finding completely
        }
        
        if (findingText.length > 80 && findingText.length < 800) {
          report.keyFindings.push({ 
            text: findingText,
            citations: [report.keyFindings.length + 1] 
          })
        }
      }
    })
  }
  
  // Extract Insights and Implications (must be done before fallback extraction)
  const insightsMatch = cleanText.match(/#\s*Insights\s*and\s*Implications\s*\n(.*?)(?=\n\s*#\s*(Conclusion|Recommendations)|$)/is)
  if (insightsMatch) {
    report.insights = insightsMatch[1].trim()
  }

  // Extract Conclusion and Recommendations (must be done before fallback extraction)
  const conclusionMatch = cleanText.match(/#\s*Conclusion\s*and\s*Recommendations\s*\n(.*?)$/is)
  if (conclusionMatch) {
    report.conclusion = conclusionMatch[1].trim()
  }

  // If we still don't have enough findings, extract from cleaner sections
  // Now that insights and conclusion are populated, we can use them
  if (report.keyFindings.length < 3) {
    // Try Insights section
    if (report.insights) {
      const insightsText = report.insights
        .replace(/\{[^}]*\}/g, '')
        .replace(/utm_source=[^\s\)]+/gi, '')
        .replace(/https?:\/\/[^\s\)]+/g, '')
        .replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)[^\s\)]*/gi, '')
      
      const insightsSentences = insightsText.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim()
        return trimmed.length > 60 && trimmed.length < 400 &&
               !trimmed.match(/utm_source|end_index|start_index|"type"|url_citation/i) &&
               !trimmed.match(/[a-z]+\.(org|com|net)/gi) &&
               trimmed.split(/\s+/).length > 12
      })
      
      insightsSentences.slice(0, 3).forEach((sentence) => {
        const clean = sentence.trim() + '.'
        if (clean.length > 80 && clean.length < 600 && 
            !clean.match(/utm_source|end_index|start_index|"type"|url_citation|[a-z]+\.(org|com|net)/gi)) {
          report.keyFindings.push({
            text: clean,
            citations: [report.keyFindings.length + 1]
          })
        }
      })
    }
    
    // Try Conclusion section as last resort
    if (report.keyFindings.length < 3 && report.conclusion) {
      const conclusionText = report.conclusion
        .replace(/\{[^}]*\}/g, '')
        .replace(/utm_source=[^\s\)]+/gi, '')
        .replace(/https?:\/\/[^\s\)]+/g, '')
        .replace(/[a-z]+\.(org|com|net|edu|gov|io|co|uk)[^\s\)]*/gi, '')
      
      const conclusionSentences = conclusionText.split(/[.!?]+/).filter(s => {
        const trimmed = s.trim()
        return trimmed.length > 60 && trimmed.length < 400 &&
               !trimmed.match(/utm_source|end_index|start_index|"type"|url_citation/i) &&
               !trimmed.match(/[a-z]+\.(org|com|net)/gi) &&
               trimmed.split(/\s+/).length > 12
      })
      
      conclusionSentences.slice(0, 2).forEach((sentence) => {
        const clean = sentence.trim() + '.'
        if (clean.length > 80 && clean.length < 600 && 
            !clean.match(/utm_source|end_index|start_index|"type"|url_citation|[a-z]+\.(org|com|net)/gi)) {
          report.keyFindings.push({
            text: clean,
            citations: [report.keyFindings.length + 1]
          })
        }
      })
    }
  }

  // Fallback: if no structured findings, extract meaningful sentences from Detailed Analysis or whole text
  if (report.keyFindings.length === 0) {
    const sourceText = report.detailedAnalysis || cleanText
    const sentences = sourceText.split(/[.!?]+/).filter(s => {
      const trimmed = s.trim()
      // Filter out technical artifacts and URL patterns
      if (trimmed.length < 50 || trimmed.length > 500) return false
      if (trimmed.match(/^#+\s/)) return false // Headings
      if (trimmed.match(/https?:\/\//)) return false // URLs
      if (trimmed.match(/\{[^}]*"type"/)) return false // JSON
      if (trimmed.match(/utm_source|end_index/i)) return false // JSON fields
      // Reject URL path patterns
      if (trimmed.match(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\//i)) return false
      if (trimmed.match(/^[a-z]+\.(com|org|net)\//i)) return false
      if (trimmed.match(/\/[a-z0-9\-]+\/[a-z0-9\-]+\//i)) return false
      // Must have substantial word count
      if (trimmed.split(/\s+/).length < 10) return false
      return true
    })
    
    const findings = sentences.slice(0, 8).map((s, i) => {
      let clean = s.trim()
      // Clean up any remaining artifacts
      clean = clean.replace(/https?:\/\/[^\s\)]+/g, '')
      clean = clean.replace(/\{[^}]*\}/g, '')
      clean = clean.replace(/[a-z]+\.(com|org|net|edu|gov|io|co|uk)\/[^\s\)]+/gi, '') // Remove domain paths
      clean = clean.replace(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\//gi, '') // Remove path patterns
      clean = clean.replace(/\s+/g, ' ').trim()
      
      // Final check - reject if it still looks like a URL path
      if (clean.match(/^(com|org|net|edu|gov|io|co|uk)\//i) || 
          clean.match(/^\/[a-z0-9\-]+\//i) ||
          clean.split(/\s+/).length < 10) {
        return null
      }
      
      return {
        text: clean,
        citations: [i + 1]
      }
    }).filter((f): f is { text: string; citations: number[] } => f !== null && typeof f.text === 'string' && f.text.length > 50)
    
    report.keyFindings = findings
  }
  
  // Final safety check - remove any findings that look like URL paths
  report.keyFindings = report.keyFindings.filter(finding => {
    const text = finding.text
    // Reject if it looks like a URL path
    if (text.match(/^(com|org|net|edu|gov|io|co|uk)\//i)) return false
    if (text.match(/^\/[a-z0-9\-]+\//i)) return false
    if (text.match(/\b(com|org|net|edu|gov|io|co|uk)\/[a-z0-9\-]+\/[a-z0-9\-]+/i)) return false
    if (text.split(/\s+/).length < 10) return false // Must have substantial words
    // Must contain readable words, not just path segments
    const wordCount = text.split(/\s+/).length
    const hasReadableWords = text.match(/\b(the|a|an|is|are|was|were|and|or|but|in|on|at|to|for|of|with|by)\b/i)
    if (!hasReadableWords && wordCount < 15) return false
    return true
  })

  // Extract Sources section with format: "1. Title - https://url.com - 2024-01-15"
  const sourcesMatch = cleanText.match(/#\s*Sources\s*\n(.*?)(?=\n\s*#|$)/is)
  if (sourcesMatch) {
    const sourcesText = sourcesMatch[1].trim()
    const sourceLines = sourcesText.split('\n').filter(line => line.trim())
    
    sourceLines.forEach(line => {
      // Match format: "1. Title - https://url.com - 2024-01-15"
      // Also handle variations: "1. Title - https://url.com - Date" or "1. Title - URL - Date"
      const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(https?:\/\/[^\s-]+)\s*-\s*(\d{4}-\d{2}-\d{2}|[^\n]+)/i)
      if (match) {
        const title = match[1].trim()
        const url = match[2].trim()
        const date = match[3].trim()
        
        try {
          const urlObj = new URL(url)
          const domain = urlObj.hostname.replace('www.', '')
          
          // Validate date format (YYYY-MM-DD) or use current date
          let validDate = date
          if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            validDate = new Date().toISOString().split('T')[0]
          }
          
          report.sources.push({
            url,
            domain,
            date: validDate,
            title
          })
        } catch (e) {
          // Skip invalid URLs
          console.log('Invalid URL in sources:', url)
        }
      } else {
        // Fallback: try to extract just URL if format doesn't match exactly
        const urlMatch = line.match(/(https?:\/\/[^\s-]+)/i)
        if (urlMatch) {
          try {
            const url = urlMatch[1].trim()
            const urlObj = new URL(url)
            const domain = urlObj.hostname.replace('www.', '')
            
            // Extract title (everything before the URL)
            const titleMatch = line.match(/^\d+\.\s*(.+?)\s*-\s*https?:\/\//i)
            const title = titleMatch ? titleMatch[1].trim() : domain
            
            report.sources.push({
              url,
              domain,
              date: new Date().toISOString().split('T')[0],
              title
            })
          } catch (e) {
            // Skip invalid URLs
          }
        }
      }
    })
  }
  
  // Try to extract any URLs mentioned anywhere in the text (even if Sources section format doesn't match)
  if (report.sources.length === 0) {
    console.log('No Sources section found, searching entire text for URLs...')
    const urlRegex = /https?:\/\/[^\s\)\n]+/g
    const allUrls = text.match(urlRegex) || []
    const uniqueUrls = [...new Set(allUrls)]
    
    // Filter out placeholder/example URLs
    const realUrls = uniqueUrls.filter(url => {
      const lowerUrl = url.toLowerCase()
      return !lowerUrl.includes('example.com') && 
             !lowerUrl.includes('research-source') && 
             !lowerUrl.includes('placeholder') &&
             !lowerUrl.includes('mock') &&
             (lowerUrl.includes('.gov') || lowerUrl.includes('.edu') || lowerUrl.includes('.org') || 
              lowerUrl.includes('.com') || lowerUrl.includes('.net') || lowerUrl.includes('.io'))
    })
    
    console.log(`Found ${realUrls.length} real URLs in text`)
    
    realUrls.slice(0, 15).forEach((url, index) => {
      try {
        // Clean URL (remove trailing punctuation, utm params, etc.)
        let cleanUrl = url.replace(/[.,;:!?)\]]+$/, '').trim()
        // Remove utm parameters
        cleanUrl = cleanUrl.split('?')[0].split('#')[0]
        
        const urlObj = new URL(cleanUrl)
        const domain = urlObj.hostname.replace('www.', '')
        
        // Extract title from domain or try to find it in context
        let title = domain
        const urlIndex = text.indexOf(url)
        if (urlIndex > 0) {
          const beforeUrl = text.substring(Math.max(0, urlIndex - 100), urlIndex)
          const titleMatch = beforeUrl.match(/([A-Z][^.!?]{10,80})\s*[-–—]\s*https?:\/\//i)
          if (titleMatch) {
            title = titleMatch[1].trim()
          }
        }
        
        report.sources.push({
          url: cleanUrl,
          domain,
          date: new Date().toISOString().split('T')[0],
          title: title || domain
        })
      } catch (e) {
        console.log('Invalid URL found:', url)
      }
    })
  }
  
  // Only generate placeholders if absolutely no real URLs found anywhere
  if (report.sources.length === 0) {
    console.log('WARNING: No real sources found! Generating empty sources array.')
    // Don't generate placeholders - return empty array instead
    // This will show "No sources found" in the UI, which is better than fake sources
  }

  // Fallback: if no structured findings, extract from Detailed Analysis or entire text
  if (report.keyFindings.length === 0) {
    const fallbackText = report.detailedAnalysis || text
    const sentences = fallbackText.split(/[.!?]+/).filter(s => s.trim().length > 20 && s.trim().length < 300)
    report.keyFindings = sentences.slice(0, 6).map((s, i) => ({
      text: s.trim(),
      citations: [i + 1]
    }))
  }

  return report
}

