// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

interface StoryboardRequest {
  report: {
    topic: string
    executiveSummary?: string | null
    detailedAnalysis?: string | null
    keyFindings?: Array<{ text: string; citations: number[] }>
    insights?: string | null
    conclusion?: string | null
    sources?: Array<{ url: string; domain: string; date: string; title?: string }>
  }
  storySpine?: 'problem-insight-resolution' | 'before-during-after' | 'question-discovery-answer'
  audience?: string
}

interface InsightBucket {
  id: string
  name: string
  description: string
  findings: string[]
}

interface StoryClaim {
  id: string
  claim: string
  insightBucketId: string
  narrativeLanguage: string
}

interface SceneGroup {
  id: string
  storyClaimId: string
  type: 'context' | 'tension' | 'intervention' | 'proof' | 'outcome'
  description: string
  situation: string
}

interface StoryboardFrame {
  id: string
  sceneGroupId: string
  frameNumber: number
  idea: string
  visualAction: string
  emotionalBeat: string
  logicalPurpose: string
  supportingEvidence?: string[]
}

interface StoryboardResponse {
  controllingInsight: string
  storySpine: string
  insightBuckets: InsightBucket[]
  storyClaims: StoryClaim[]
  sceneGroups: SceneGroup[]
  frames: StoryboardFrame[]
  remainingResearch: {
    unusedFindings: string[]
    supportingEvidence: Array<{
      frameId: string
      evidence: string
      source?: string
    }>
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
    const { report, storySpine = 'problem-insight-resolution', audience = 'general' } = await req.json() as StoryboardRequest

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
      reportContext += `DETAILED ANALYSIS:\n${String(report.detailedAnalysis).substring(0, 3000)}\n\n`
    }
    
    if (report.insights) {
      reportContext += `INSIGHTS:\n${String(report.insights).substring(0, 1500)}\n\n`
    }
    
    if (report.conclusion) {
      reportContext += `CONCLUSION:\n${String(report.conclusion).substring(0, 1500)}\n\n`
    }

