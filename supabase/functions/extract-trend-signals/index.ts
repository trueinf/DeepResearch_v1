// Trend Signal Extraction (Phase 7)
// POST /functions/v1/extract-trend-signals
// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// @ts-ignore - Deno runtime
const NEO4J_URI = Deno.env.get('NEO4J_URI')
// @ts-ignore - Deno runtime
const NEO4J_USER = Deno.env.get('NEO4J_USER')
// @ts-ignore - Deno runtime
const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

interface TrendSignal {
  topic: string
  timestamp?: string
  date?: string
  frequency?: number
  sentiment?: 'rising' | 'falling' | 'emerging' | 'stable'
  evidence?: string
  mentions?: number
  sources?: string[]
}

interface ExtractTrendRequest {
  text: string
  sources?: Array<{ url: string; date?: string; title?: string }>
  researchId?: string
  createNodes?: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper: Convert Neo4j URI to HTTP endpoint
function convertBoltToHttp(uri: string): string {
  if (uri.startsWith('neo4j+s://')) {
    const match = uri.match(/neo4j\+s:\/\/([^:]+)(?::\d+)?/)
    if (match) {
      return `https://${match[1]}`
    }
    return uri.replace('neo4j+s://', 'https://')
  } else if (uri.startsWith('neo4j://')) {
    const match = uri.match(/neo4j:\/\/([^:]+):(\d+)/)
    if (match) {
      return `http://${match[1]}:7474`
    }
    return uri.replace('neo4j://', 'http://').replace(':7687', ':7474')
  }
  return uri
}

// Helper: Execute Neo4j query
async function executeNeo4jQuery(statements: Array<{ statement: string; parameters?: Record<string, any> }>): Promise<any> {
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    throw new Error('Neo4j credentials not configured')
  }

  const baseUrl = convertBoltToHttp(NEO4J_URI)
  const authHeader = `Basic ${btoa(`${NEO4J_USER}:${NEO4J_PASSWORD}`)}`
  const url = `${baseUrl}/db/data/transaction/commit`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({ statements }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Neo4j request failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data.errors && data.errors.length > 0) {
    throw new Error(`Neo4j query error: ${data.errors.map((e: any) => e.message).join(', ')}`)
  }

  return data
}

