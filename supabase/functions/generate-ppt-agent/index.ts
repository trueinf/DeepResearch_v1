// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

interface StoryboardData {
  controllingInsight: string
  storySpine: string
  insightBuckets: Array<{
    id: string
    name: string
    description: string
    findings: string[]
  }>
  storyClaims: Array<{
    id: string
    claim: string
    insightBucketId: string
    narrativeLanguage: string
  }>
  sceneGroups: Array<{
    id: string
    storyClaimId: string
    type: 'context' | 'tension' | 'intervention' | 'proof' | 'outcome'
    description: string
    situation: string
  }>
  frames: Array<{
    id: string
    sceneGroupId: string
    frameNumber: number
    idea: string
    visualAction: string
    emotionalBeat: string
    logicalPurpose: string
    supportingEvidence?: string[]
  }>
  remainingResearch?: {
    unusedFindings: string[]
    supportingEvidence: Array<{
      frameId: string
      evidence: string
      source?: string
    }>
  }
}

interface PPTAgentRequest {
  storyboard?: StoryboardData // NEW: Storyboard data (preferred)
  report?: {
    topic: string
    executiveSummary?: string | null
    detailedAnalysis?: string | null
    keyFindings?: Array<{ text: string; citations: number[] }>
    insights?: string | null
    conclusion?: string | null
    sources?: Array<{ url: string; domain: string; date: string; title?: string }>
    ingestedContent?: any // Structured content from document-ingestion-agent
  }
  presentationStyle?: 'executive' | 'technical' | 'visual' | 'academic'
  slideCount?: number
}

interface AgentSlide {
  layout: 'title' | 'title_and_bullets' | 'two_column' | 'timeline' | 'conclusion'
  title: string
  subtitle?: string
  bullets?: string[]
  left_bullets?: string[]
  right_bullets?: string[]
  timeline_items?: Array<{ year: string; text: string }>
  icons?: string[]
}

interface PPTAgentResponse {
  slides: AgentSlide[]
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
    const { storyboard, report, presentationStyle = 'executive', slideCount } = await req.json() as PPTAgentRequest