    // Storyboard Generation Agent Prompt - 7-Step Process
    const storyboardPrompt = `You are an expert storyboard designer specializing in converting research findings into compelling narrative visualizations.

RESEARCH REPORT TO TRANSFORM:
${reportContext}

TASK: Convert this research into a clear, persuasive storyboard that communicates one undeniable insight.

AUDIENCE: ${audience}
STORY SPINE: ${storySpine}

---

## STEP 1: IDENTIFY THE CONTROLLING INSIGHT

Review all research findings and answer this question:
What is the single most important thing this research makes undeniable?

Requirements:
- Express the answer in ONE clear sentence
- Do NOT include numbers or metrics
- Do NOT list multiple conclusions
- This sentence is the controlling idea of the storyboard
- If it cannot be stated clearly in one sentence, return an error

---

## STEP 2: GROUP FINDINGS INTO 3-4 INSIGHT BUCKETS

Cluster the research findings into three or four meaningful insight groups.

Each group must:
- Support the controlling insight
- Represent a distinct idea (no overlap)
- Be explainable in plain language before showing data
- Avoid grouping by data source, system type, or methodology
- Focus on what the research reveals, not where it came from

---

## STEP 3: CONVERT EACH INSIGHT INTO A STORY CLAIM

Translate each insight bucket into a story claim.

A story claim:
- Is written in narrative language, not research language
- Expresses a point of view
- Is something the storyboard will prove visually
- Each section of the storyboard must make one claim, not present raw findings

---

## STEP 4: CHOOSE A STORY SPINE

The story spine is: ${storySpine}

Use this structure consistently:
${storySpine === 'problem-insight-resolution' ? '- Problem → Insight → Resolution' : storySpine === 'before-during-after' ? '- Before → During → After' : '- Question → Discovery → Answer'}

Do not mix structures.

---

## STEP 5: BUILD SCENE GROUPS

For each story claim, outline scene groups using this progression:
- Context – establish the normal situation
- Tension – reveal the problem or risk
- Intervention – introduce the insight or change
- Proof – show validation or evidence
- Outcome – show the result or impact

Each claim usually requires two to four scenes.
At this stage, describe situations, not visuals or shots.

---

## STEP 6: DESIGN INDIVIDUAL STORYBOARD FRAMES

Break scenes into individual frames.

Every frame must answer this question: What does this frame prove?

Each frame should include:
- One idea only
- One visual action
- One emotional beat
- One logical purpose

If a frame does not clearly prove something, it should be removed.

---

## STEP 7: HANDLE THE REMAINING RESEARCH

Do not place all research directly into the storyboard.

Instead:
- Identify unused findings that support the story but don't fit in frames
- Attach research as supporting evidence to relevant frames
- Make it available through expandable elements such as tooltips, drill-downs, side panels, "How we know this" sections

---

OUTPUT FORMAT (JSON only, no markdown, no code blocks):
{
  "controllingInsight": "One clear sentence stating the single most important thing this research makes undeniable (no numbers or metrics)",
  "storySpine": "${storySpine}",
  "insightBuckets": [
    {
      "id": "bucket-1",
      "name": "Short descriptive name",
      "description": "What this bucket reveals in plain language",
      "findings": ["Finding 1 that supports this bucket", "Finding 2", "Finding 3"]
    }
  ],
  "storyClaims": [
    {
      "id": "claim-1",
      "claim": "Narrative language claim that expresses a point of view",
      "insightBucketId": "bucket-1",
      "narrativeLanguage": "The story claim rewritten in compelling narrative form"
    }
  ],
  "sceneGroups": [
    {
      "id": "scene-1",
      "storyClaimId": "claim-1",
      "type": "context",
      "description": "What this scene establishes",
      "situation": "The normal situation or context being shown"
    }
  ],
  "frames": [
    {
      "id": "frame-1",
      "sceneGroupId": "scene-1",
      "frameNumber": 1,
      "idea": "The single idea this frame communicates",
      "visualAction": "What the viewer sees happening visually",
      "emotionalBeat": "The emotional response this frame should evoke",
      "logicalPurpose": "What this frame proves logically",
      "supportingEvidence": ["Evidence point 1", "Evidence point 2"]
    }
  ],
  "remainingResearch": {
    "unusedFindings": ["Finding that supports story but doesn't fit in frames"],
    "supportingEvidence": [
      {
        "frameId": "frame-1",
        "evidence": "Additional research evidence for this frame",
        "source": "Source reference if available"
      }
    ]
  }
}

CRITICAL RULES:
1. Controlling insight must be ONE sentence, no numbers, no metrics
2. Insight buckets must be distinct (no overlap)
3. Story claims must be in narrative language, not research language
4. Frames must prove something - if they don't, remove them
5. Each frame has ONE idea, ONE visual action, ONE emotional beat, ONE logical purpose
6. Use the specified story spine consistently
7. Organize frames in logical sequence following the story spine
8. Include supporting evidence for frames but keep frames focused

CRITICAL JSON OUTPUT REQUIREMENTS:
1. You MUST return ONLY valid JSON - nothing else
2. Do NOT include markdown code blocks (no code fences)
3. Do NOT include any explanatory text before or after the JSON
4. Do NOT include comments, notes, or descriptions
5. Start your response with { and end with }
6. The entire response must be parseable as JSON
7. If you cannot generate valid JSON, return an error object: {"error": "Unable to generate storyboard"}

EXAMPLE OF CORRECT FORMAT:
{
  "controllingInsight": "...",
  "storySpine": "problem-insight-resolution",
  "insightBuckets": [...],
  "storyClaims": [...],
  "sceneGroups": [...],
  "frames": [...],
  "remainingResearch": {...}
}

RETURN ONLY THE JSON OBJECT ABOVE - NO OTHER TEXT, NO MARKDOWN, NO EXPLANATIONS.`

