// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

interface PPTAgentRequest {
  report: {
    topic: string
    executiveSummary?: string | null
    detailedAnalysis?: string | null
    keyFindings?: Array<{ text: string; citations: number[] }>
    insights?: string | null
    conclusion?: string | null
    sources?: Array<{ url: string; domain: string; date: string; title?: string }>
  }
  presentationStyle?: 'executive' | 'technical' | 'visual' | 'academic'
  slideCount?: number
}

interface SlideDesign {
  layout: 'title' | 'content' | 'two-column' | 'comparison' | 'timeline' | 'visual'
  visualType?: 'chart' | 'diagram' | 'image' | 'none'
  colorScheme?: 'professional' | 'modern' | 'corporate' | 'creative'
}

interface AgentSlide {
  title: string
  bullets: string[]
  design: SlideDesign
  speakerNotes?: string
  priority: 'high' | 'medium' | 'low'
}

interface PPTAgentResponse {
  slides: AgentSlide[]
  presentationStructure: {
    totalSlides: number
    estimatedDuration: number
    recommendedStyle: string
  }
  designRecommendations: {
    colorScheme: string
    fontStyle: string
    visualElements: string[]
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
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

  try {
    const { report, presentationStyle = 'executive', slideCount } = await req.json() as PPTAgentRequest

    if (!report || !report.topic) {
      return new Response(
        JSON.stringify({ error: 'Report data with topic is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY secret not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Build comprehensive report context
    let reportContext = `RESEARCH TOPIC: ${report.topic}\n\n`
    
    if (report.executiveSummary) {
      reportContext += `EXECUTIVE SUMMARY:\n${report.executiveSummary}\n\n`
    }
    
    if (report.keyFindings && report.keyFindings.length > 0) {
      reportContext += `KEY FINDINGS:\n`
      report.keyFindings.forEach((finding, idx) => {
        if (finding && finding.text) {
          reportContext += `${idx + 1}. ${finding.text}\n`
        }
      })
      reportContext += `\n`
    }
    
    if (report.detailedAnalysis) {
      reportContext += `DETAILED ANALYSIS:\n${report.detailedAnalysis.substring(0, 2000)}\n\n`
    }
    
    if (report.insights) {
      reportContext += `INSIGHTS:\n${report.insights.substring(0, 1000)}\n\n`
    }
    
    if (report.conclusion) {
      reportContext += `CONCLUSION:\n${report.conclusion.substring(0, 1000)}\n\n`
    }

    // Premium PPT Generation Agent - Minimalist & Modern Design
    const agentPrompt = `You are an expert presentation designer specializing in minimalist, modern presentations. Transform this research report into a clean, professional presentation.

RESEARCH REPORT TO TRANSFORM:
${reportContext}

TASK: Generate ${slideCount || '10'} slides following the exact format and styling rules below.

PRESENTATION STYLE: ${presentationStyle}
- executive: Business-focused, strategic, actionable
- technical: Data-driven, detailed, comprehensive
- visual: Design-forward, minimal text, high visual impact
- academic: Research-focused, citations, scholarly

🔧 PPT OUTPUT FORMAT (STRUCTURAL RULES):

Each slide MUST follow this structure:
- Slide number: Always numbered (Slide 1, Slide 2, etc.)
- Title: Short (3-6 words), compelling, benefit-focused
- Bullet Points: Concise (8-12 words each), maximum 6 bullets per slide
- Speaker Notes: 1-3 sentences of talking points (optional but recommended)
- Layout: Title + Content (standard), or Title (for title slide)

🎨 STYLING / DESIGN RULES:

Design Style: Minimalist & Modern

Color Palette:
- Primary: #1F4E79 (deep blue) - for headers, titles, accents
- Secondary: #D9E2EF (light gray-blue) - for backgrounds, subtle elements
- Accent: #F2C94C (warm yellow) - for highlights, callouts
- Background: #FFFFFF (white) - clean white background

Font Style:
- Title Font: Bold, Sans-serif (Segoe UI / Calibri)
- Body Font: Regular, Sans-serif (Segoe UI / Calibri)

Visual Guidelines:
- Clean icons or simple illustrations only when needed
- No overly complex charts unless requested
- Maintain consistent spacing and alignment
- Maximum 1 key visual or diagram per slide

Slide Aspect Ratio: 16:9 widescreen (default modern format)

✨ QUALITY RULES:
- Keep slides high-level; avoid dense text
- Each slide communicates ONE idea only
- Use parallel structure in bullet points
- Avoid jargon unless audience expects it
- Keep formatting consistent across slides
- No full paragraphs on slides

OUTPUT FORMAT (JSON only, no markdown, no code blocks):
{
  "slides": [
    {
      "title": "Short compelling title (3-6 words)",
      "bullets": ["Concise point 1 (8-12 words)", "Point 2 (8-12 words)", "Point 3 (8-12 words)"],
      "design": {
        "layout": "content",
        "visualType": "none",
        "colorScheme": "minimalist"
      },
      "speakerNotes": "1-3 sentences of talking points and context",
      "priority": "high"
    }
  ],
  "presentationStructure": {
    "totalSlides": ${slideCount || 10},
    "estimatedDuration": ${Math.ceil((slideCount || 10) * 1.5)},
    "recommendedStyle": "${presentationStyle}"
  },
  "designRecommendations": {
    "colorScheme": "Primary: #1F4E79 (deep blue), Secondary: #D9E2EF (light gray-blue), Accent: #F2C94C (warm yellow), Background: White",
    "fontStyle": "Sans-serif (Segoe UI / Calibri), Bold for titles, Regular for body",
    "visualElements": ["Simple icons when needed", "Clean diagrams for processes", "Minimal charts for data"]
  }
}

CRITICAL RULES:
1. First slide MUST be a title slide (layout: "title") with compelling headline
2. All slides must be numbered in sequence
3. Slide titles: 3-6 words, compelling and benefit-focused
4. Bullet points: 8-12 words each, maximum 6 per slide
5. Speaker notes: 1-3 sentences, provide context and talking points
6. One idea per slide - no dense text
7. Use parallel structure in bullets
8. Keep formatting consistent
9. Executive Summary slide if available (3-5 key takeaways)
10. Key Findings split intelligently by theme
11. Conclusion with actionable recommendations

RETURN ONLY VALID JSON - no markdown, no code blocks, no explanations, just the JSON object.`

    // Use only Gemini 1.5 Pro
    const modelNames = [
      'gemini-1.5-pro-latest',    // Gemini 1.5 Pro (only model)
    ]
    
    let response: Response | null = null
    let lastError: any = null
    let usedModel = ''
    
    // Try each model until one works
    for (const modelName of modelNames) {
      try {
        usedModel = modelName
        console.log(`Trying Gemini model: ${modelName}`)
        
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`, {
          method: 'POST',
          headers: {
            'x-goog-api-key': GEMINI_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: agentPrompt }]
            }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8192,
              topP: 0.95,
              topK: 40,
              responseMimeType: 'application/json',
            },
            systemInstruction: {
              parts: [{ text: 'You are a world-class presentation design expert. Always create premium, executive-quality presentations with compelling titles, action-oriented bullets, and strategic speaker notes. Focus on storytelling, visual hierarchy, and driving action.' }]
            }
          }),
        })
        
        // If we get a successful response (200-299), break and use it
        if (response.ok) {
          console.log(`Successfully using model: ${modelName}`)
          break
        }
        
        // If 404, try next model
        if (response.status === 404) {
          const errorText = await response.text()
          console.log(`Model ${modelName} not found (404), trying next...`)
          lastError = { model: modelName, status: 404, message: errorText }
          response = null
          continue
        }
        
        // For other errors, break and handle
        break
        
      } catch (fetchError) {
        console.log(`Error with model ${modelName}:`, fetchError)
        lastError = fetchError
        response = null
        continue
      }
    }
    
    // If no model worked, try to list available models for debugging
    if (!response) {
      try {
        const listResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + GEMINI_API_KEY)
        let availableModels = []
        if (listResponse.ok) {
          const listData = await listResponse.json()
          availableModels = listData.models?.map((m: any) => m.name) || []
        }
        
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'No available Gemini model found. Tried: ' + modelNames.join(', '),
            statusCode: 404,
            details: {
              ...lastError,
              availableModels: availableModels.length > 0 ? availableModels : 'Could not fetch available models',
              suggestion: 'Check your Gemini API key and region. Available models may vary by account.'
            }
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      } catch (listError) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'No available Gemini model found. Tried: ' + modelNames.join(', '),
            statusCode: 404,
            details: {
              ...lastError,
              suggestion: 'Please check your Gemini API key and ensure you have access to Gemini models. Visit https://ai.google.dev/models for available models.'
            }
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        )
      }
    }
    
    console.log(`Using Gemini model: ${usedModel}`)

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
      let errorMessage = 'Failed to generate presentation. Please try again.'
      if (response.status === 401) {
        errorMessage = 'Invalid Gemini API key'
      } else if (response.status >= 500) {
        errorMessage = 'API server error'
      }
      
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: errorMessage,
          statusCode: response.status,
          details: {} // Don't pass through API error details
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    const data = await response.json()
    let responseText = ''
    
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        responseText = candidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join('\n')
      }
    }

    if (!responseText) {
      throw new Error('No response from Gemini API')
    }

    // Parse JSON response
    let jsonText = responseText
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    let agentResponse: PPTAgentResponse
    try {
      agentResponse = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText.substring(0, 500))
      throw new Error('Failed to parse agent response')
    }

    // Validate and clean response
    if (!agentResponse.slides || !Array.isArray(agentResponse.slides)) {
      console.error('Invalid response structure:', {
        hasSlides: !!agentResponse.slides,
        isArray: Array.isArray(agentResponse.slides),
        responseKeys: Object.keys(agentResponse),
        response: JSON.stringify(agentResponse).substring(0, 500)
      })
      throw new Error('Invalid response: slides array missing')
    }

    // Ensure all slides have required fields
    agentResponse.slides = agentResponse.slides.map((slide, idx) => ({
      title: slide.title || `Slide ${idx + 1}`,
      bullets: Array.isArray(slide.bullets) ? slide.bullets.filter(b => b && typeof b === 'string' && b.trim().length > 0) : [],
      design: {
        layout: slide.design?.layout || 'content',
        visualType: slide.design?.visualType || 'none',
        colorScheme: slide.design?.colorScheme || 'professional'
      },
      speakerNotes: slide.speakerNotes || '',
      priority: slide.priority || 'medium'
    })).filter(slide => slide.bullets.length > 0 || slide.title)

    // Ensure we have at least one slide
    if (agentResponse.slides.length === 0) {
      throw new Error('No valid slides generated after filtering')
    }

    console.log('PPT Agent generated', agentResponse.slides.length, 'slides')

    return new Response(
      JSON.stringify({
        status: 'success',
        ...agentResponse
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        details: error?.stack 
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