    // Validate input - either storyboard or report must be provided
    if (!storyboard && (!report || !report.topic)) {
      return new Response(
        JSON.stringify({ error: 'Either storyboard data or report data with topic is required' }),
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

    // Build context from storyboard (preferred) or report (fallback)
    let reportContext = ''
    let topic = ''
    
    if (storyboard) {
      // Use storyboard data to build presentation context
      topic = storyboard.controllingInsight || 'Research Presentation'
      
      reportContext = `STORYBOARD-BASED PRESENTATION\n`
      reportContext += `Controlling Insight: ${storyboard.controllingInsight}\n`
      reportContext += `Story Spine: ${storyboard.storySpine}\n\n`
      
      // Add insight buckets
      if (storyboard.insightBuckets && storyboard.insightBuckets.length > 0) {
        reportContext += `INSIGHT BUCKETS:\n`
        storyboard.insightBuckets.forEach((bucket, idx) => {
          reportContext += `${idx + 1}. ${bucket.name}: ${bucket.description}\n`
          if (bucket.findings && bucket.findings.length > 0) {
            bucket.findings.forEach(f => reportContext += `   - ${f}\n`)
          }
        })
        reportContext += `\n`
      }
      
      // Add story claims
      if (storyboard.storyClaims && storyboard.storyClaims.length > 0) {
        reportContext += `STORY CLAIMS:\n`
        storyboard.storyClaims.forEach((claim, idx) => {
          reportContext += `${idx + 1}. ${claim.claim}\n`
          reportContext += `   Narrative: ${claim.narrativeLanguage}\n`
        })
        reportContext += `\n`
      }
      
      // Add scene groups organized by type
      if (storyboard.sceneGroups && storyboard.sceneGroups.length > 0) {
        reportContext += `SCENE GROUPS:\n`
        const scenesByType: Record<string, any[]> = {}
        storyboard.sceneGroups.forEach(scene => {
          if (!scenesByType[scene.type]) scenesByType[scene.type] = []
          scenesByType[scene.type].push(scene)
        })
        
        Object.entries(scenesByType).forEach(([type, scenes]) => {
          reportContext += `${type.toUpperCase()} SCENES:\n`
          scenes.forEach((scene, idx) => {
            reportContext += `  ${idx + 1}. ${scene.description}\n`
            reportContext += `     Situation: ${scene.situation}\n`
          })
        })
        reportContext += `\n`
      }
      
      // Add frames - these will become slides
      if (storyboard.frames && storyboard.frames.length > 0) {
        reportContext += `STORYBOARD FRAMES (Convert these into slides):\n`
        storyboard.frames
          .sort((a, b) => a.frameNumber - b.frameNumber)
          .forEach((frame, idx) => {
            reportContext += `Frame ${frame.frameNumber}: ${frame.idea}\n`
            reportContext += `  Visual Action: ${frame.visualAction}\n`
            reportContext += `  Emotional Beat: ${frame.emotionalBeat}\n`
            reportContext += `  Logical Purpose: ${frame.logicalPurpose}\n`
            if (frame.supportingEvidence && frame.supportingEvidence.length > 0) {
              reportContext += `  Evidence: ${frame.supportingEvidence.join(', ')}\n`
            }
            reportContext += `\n`
          })
      }
      
      // Add remaining research as supporting material
      if (storyboard.remainingResearch) {
        if (storyboard.remainingResearch.unusedFindings && storyboard.remainingResearch.unusedFindings.length > 0) {
          reportContext += `ADDITIONAL FINDINGS:\n`
          storyboard.remainingResearch.unusedFindings.forEach((finding, idx) => {
            reportContext += `${idx + 1}. ${finding}\n`
          })
          reportContext += `\n`
        }
      }
      
    } else if (report) {
      // Fallback: Use report data (original method)
      topic = report.topic
      
      reportContext = `RESEARCH TOPIC: ${report.topic}\n\n`
      
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
        reportContext += `DETAILED ANALYSIS:\n${report.detailedAnalysis.substring(0, 3000)}\n\n`
      }
      
      if (report.insights) {
        reportContext += `INSIGHTS:\n${report.insights.substring(0, 1500)}\n\n`
      }
      
      if (report.conclusion) {
        reportContext += `CONCLUSION:\n${report.conclusion.substring(0, 1500)}\n\n`
      }
      
      // Add sources for credibility
      if (report.sources && Array.isArray(report.sources) && report.sources.length > 0) {
        reportContext += `\n--- SOURCES & REFERENCES ---\n`
        report.sources.slice(0, 10).forEach((source: any, idx: number) => {
          reportContext += `${idx + 1}. ${source.title || source.domain || 'Source'}\n`
          if (source.url) reportContext += `   URL: ${source.url}\n`
          if (source.date) reportContext += `   Date: ${source.date}\n`
        })
        reportContext += `\n`
      }
    }

    // Add structured ingested content if available (enhances PPT with extracted insights)
    if (report && report.ingestedContent) {
      reportContext += `\n--- STRUCTURED DOCUMENT INSIGHTS ---\n`
      
      if (report.ingestedContent.summary) {
        reportContext += `\nDOCUMENT SUMMARY:\n${report.ingestedContent.summary.substring(0, 500)}\n`
      }
      
      if (report.ingestedContent.keyPoints && report.ingestedContent.keyPoints.length > 0) {
        reportContext += `\nKEY POINTS FROM DOCUMENTS:\n${report.ingestedContent.keyPoints.slice(0, 8).map((kp: string, i: number) => `${i + 1}. ${kp}`).join('\n')}\n`
      }
      
      if (report.ingestedContent.dataPoints && report.ingestedContent.dataPoints.length > 0) {
        reportContext += `\nDATA POINTS (CRITICAL - USE THESE IN SLIDES):\n${report.ingestedContent.dataPoints.slice(0, 15).map((dp: any) => `• ${dp.label}: ${dp.value}${dp.context ? ` (${dp.context})` : ''}`).join('\n')}\n`
        reportContext += `\nIMPORTANT: Include these specific metrics and data points in your slides. Use actual numbers, percentages, and values.\n`
      }
      
      if (report.ingestedContent.tables && report.ingestedContent.tables.length > 0) {
        reportContext += `\nTABLES (USE FOR COMPARISON SLIDES):\n${report.ingestedContent.tables.slice(0, 3).map((table: any, i: number) => {
          let tableText = `Table ${i + 1}: ${table.title || 'Untitled'}\n`
          if (table.description) tableText += `Description: ${table.description}\n`
          if (table.headers) tableText += `Headers: ${table.headers.join(' | ')}\n`
          if (table.rows && table.rows.length > 0) {
            tableText += `All rows:\n${table.rows.map((row: string[]) => row.join(' | ')).join('\n')}\n`
          }
          return tableText
        }).join('\n\n')}\n`
        reportContext += `\nIMPORTANT: Create comparison or data slides using these tables. Use two_column layout for comparisons.\n`
      }
      
      if (report.ingestedContent.insights && report.ingestedContent.insights.length > 0) {
        reportContext += `\nSTRATEGIC INSIGHTS:\n${report.ingestedContent.insights.slice(0, 8).map((insight: string, i: number) => `${i + 1}. ${insight}`).join('\n')}\n`
      }
      
      if (report.ingestedContent.timeline && report.ingestedContent.timeline.length > 0) {
        reportContext += `\nTIMELINE EVENTS:\n${report.ingestedContent.timeline.slice(0, 10).map((event: any) => `• ${event.date || 'Date'}: ${event.event || event.text || ''}`).join('\n')}\n`
        reportContext += `\nIMPORTANT: Use timeline layout for chronological events.\n`
      }
      
      if (report.ingestedContent.quotes && report.ingestedContent.quotes.length > 0) {
        reportContext += `\nNOTABLE QUOTES:\n${report.ingestedContent.quotes.slice(0, 5).map((quote: any) => `"${quote.text}"${quote.author ? ` - ${quote.author}` : ''}`).join('\n')}\n`
      }
      
      reportContext += `\nCRITICAL: Use ALL of the above structured data to create comprehensive, data-driven, industry-standard slides. Include specific metrics, use tables for comparisons, and reference timelines when relevant.\n\n`
    }

    // Elite Presentation Design AI - Structured for python-pptx
    const agentPrompt = `You are an Elite Presentation Design AI that generates structured slide content for a Python-based PPTX generator (python-pptx) using a predefined Slide Master.

Your job is to convert the user's research topic into clean, concise, designer-quality slide data that follows business consulting standards (McKinsey, BCG, Deloitte levels).

You MUST follow these rules:

--------------------------------------------------
🎨 BRANDING & STYLE RULES (MANDATORY)
--------------------------------------------------
- All slides must use **Arial** (do NOT suggest other fonts)
- The anchor brand color is **navy blue (#001F3F)**. Incorporate it naturally.
- Keep content minimal, crisp, and visually powerful.
- Prioritize clarity, hierarchy, and clean layouts.
- Avoid walls of text — use bullets.
- Use icons where helpful (choose from names like: trend-up, chip, clock, globe, people, alert, star).
- NEVER place more than 5 bullets per slide.
- IMAGES: For 2-4 slides that would benefit from visual content, add relevant images:
  * Market/Industry Analysis: Use business, analytics, or market-related images
  * Key Findings: Use data visualization, chart, or graph images
  * Methodology: Use research, analysis, or process images
  * Use Unsplash API: https://source.unsplash.com/800x600/?[keyword]
  * Keywords: business, analytics, data, research, market, growth, strategy, technology, chart, graph
  * Position: "right" (default), "left", or "center" for emphasis
  * Include descriptive caption in description field
  * Example: { "url": "https://source.unsplash.com/800x600/?business-analytics", "position": "right", "description": "Business analytics visualization" }

--------------------------------------------------
📐 OUTPUT FORMAT (STRICT JSON - REQUIRED)
--------------------------------------------------
Return the entire deck as JSON following this structure:

{
  "slides": [
    {
      "layout": "title", 
      "title": "Main Title Here",
      "subtitle": "Subtitle here (optional)"
    },
    {
      "layout": "title_and_bullets",
      "title": "Slide Title",
      "bullets": [
        "Bullet point 1",
        "Bullet point 2",
        "Bullet point 3"
      ],
      "icons": ["trend-up", "globe"],
      "image": {
        "url": "https://example.com/image.jpg",
        "position": "right",
        "description": "Image description for context"
      }
    },
    {
      "layout": "two_column",
      "title": "Comparison Slide",
      "left_bullets": [
        "Point A1",
        "Point A2"
      ],
      "right_bullets": [
        "Point B1",
        "Point B2"
      ],
      "icons": ["split", "compare"]
    },
    {
      "layout": "timeline",
      "title": "Timeline Title",
      "timeline_items": [
        {"year": "2020", "text": "Milestone 1"},
        {"year": "2022", "text": "Milestone 2"},
        {"year": "2025", "text": "Future milestone"}
      ],
      "icons": ["clock"]
    },
    {
      "layout": "conclusion",
      "title": "Key Takeaways",
      "bullets": [
        "Takeaway 1",
        "Takeaway 2",
        "Takeaway 3"
      ],
      "icons": ["star"]
    }
  ]
}

--------------------------------------------------
📊 INDUSTRY-STANDARD CONTENT GENERATION RULES
--------------------------------------------------
1. ALWAYS generate a comprehensive deck with 8-12 slides including:
   - 1 Title Slide (with topic and date)
   - 1 Executive Summary Slide (key highlights, objectives, scope)
   - 1-2 Methodology/Approach Slides (research methods, data sources, analysis framework)
   - 2-3 Key Findings Slides (with specific metrics, data points, and evidence)
   - 1-2 Market/Industry Analysis Slides (trends, size, growth, competitive landscape)
   - 1-2 Insights & Implications Slides (strategic insights, opportunities, risks)
   - 1 Recommendations & Action Items Slide (prioritized, actionable recommendations)
   - 1 Conclusion & Next Steps Slide (summary and forward-looking statements)

2. CONTENT QUALITY REQUIREMENTS:
   - Include SPECIFIC METRICS and DATA POINTS from the research (use actual numbers, percentages, dates)
   - Use industry-standard terminology and frameworks (SWOT, PEST, Porter's Five Forces when relevant)
   - Include quantitative data: market size, growth rates, percentages, timelines
   - Reference sources and data credibility when available
   - Make recommendations ACTIONABLE and PRIORITIZED
   - Include risk factors and mitigation strategies
   - Add competitive insights and market positioning

3. DATA-DRIVEN SLIDES:
   - Extract and highlight key metrics from dataPoints (revenue, growth %, market share, etc.)
   - Use tables data to create comparison slides
   - Include timeline information when available
   - Reference specific quotes or expert opinions when relevant

4. PROFESSIONAL LANGUAGE:
   - Use business consulting language (strategic, actionable, evidence-based)
   - Avoid generic statements - be specific and data-driven
   - Use industry-standard section headers
   - Include forward-looking statements and implications

5. SLIDE STRUCTURE:
   - Each slide should communicate ONE clear message
   - Use parallel structure in bullet points
   - Include context for all data points
   - Connect insights to business implications

6. CHARACTER LIMITS:
   - DO NOT exceed 120 characters per bullet
   - Keep titles under 60 characters
   - Ensure bullets are scannable and impactful

--------------------------------------------------
🔧 YOUR INPUT - ${storyboard ? 'STORYBOARD DATA' : 'COMPREHENSIVE RESEARCH DATA'}
--------------------------------------------------
${storyboard ? `Controlling Insight: ${storyboard.controllingInsight}\nStory Spine: ${storyboard.storySpine}\n\n` : `Research Topic: "${topic}"\n\n`}
${reportContext}

--------------------------------------------------
📋 INSTRUCTIONS FOR SLIDE GENERATION
--------------------------------------------------
${storyboard ? 
`Convert the storyboard frames above into a compelling presentation. Each frame represents a key moment in the narrative. Transform frames into slides that:

1. Follow the story spine: ${storyboard.storySpine}
2. Convert frames into slides - each frame's idea becomes a slide concept
3. Use scene groups to organize related frames into slide sections
4. Transform visual actions into slide visuals/descriptions
5. Convert emotional beats into compelling slide titles and messaging
6. Use logical purposes to structure slide content
7. Group related frames from the same scene group into cohesive slides
8. Use the controlling insight as the main theme throughout

The presentation should tell the story defined by the storyboard, with each slide advancing the narrative. Convert storyboard frames into presentation slides while maintaining the narrative flow.` :
`Based on the comprehensive research data above, create an industry-standard presentation deck:`}

${storyboard ? 
`1. TITLE SLIDE:
   - Use the controlling insight as the main title or subtitle
   - Include the research topic
   - Set the narrative tone

2. CONTROLLING INSIGHT SLIDE:
   - Present the single undeniable insight
   - Frame it as the core message
   - Make it compelling and memorable

3. STORY STRUCTURE SLIDES (based on story spine: ${storyboard.storySpine}):
   - Convert insight buckets into slide sections
   - Each bucket becomes a thematic section
   - Use story claims as slide titles or key messages

4. FRAME-BASED SLIDES:
   - Convert storyboard frames into individual slides
   - Group 2-3 related frames per slide when appropriate
   - Use frame ideas as slide concepts
   - Transform visual actions into slide descriptions
   - Convert emotional beats into compelling messaging
   - Use logical purposes to structure content

5. SCENE GROUP SLIDES:
   - Organize slides by scene type (context, tension, intervention, proof, outcome)
   - Use scene descriptions to create slide sections
   - Maintain narrative flow between slides

6. CONCLUSION SLIDE:
   - Return to the controlling insight
   - Reinforce the main message
   - Provide actionable next steps based on the story` :
`1. EXECUTIVE SUMMARY SLIDE:
   - Include: Research objectives, key highlights, scope, and main conclusions
   - Use data points and metrics from the research
   - Make it compelling and executive-ready

2. METHODOLOGY/APPROACH SLIDE:
   - Research methods used
   - Data sources and credibility
   - Analysis framework
   - Timeline or scope of research

3. KEY FINDINGS SLIDES (2-3 slides):
   - Extract SPECIFIC metrics, percentages, numbers from the data
   - Use dataPoints array to highlight key statistics
   - Include market size, growth rates, trends
   - Reference tables when available
   - Each finding should be evidence-based with data

4. MARKET/INDUSTRY ANALYSIS SLIDE:
   - Market size and growth trends
   - Competitive landscape
   - Industry trends and drivers
   - Use quantitative data from dataPoints

5. INSIGHTS & IMPLICATIONS SLIDES (1-2 slides):
   - Strategic insights derived from findings
   - Business implications
   - Opportunities and risks
   - Market implications
   - Connect data to strategic meaning

6. RECOMMENDATIONS & ACTION ITEMS SLIDE:
   - Prioritized recommendations (High/Medium/Low priority)
   - Actionable next steps
   - Implementation considerations
   - Expected outcomes or impact

7. CONCLUSION & NEXT STEPS SLIDE:
   - Summary of key takeaways
   - Forward-looking statements
   - Next steps or follow-up actions
   - Call to action if appropriate`}

CRITICAL REQUIREMENTS:
- Use ACTUAL data from the research (numbers, percentages, dates)
- Include specific metrics from dataPoints array
- Reference tables when available
- Make content informative and industry-standard
- Avoid generic statements - be specific and data-driven
- Include quantitative evidence for all claims
- Use professional business consulting language
- IMAGES: Add relevant images to 2-4 slides that would benefit from visual content:
  * Market/Industry Analysis slides - use business/analytics images
  * Key Findings slides - use data visualization or chart images
  * Methodology slides - use research/analysis images
  * Use Unsplash URLs: https://source.unsplash.com/800x600/?[keyword]
  * Keywords: business, analytics, data, research, market, growth, strategy, technology
  * Position images on "right" or "left" side, or "center" for emphasis
  * Include image description for context

--------------------------------------------------
🎯 YOUR GOAL
--------------------------------------------------
Produce the CLEANEST, most STRUCTURED, most PROFESSIONAL, most INFORMATIVE slide data that follows industry standards (McKinsey, BCG, Deloitte quality). Every slide should be data-driven, evidence-based, and actionable.

Return **ONLY the JSON** and nothing else.`

    // Try multiple model names in order of preference
    const modelNames = [
      'gemini-2.5-flash',         // Primary: Fast and reliable
      'gemini-2.5-pro',           // Fallback: Best quality
      'gemini-pro-latest',        // Fallback: Latest stable
      'gemini-flash-latest',      // Fallback: Latest flash
    ]
    
    let response: Response | null = null
    let responseData: any = null // Store parsed response data
    let lastError: any = null
    let usedModel = ''
    
    // Retry logic with exponential backoff for rate limits
    const maxRetries = 5
    let retryCount = 0
    let modelIndex = 0
    
    while (retryCount <= maxRetries && modelIndex < modelNames.length) {
      const modelName = modelNames[modelIndex]
      usedModel = modelName
      
      try {
        console.log(`Trying Gemini model: ${modelName} (attempt ${retryCount + 1}/${maxRetries + 1})`)
        
        // Add timeout to prevent 504 errors (Supabase Edge Functions have 60s timeout)
        const timeoutMs = 50000 // 50 seconds to leave buffer for Supabase
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        
        try {
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
              maxOutputTokens: 4096, // Reduced from 8192 to speed up response
              topP: 0.95,
              topK: 40,
              responseMimeType: 'application/json',
            },
              systemInstruction: {
                parts: [{ text: 'You are a world-class presentation design expert specializing in industry-standard business presentations (McKinsey, BCG, Deloitte quality). Always create data-driven, evidence-based slides with specific metrics, actionable recommendations, and strategic insights. Focus on: 1) Including actual numbers, percentages, and data points, 2) Using industry-standard frameworks and terminology, 3) Making recommendations prioritized and actionable, 4) Including market analysis, competitive insights, and risk factors, 5) Ensuring every claim is supported by evidence from the research data. Prioritize informative, comprehensive content over minimalism.' }]
              }
            }),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          if (fetchError.name === 'AbortError') {
            throw new Error(`Request timeout after ${timeoutMs / 1000}s. The API call took too long.`)
          }
          throw fetchError
        }
        