    // Try multiple model names in order of preference (Gemini 2.5 models)
    const modelNames = [
      'gemini-2.5-flash',         // Primary: Fast and reliable
      'gemini-2.5-pro',           // Fallback: Best quality
      'gemini-2.5-flash-lite',   // Fallback: Lightweight
      'gemini-1.5-pro-latest',   // Fallback: Latest 1.5 Pro
      'gemini-1.5-pro',          // Fallback: Stable 1.5 Pro
      'gemini-pro',               // Fallback: General Pro
    ]
    
    console.log('Calling Gemini API for storyboard generation')
    console.log('Prompt length:', storyboardPrompt.length, 'characters')
    console.log('Report context length:', reportContext.length, 'characters')

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
              parts: [{ text: storyboardPrompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
              topP: 0.95,
              topK: 40,
              // Force JSON output for models that support it (1.5-pro, 2.0, 2.5 and later)
              ...(modelName.includes('1.5') || modelName.includes('2.0') || modelName.includes('2.5') 
                ? { responseMimeType: 'application/json' } 
                : {})
            },
            systemInstruction: {
              parts: [{ text: 'You are a world-class storyboard designer and narrative strategist. You excel at converting complex research into clear, persuasive visual narratives. You understand that storyboards must argue a point, not summarize data. Every frame must prove something. Focus on narrative clarity and emotional impact.' }]
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
        
        // If 400, also try next model (might be parameter incompatibility)
        if (response.status === 400) {
          const errorText = await response.text()
          console.log(`Model ${modelName} returned 400 (bad request), trying next model...`)
          console.log('400 error details:', errorText)
          lastError = { model: modelName, status: 400, message: errorText }
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
    
    // If no model worked, return error
    if (!response) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: `No available Gemini model found. Tried: ${modelNames.join(', ')}. Please check your API key and available models.`,
          statusCode: 404,
          details: {
            ...lastError,
            suggestion: 'Check your Gemini API key and ensure you have access to Gemini models. Visit https://ai.google.dev/models for available models.'
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
      console.error('Error details:', JSON.stringify(errorData, null, 2))
      
      // Extract actual error message from Gemini API response
      const apiErrorMessage = errorData?.error?.message || 
                              errorData?.error?.status || 
                              errorData?.message || 
                              errorText
      
      let errorMessage = 'Failed to generate storyboard. Please try again.'
      if (response.status === 400) {
        // Bad request - usually means invalid parameters or request too large
        errorMessage = `Invalid request to Gemini API: ${apiErrorMessage || 'Request format error. The prompt may be too long or contain invalid parameters.'}`
      } else if (response.status === 401) {
        errorMessage = 'Invalid Gemini API key. Please check your API key in Supabase secrets.'
      } else if (response.status === 404) {
        errorMessage = `Gemini model "${usedModel}" not found. The model may not be available in your region or with your API key. Please check available models at https://ai.google.dev/models`
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.'
      } else if (response.status >= 500) {
        errorMessage = 'Gemini API server error. Please try again later.'
      } else {
        // For other errors, use the API's error message if available
        errorMessage = apiErrorMessage || errorMessage
      }
      
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: errorMessage,
          statusCode: response.status,
          details: {
            apiError: errorData,
            model: usedModel,
            promptLength: storyboardPrompt.length
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

    const data = await response.json()
    let responseText = ''
    
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        const textParts = candidate.content.parts
          .filter((part: any) => part && part.text)
          .map((part: any) => String(part.text))
        responseText = textParts.join('\n')
      }
    }

    if (!responseText || responseText.trim().length === 0) {
      console.error('Empty response from Gemini API')
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Empty response from Gemini API. The AI may not have generated any content.',
          details: {
            rawResponse: JSON.stringify(data).substring(0, 500)
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

    if (!responseText || typeof responseText !== 'string') {
      console.error('Invalid responseText type:', typeof responseText, responseText)
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Invalid response from AI. The response format is not recognized.',
          details: {
            responseType: typeof responseText,
            hasResponse: !!responseText
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

    console.log('Raw response text length:', responseText.length)
    console.log('Response text preview (first 500 chars):', responseText.substring(0, 500))

    // Parse JSON response - handle multiple formats with improved extraction
    let jsonText = String(responseText).trim()
    
    // Remove markdown code blocks if present (handle various formats)
    jsonText = jsonText
      .replace(/^```json\s*/gm, '')
      .replace(/^```\s*/gm, '')
      .replace(/```\s*$/gm, '')
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim()
    
    // Remove any leading/trailing text that's not JSON
    // Find the first { and last } to extract the JSON object
    const firstBrace = jsonText.indexOf('{')
    const lastBrace = jsonText.lastIndexOf('}')
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1)
    } else {
      // Try to find JSON using regex as fallback
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }
    }

    // Clean up common JSON issues
    jsonText = jsonText
      // Remove any trailing commas before closing braces/brackets
      .replace(/,(\s*[}\]])/g, '$1')
      // Remove comments if any (though JSON shouldn't have them)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .trim()

    let storyboardResponse: StoryboardResponse | null = null
    try {
      storyboardResponse = JSON.parse(jsonText)
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError)
      console.error('Parse error message:', parseError?.message)
      console.error('Attempted to parse (first 1000 chars):', jsonText.substring(0, 1000))
      console.error('Full response text length:', responseText.length)
      console.error('Full response text:', responseText)
      
      // Try multiple parsing strategies
      let parsed = false
      
      // Strategy 1: Try line-based extraction to find valid JSON
      try {
        // Find the largest valid JSON object using line-by-line analysis
        if (!responseText || responseText.length === 0) {
          throw new Error('Response text is empty')
        }
        
        const lines = responseText.split('\n')
        let jsonStart = -1
        let jsonEnd = -1
        let braceCount = 0
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (jsonStart === -1 && line.includes('{')) {
            jsonStart = i
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
          } else if (jsonStart >= 0) {
            braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length
            if (braceCount === 0) {
              jsonEnd = i
              break
            }
          }
        }
        
        if (jsonStart >= 0 && jsonEnd >= jsonStart) {
          const extractedJson = lines.slice(jsonStart, jsonEnd + 1).join('\n')
          console.log('Trying line-based extraction (length:', extractedJson.length, ')')
          storyboardResponse = JSON.parse(extractedJson)
          parsed = true
          console.log('Successfully parsed after line-based extraction')
        }
      } catch (lineParseError) {
        console.log('Line-based extraction failed:', lineParseError)
      }
      
      // Strategy 2: Try to extract JSON using balanced braces
      if (!parsed && responseText && responseText.length > 0) {
        try {
          let startIdx = responseText.indexOf('{')
          let endIdx = responseText.lastIndexOf('}')
          
          if (startIdx >= 0 && endIdx > startIdx) {
            let braceBalance = 0
            let validEndIdx = -1
            
            for (let i = startIdx; i <= endIdx; i++) {
              if (responseText[i] === '{') braceBalance++
              if (responseText[i] === '}') {
                braceBalance--
                if (braceBalance === 0) {
                  validEndIdx = i
                  break
                }
              }
            }
            
            if (validEndIdx > startIdx) {
              const balancedJson = responseText.substring(startIdx, validEndIdx + 1)
              console.log('Trying balanced brace extraction (length:', balancedJson.length, ')')
              storyboardResponse = JSON.parse(balancedJson)
              parsed = true
              console.log('Successfully parsed after balanced brace extraction')
            }
          }
        } catch (balancedParseError) {
          console.log('Balanced brace extraction failed:', balancedParseError)
        }
      }
      
      // Strategy 3: Last resort - try to fix and parse
      if (!parsed && responseText && responseText.length > 0) {
        try {
          const firstBrace = responseText.indexOf('{')
          const lastBrace = responseText.lastIndexOf('}')
          
          if (firstBrace >= 0 && lastBrace > firstBrace) {
            // Remove everything before first { and after last }
            const cleanJson = responseText.substring(firstBrace, lastBrace + 1)
            // Try to fix trailing commas
            const fixedJson = cleanJson.replace(/,(\s*[}\]])/g, '$1')
            console.log('Trying final cleanup attempt (length:', fixedJson.length, ')')
            storyboardResponse = JSON.parse(fixedJson)
            parsed = true
            console.log('Successfully parsed after final cleanup')
          } else {
            console.log('Strategy 3: Could not find valid JSON boundaries')
          }
        } catch (finalParseError) {
          console.log('Final cleanup attempt failed:', finalParseError)
        }
      }
      
      if (!parsed) {
        return new Response(
          JSON.stringify({ 
            status: 'error',
            error: 'Failed to parse storyboard response from AI. The response may not be valid JSON.',
            details: {
              parseError: parseError?.message,
              responsePreview: responseText.substring(0, 500),
              responseLength: responseText.length,
              attemptedJson: jsonText.substring(0, 500),
              suggestion: 'The AI may have returned text instead of JSON. Check function logs for the full response. Try regenerating with a simpler research report or check if the Gemini API key has proper access.'
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

    // Ensure storyboardResponse is not null
    if (!storyboardResponse) {
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Failed to parse storyboard response. The response structure is invalid.',
          details: {
            responsePreview: responseText.substring(0, 500),
            responseLength: responseText.length
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

    // Validate response structure (storyboardResponse is guaranteed to be non-null here)
    if (!storyboardResponse!.controllingInsight) {
      console.error('Validation error: controlling insight missing')
      console.error('Response structure:', Object.keys(storyboardResponse!))
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Invalid response: controlling insight missing. The AI may not have followed the format correctly.',
          details: { responseKeys: Object.keys(storyboardResponse) }
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

    if (!storyboardResponse!.insightBuckets || !Array.isArray(storyboardResponse!.insightBuckets)) {
      console.error('Validation error: insight buckets missing or not array')
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Invalid response: insight buckets missing or invalid format.',
          details: { hasBuckets: !!storyboardResponse!.insightBuckets, isArray: Array.isArray(storyboardResponse!.insightBuckets) }
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

    if (!storyboardResponse!.frames || !Array.isArray(storyboardResponse!.frames)) {
      console.error('Validation error: frames missing or not array')
      return new Response(
        JSON.stringify({ 
          status: 'error',
          error: 'Invalid response: frames missing or invalid format.',
          details: { hasFrames: !!storyboardResponse!.frames, isArray: Array.isArray(storyboardResponse!.frames) }
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

    // Ensure all frames have required fields and are properly numbered
    storyboardResponse!.frames = storyboardResponse!.frames
      .map((frame, idx) => ({
        ...frame,
        frameNumber: frame.frameNumber || idx + 1,
        idea: frame.idea || `Frame ${idx + 1}`,
        visualAction: frame.visualAction || '',
        emotionalBeat: frame.emotionalBeat || '',
        logicalPurpose: frame.logicalPurpose || '',
        supportingEvidence: frame.supportingEvidence || []
      }))
      .sort((a, b) => a.frameNumber - b.frameNumber)

    // Ensure scene groups are properly linked
    if (storyboardResponse!.sceneGroups) {
      storyboardResponse!.sceneGroups = storyboardResponse!.sceneGroups.map(sg => ({
        ...sg,
        description: sg.description || '',
        situation: sg.situation || ''
      }))
    }

    // Ensure story claims are properly formatted
    if (storyboardResponse!.storyClaims) {
      storyboardResponse!.storyClaims = storyboardResponse!.storyClaims.map(sc => ({
        ...sc,
        claim: sc.claim || '',
        narrativeLanguage: sc.narrativeLanguage || sc.claim
      }))
    }

    console.log('Storyboard generated successfully:', {
      controllingInsight: storyboardResponse!.controllingInsight.substring(0, 50) + '...',
      buckets: storyboardResponse!.insightBuckets.length,
      claims: storyboardResponse!.storyClaims?.length || 0,
      frames: storyboardResponse!.frames.length
    })

    return new Response(
      JSON.stringify({
        status: 'success',
        storyboard: storyboardResponse!
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