// Extract trend signals using Gemini
async function extractTrendSignals(text: string, sources?: Array<{ url: string; date?: string; title?: string }>): Promise<TrendSignal[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY secret not configured')
  }

  let sourceContext = ''
  if (sources && sources.length > 0) {
    const dates = sources.map(s => s.date).filter(Boolean)
    sourceContext = `\n\nSource Dates Available:
${dates.map((d, i) => `- Source ${i + 1}: ${d}`).join('\n')}

Use these dates to identify temporal patterns and trends.`
  }

  const prompt = `You are an expert trend analysis system. Extract trend signals, timestamps, and temporal patterns from the following research content.

For each trend or topic mentioned, identify:
1. **Topic Name**: The trend, technology, concept, or topic
2. **Timestamp/Date**: When it was mentioned or when it occurred (extract from text or source dates)
3. **Frequency**: How often it's mentioned (count mentions)
4. **Trend State**: 
   - "rising": Increasing mentions, growing interest, upward trajectory
   - "falling": Decreasing mentions, declining interest, downward trajectory
   - "emerging": New topic, recent appearance, early stage
   - "stable": Consistent mentions, steady state, no significant change
5. **Evidence**: Text evidence showing the trend state
6. **Mentions**: Number of times mentioned in the text

Look for temporal indicators:
- "increasing", "growing", "rising", "surge", "boom" → rising
- "decreasing", "declining", "falling", "drop", "decline" → falling
- "new", "emerging", "recent", "latest", "novel" → emerging
- "stable", "consistent", "steady", "maintained" → stable

${sourceContext}

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "topic": "Electric Vehicle Adoption",
    "timestamp": "2024-01-15",
    "date": "2024-01-15",
    "frequency": 5,
    "sentiment": "rising",
    "evidence": "EV adoption has been increasing steadily over the past year",
    "mentions": 5,
    "sources": ["source1", "source2"]
  },
  {
    "topic": "Battery Technology",
    "timestamp": "2024-02-01",
    "date": "2024-02-01",
    "frequency": 8,
    "sentiment": "rising",
    "evidence": "Battery technology improvements are accelerating",
    "mentions": 8,
    "sources": ["source1", "source3"]
  },
  {
    "topic": "Range Anxiety",
    "timestamp": "2024-01-20",
    "date": "2024-01-20",
    "frequency": 3,
    "sentiment": "falling",
    "evidence": "Range anxiety concerns are decreasing as battery technology improves",
    "mentions": 3,
    "sources": ["source2"]
  },
  {
    "topic": "Solid State Batteries",
    "timestamp": "2024-03-01",
    "date": "2024-03-01",
    "frequency": 2,
    "sentiment": "emerging",
    "evidence": "Solid state batteries are a new emerging technology",
    "mentions": 2,
    "sources": ["source3"]
  }
]

Research Content:
${text.substring(0, 50000)}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          topP: 0.95,
          topK: 40,
          responseMimeType: 'application/json',
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!content) {
      throw new Error('No content in Gemini response')
    }

    const signals = JSON.parse(content) as TrendSignal[]
    
    return signals
      .filter(s => s.topic)
      .map(s => ({
        topic: s.topic.trim(),
        timestamp: s.timestamp || s.date || new Date().toISOString().split('T')[0],
        date: s.date || s.timestamp || new Date().toISOString().split('T')[0],
        frequency: s.frequency || s.mentions || 1,
        sentiment: s.sentiment || 'stable',
        evidence: s.evidence?.trim() || '',
        mentions: s.mentions || s.frequency || 1,
        sources: s.sources || []
      }))
  } catch (error) {
    console.error('Error extracting trend signals:', error)
    throw error
  }
}

// Store trend signals in Neo4j
async function storeTrendSignalsInNeo4j(signals: TrendSignal[], researchId?: string): Promise<{ created: number; errors: number }> {
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.warn('Neo4j not configured, skipping trend storage')
    return { created: 0, errors: 0 }
  }

  let created = 0
  let errors = 0

  try {
    const statements = signals.map(signal => {
      const nodeId = researchId 
        ? `${researchId}_${signal.topic.toLowerCase().replace(/\s+/g, '_')}`
        : signal.topic.toLowerCase().replace(/\s+/g, '_')

      return {
        statement: `
          MERGE (t:Trend {id: $nodeId${researchId ? ', researchId: $researchId' : ''}})
          SET t.name = $topic,
              t.timestamp = $timestamp,
              t.date = $date,
              t.frequency = $frequency,
              t.mentions = $mentions,
              t.sentiment = $sentiment,
              t.evidence = $evidence,
              t.updatedAt = datetime()
          ON CREATE SET t.createdAt = datetime()
          WITH t
          MATCH (n)
          WHERE (n.name = $topic OR n.id = $nodeId)
            ${researchId ? 'AND n.researchId = $researchId' : ''}
          MERGE (n)-[:HAS_TREND]->(t)
          RETURN t
        `,
        parameters: {
          nodeId,
          topic: signal.topic,
          timestamp: signal.timestamp,
          date: signal.date,
          frequency: signal.frequency || signal.mentions || 1,
          mentions: signal.mentions || signal.frequency || 1,
          sentiment: signal.sentiment,
          evidence: signal.evidence || '',
          ...(researchId && { researchId })
        }
      }
    })

    // Execute in batches
    const batchSize = 10
    const delayBetweenBatches = 500
    
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize)
      try {
        await executeNeo4jQuery(batch)
        created += batch.length
        if (i + batchSize < statements.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
        }
      } catch (error) {
        console.error(`Error storing batch ${i / batchSize + 1}:`, error)
        errors += batch.length
      }
    }

    console.log(`Stored ${created} trend signals in Neo4j, ${errors} errors`)
  } catch (error) {
    console.error('Error storing trend signals in Neo4j:', error)
    errors += signals.length
  }

  return { created, errors }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  try {
    const { text, sources, researchId, createNodes = true }: ExtractTrendRequest = await req.json()

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text content is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY secret not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Step 1: Extract trend signals
    console.log('Extracting trend signals from text...')
    const signals = await extractTrendSignals(text, sources)

    // Step 2: Store in Neo4j (if requested)
    let neo4jResult = { created: 0, errors: 0 }
    if (createNodes) {
      console.log('Storing trend signals in Neo4j...')
      neo4jResult = await storeTrendSignalsInNeo4j(signals, researchId)
    }

    // Step 3: Group by sentiment
    const signalsBySentiment = signals.reduce((acc, signal) => {
      const sentiment = signal.sentiment || 'stable'
      if (!acc[sentiment]) {
        acc[sentiment] = []
      }
      acc[sentiment].push(signal)
      return acc
    }, {} as Record<string, TrendSignal[]>)

    return new Response(
      JSON.stringify({
        success: true,
        signals,
        stats: {
          total: signals.length,
          bySentiment: Object.keys(signalsBySentiment).reduce((acc, sentiment) => {
            acc[sentiment] = signalsBySentiment[sentiment].length
            return acc
          }, {} as Record<string, number>),
          neo4j: neo4jResult
        },
        signalsBySentiment
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
    console.error('Error in extract-trend-signals function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to extract trend signals',
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

