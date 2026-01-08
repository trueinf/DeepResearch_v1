// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

interface IngestionRequest {
  files: Array<{
    name: string
    content: string // Text content or base64
    type: string // MIME type
  }>
  researchTopic?: string
  presentationStyle?: 'executive' | 'technical' | 'visual' | 'academic'
}

interface StructuredContent {
  summary: string
  keyPoints: string[]
  dataPoints: Array<{ label: string; value: string; context?: string }>
  tables: Array<{ 
    title?: string
    headers: string[]
    rows: string[][]
    description?: string
  }>
  insights: string[]
  quotes: Array<{ text: string; author?: string; page?: number }>
  timeline?: Array<{ date: string; event: string }>
  metadata: {
    documentType: string
    pageCount?: number
    wordCount: number
    extractedAt: string
    keyTopics: string[]
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
    const { files, researchTopic, presentationStyle = 'executive' } = await req.json() as IngestionRequest

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Files are required' }),
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

    // Combine all file contents
    let combinedContent = ''
    const fileMetadata = []

    for (const file of files) {
      // Extract text content (assuming it's already extracted text, not base64)
      const content = file.content
      combinedContent += `\n\n--- DOCUMENT: ${file.name} (${file.type}) ---\n\n${content}\n\n`
      
      fileMetadata.push({
        name: file.name,
        type: file.type,
        wordCount: content.split(/\s+/).length
      })
    }

    const totalWordCount = fileMetadata.reduce((sum, f) => sum + f.wordCount, 0)

    // Use Gemini to extract structured content
    const ingestionPrompt = `You are a Document Ingestion Agent specialized in extracting structured, presentation-ready content from documents.

TASK: Analyze the following document(s) and extract structured content optimized for PowerPoint slide generation.

${researchTopic ? `RESEARCH TOPIC: ${researchTopic}\n` : ''}
PRESENTATION STYLE: ${presentationStyle}

DOCUMENTS TO ANALYZE:
${combinedContent.substring(0, 100000)} ${combinedContent.length > 100000 ? '\n\n[Content truncated for processing]' : ''}

EXTRACTION REQUIREMENTS:

1. SUMMARY (2-3 sentences):
   - High-level overview of document content
   - Main purpose and key message

2. KEY POINTS (5-10 bullet points):
   - Most important insights
   - Actionable takeaways
   - Critical information
   - Each point should be 10-20 words

3. DATA POINTS (extract all numbers, metrics, statistics):
   - Format: { "label": "Metric Name", "value": "Number/Percentage", "context": "Brief context" }
   - Include: revenue, growth rates, percentages, counts, dates, etc.
   - Example: { "label": "Revenue Growth", "value": "15%", "context": "Year-over-year" }

4. TABLES (identify and extract tabular data):
   - Format: { "title": "Table Title", "headers": ["Col1", "Col2"], "rows": [["val1", "val2"]], "description": "What this table shows" }
   - Extract all structured data tables
   - Include headers and all rows

5. INSIGHTS (3-5 strategic insights):
   - Deeper analysis points
   - Implications
   - Strategic recommendations
   - Each insight should be 1-2 sentences

6. QUOTES (extract notable quotes if any):
   - Format: { "text": "Quote text", "author": "Author name if available", "page": "Page number if available" }
   - Only include significant, impactful quotes

7. TIMELINE (if dates/events are present):
   - Format: { "date": "YYYY-MM-DD or Year", "event": "Event description" }
   - Extract chronological events

8. METADATA:
   - keyTopics: Main topics/themes (3-5 topics)

OUTPUT FORMAT (JSON only, no markdown):
{
  "summary": "2-3 sentence summary",
  "keyPoints": [
    "Key point 1 (10-20 words)",
    "Key point 2 (10-20 words)",
    ...
  ],
  "dataPoints": [
    {"label": "Metric Name", "value": "Value", "context": "Context"},
    ...
  ],
  "tables": [
    {"title": "Table Title", "headers": ["H1", "H2"], "rows": [["v1", "v2"]], "description": "Description"},
    ...
  ],
  "insights": [
    "Strategic insight 1 (1-2 sentences)",
    ...
  ],
  "quotes": [
    {"text": "Quote", "author": "Author", "page": "Page"},
    ...
  ],
  "timeline": [
    {"date": "2024", "event": "Event description"},
    ...
  ],
  "metadata": {
    "keyTopics": ["Topic 1", "Topic 2", ...]
  }
}

CRITICAL: 
- Extract REAL data from documents, not generic placeholders
- All numbers and metrics must be from the actual document content
- Tables must reflect actual table structure from documents
- Be precise and accurate
- Focus on content that would be valuable in a presentation`

    // Call Gemini API
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest', 'gemini-flash-latest']
    let response: Response | null = null
    let lastError = null

    for (const model of modelsToTry) {
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: ingestionPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
              topP: 0.95,
              topK: 40,
            },
          }),
        })

        if (response.ok) {
          break
        }

        if (response.status === 404) {
          console.log(`Model ${model} not found, trying next...`)
          continue
        }

        lastError = await response.text()
      } catch (error) {
        console.error(`Error with model ${model}:`, error)
        continue
      }
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process documents',
          details: lastError || 'No response from API'
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

    const responseData = await response.json()
    let extractedText = ''

    if (responseData.candidates && responseData.candidates[0]?.content?.parts) {
      extractedText = responseData.candidates[0].content.parts
        .filter((part: any) => part.text)
        .map((part: any) => part.text)
        .join('\n\n')
    }

    // Parse JSON from response
    let structuredContent: StructuredContent
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = extractedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       extractedText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, extractedText]
      
      const jsonText = jsonMatch[1] || extractedText
      structuredContent = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse structured content:', parseError)
      console.error('Response text:', extractedText)
      
      // Fallback: create basic structure
      structuredContent = {
        summary: extractedText.substring(0, 500) || 'Document processed but content extraction failed.',
        keyPoints: extractedText.split('\n').filter(line => line.trim().length > 10).slice(0, 10),
        dataPoints: [],
        tables: [],
        insights: [],
        quotes: [],
        metadata: {
          documentType: files[0]?.type || 'unknown',
          wordCount: totalWordCount,
          extractedAt: new Date().toISOString(),
          keyTopics: []
        }
      }
    }

    // Add metadata
    structuredContent.metadata = {
      ...structuredContent.metadata,
      documentType: files[0]?.type || 'unknown',
      wordCount: totalWordCount,
      extractedAt: new Date().toISOString(),
      pageCount: fileMetadata.length
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        content: structuredContent
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )

  } catch (error: any) {
    console.error('Ingestion agent error:', error)
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