        // Parse response to check for rate limit errors (even with 200 status)
        let responseText = ''
        
        if (response.ok) {
          try {
            responseText = await response.text()
            if (responseText) {
              responseData = JSON.parse(responseText)
            }
          } catch (parseError) {
            // If parsing fails, check response status
            console.warn('Failed to parse response, checking status')
            responseData = null
          }
        } else {
          try {
            responseText = await response.text()
            if (responseText) {
              responseData = JSON.parse(responseText)
            } else {
              responseData = { error: 'Unknown error' }
            }
          } catch (parseError) {
            responseData = { error: responseText || 'Unknown error' }
          }
        }
        
        // Check for rate limit errors (429 status or rate limit in response body)
        if (response.status === 429 || (responseData && (
          responseData.error?.includes('Rate limit') ||
          responseData.error?.includes('rate limit') ||
          responseData.error?.includes('429') ||
          responseData.status === 429
        ))) {
          if (retryCount < maxRetries) {
            // Reduced backoff delays to prevent timeout (max 30s instead of 150s)
            const backoffDelay = Math.min(10000 + (retryCount * 10000), 30000) // 10s, 20s, 30s max
            retryCount++
            console.log(`Rate limit hit. Retrying in ${backoffDelay / 1000}s... (attempt ${retryCount + 1}/${maxRetries + 1})`)
            await new Promise(resolve => setTimeout(resolve, backoffDelay))
            continue // Retry with same model
          } else {
            // Max retries reached, try next model
            console.log(`Max retries reached for ${modelName}, trying next model...`)
            modelIndex++
            retryCount = 0 // Reset retry count for new model
            continue
          }
        }
        
        // If 404, try next model
        if (response.status === 404) {
          console.log(`Model ${modelName} not found (404), trying next...`)
          lastError = { model: modelName, status: 404, message: responseData?.error || 'Model not found' }
          modelIndex++
          retryCount = 0 // Reset retry count for new model
          continue
        }
        
        // If successful, break
        if (response.ok && responseData) {
          console.log(`✅ Successfully using model: ${modelName}`)
          // Store the parsed data - we'll use it directly later
          break
        }
        
        // For other errors, try next model
        console.log(`Error with model ${modelName}: ${response.status}`)
        lastError = { model: modelName, status: response.status, message: responseData?.error || 'Unknown error' }
        modelIndex++
        retryCount = 0 // Reset retry count for new model
        
      } catch (fetchError: any) {
        console.log(`Error with model ${modelName}:`, fetchError.message)
        lastError = fetchError
        
        // If it's a network error and we haven't exhausted retries, retry
        if (retryCount < maxRetries && (fetchError.message?.includes('fetch') || fetchError.message?.includes('network') || fetchError.message?.includes('timeout'))) {
          // Reduced backoff delays to prevent timeout
          const backoffDelay = Math.min(10000 + (retryCount * 10000), 30000) // 10s, 20s, 30s max
          retryCount++
          console.log(`Network/timeout error. Retrying in ${backoffDelay / 1000}s... (attempt ${retryCount + 1}/${maxRetries + 1})`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          continue
        }
        
        // Otherwise, try next model
        modelIndex++
        retryCount = 0
      }
    }
    
    // If no model worked, try to list available models for debugging
    if (!response || !responseData) {
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
            status: 200,
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
    
    // If no model worked after all retries
    if (!response || !response.ok || !responseData) {
      try {
        const listResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + GEMINI_API_KEY)
        let availableModels: string[] = []
        if (listResponse.ok) {
          const listData = await listResponse.json()
          availableModels = listData.models?.map((m: any) => m.name) || []
        }
        
        const errorMessage = response?.status === 429 
          ? 'Rate limit exceeded. Please wait a few minutes and try again.'
          : 'Failed to generate presentation. All models exhausted after retries.'
        
        return new Response(
          JSON.stringify({
            status: 'error',
            error: errorMessage,
            statusCode: response?.status || 500,
            details: {
              ...lastError,
              availableModels: availableModels.length > 0 ? availableModels : 'Could not fetch available models',
              suggestion: 'Check your Gemini API key and rate limits. Available models may vary by account.'
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
      } catch (listError) {
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'Failed to generate presentation. All models exhausted after retries.',
            statusCode: 500,
            details: {
              ...lastError,
              suggestion: 'Please check your Gemini API key and ensure you have access to Gemini models.'
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

    // Use the already parsed responseData
    const data = responseData
    
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

    // Ensure all slides have required fields and validate structure
    agentResponse.slides = agentResponse.slides.map((slide, idx) => {
      const layout = slide.layout || (idx === 0 ? 'title' : 'title_and_bullets')
      
      // Validate and clean bullets (max 120 chars each, max 5 bullets)
      const cleanBullets = (bullets?: string[]) => {
        if (!Array.isArray(bullets)) return []
        return bullets
          .filter(b => b && typeof b === 'string' && b.trim().length > 0)
          .map(b => b.substring(0, 120)) // Max 120 chars
          .slice(0, 5) // Max 5 bullets
      }
      
      const cleanedSlide: AgentSlide = {
        layout: layout as any,
        title: slide.title || `Slide ${idx + 1}`,
      }
      
      if (slide.subtitle) cleanedSlide.subtitle = slide.subtitle
      if (slide.bullets) cleanedSlide.bullets = cleanBullets(slide.bullets)
      if (slide.left_bullets) cleanedSlide.left_bullets = cleanBullets(slide.left_bullets)
      if (slide.right_bullets) cleanedSlide.right_bullets = cleanBullets(slide.right_bullets)
      if (slide.timeline_items) cleanedSlide.timeline_items = slide.timeline_items
      if (slide.icons) cleanedSlide.icons = slide.icons
      
      return cleanedSlide
    }).filter(slide => {
      // Keep slide if it has title and at least one content element
      return slide.title && (
        (slide.bullets && slide.bullets.length > 0) ||
        (slide.left_bullets && slide.left_bullets.length > 0) ||
        (slide.right_bullets && slide.right_bullets.length > 0) ||
        (slide.timeline_items && slide.timeline_items.length > 0) ||
        slide.layout === 'title'
      )
    })

    // Ensure we have at least one slide
    if (agentResponse.slides.length === 0) {
      throw new Error('No valid slides generated after filtering')
    }

    // Ensure we have title slide, content slides, and conclusion
    const hasTitle = agentResponse.slides.some(s => s.layout === 'title')
    const hasConclusion = agentResponse.slides.some(s => s.layout === 'conclusion')
    const contentSlides = agentResponse.slides.filter(s => s.layout !== 'title' && s.layout !== 'conclusion')
    
    // Add title slide if missing
    if (!hasTitle && agentResponse.slides.length > 0) {
      agentResponse.slides.unshift({
        layout: 'title',
        title: report.topic.substring(0, 60),
        subtitle: report.executiveSummary ? report.executiveSummary.substring(0, 100) : undefined
      })
    }
    
    // Add conclusion if missing
    if (!hasConclusion && agentResponse.slides.length > 0) {
      agentResponse.slides.push({
        layout: 'conclusion',
        title: 'Key Takeaways',
        bullets: report.conclusion 
          ? report.conclusion.split('\n').slice(0, 5).map(line => line.substring(0, 120))
          : ['Review key findings', 'Consider next steps', 'Apply insights'],
        icons: ['star']
      })
    }
    
    // Ensure we have 3-6 content slides
    if (contentSlides.length < 3) {
      // Add more content slides from key findings
      const additionalSlides = (report.keyFindings || []).slice(contentSlides.length, 3).map((finding: any, idx: number) => ({
        layout: 'title_and_bullets' as const,
        title: `Key Finding ${idx + 1}`,
        bullets: [finding.text || finding].slice(0, 5).map((text: string) => text.substring(0, 120)),
        icons: ['trend-up']
      }))
      
      // Insert before conclusion
      const conclusionIndex = agentResponse.slides.findIndex(s => s.layout === 'conclusion')
      if (conclusionIndex > 0) {
        agentResponse.slides.splice(conclusionIndex, 0, ...additionalSlides)
      } else {
        agentResponse.slides.push(...additionalSlides)
      }
    }

    console.log('PPT Agent generated', agentResponse.slides.length, 'slides')

    return new Response(
      JSON.stringify({
        status: 'success',
        slides: agentResponse.slides,
        presentationStructure: {
          totalSlides: agentResponse.slides.length,
          estimatedDuration: Math.ceil(agentResponse.slides.length * 1.5),
          recommendedStyle: presentationStyle
        },
        designRecommendations: {
          colorScheme: 'Navy blue (#001F3F) as anchor brand color',
          fontStyle: 'Arial (mandatory)',
          visualElements: ['Icons: trend-up, chip, clock, globe, people, alert, star']
        }
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

