// Trend Analysis using Graph Analytics (Phase 7)
// POST /functions/v1/analyze-trends
// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const NEO4J_URI = Deno.env.get('NEO4J_URI')
// @ts-ignore - Deno runtime
const NEO4J_USER = Deno.env.get('NEO4J_USER')
// @ts-ignore - Deno runtime
const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

interface TrendAnalysis {
  topic: string
  currentFrequency: number
  previousFrequency: number
  frequencyChange: number
  trendState: 'rising' | 'falling' | 'emerging' | 'stable'
  velocity: number // Rate of change
  prediction?: 'continue_rising' | 'continue_falling' | 'stabilize' | 'emerge'
}

interface AnalyzeTrendsRequest {
  researchId?: string
  timeWindow?: number // Days to look back
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

// Analyze trends over time
async function analyzeTrends(researchId?: string, timeWindow: number = 30): Promise<TrendAnalysis[]> {
  // If Neo4j is not configured, return empty array
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.warn('Neo4j not configured, returning empty trends')
    return []
  }

  try {
    // Query to get frequency over time
    const query = researchId
      ? {
          statement: `
            MATCH (t:Trend)
            WHERE t.researchId = $researchId
            WITH t, t.frequency as currentFreq, t.timestamp as timestamp
            ORDER BY t.timestamp DESC
            WITH t.name as topic, 
                 collect(t.frequency)[0] as currentFrequency,
                 collect(t.frequency)[1] as previousFrequency,
                 collect(t.timestamp)[0] as latestTimestamp,
                 collect(t.sentiment)[0] as sentiment
            WHERE currentFrequency IS NOT NULL
            RETURN topic, 
                   currentFrequency, 
                   COALESCE(previousFrequency, 0) as previousFrequency,
                   currentFrequency - COALESCE(previousFrequency, 0) as frequencyChange,
                   sentiment,
                   latestTimestamp
            ORDER BY currentFrequency DESC
          `,
          parameters: { researchId }
        }
      : {
          statement: `
            MATCH (t:Trend)
            WITH t.name as topic, 
                 t.frequency as currentFrequency,
                 t.timestamp as timestamp,
                 t.sentiment as sentiment
            ORDER BY topic, timestamp DESC
            WITH topic, 
                 collect(currentFrequency)[0] as currentFreq,
                 collect(currentFrequency)[1] as previousFreq,
                 collect(sentiment)[0] as sent,
                 collect(timestamp)[0] as latestTimestamp
            WHERE currentFreq IS NOT NULL
            RETURN topic, 
                   currentFreq as currentFrequency, 
                   COALESCE(previousFreq, 0) as previousFrequency,
                   currentFreq - COALESCE(previousFreq, 0) as frequencyChange,
                   sent as sentiment,
                   latestTimestamp
            ORDER BY currentFrequency DESC
          `,
          parameters: {}
        }

      const result = await executeNeo4jQuery([query])
    
    if (!result.results || result.results.length === 0) {
      return []
    }

    const rows = result.results[0].data || []
    
    return rows.map((row: any) => {
    const topic = row.row[0]
    const currentFrequency = row.row[1] || 0
    const previousFrequency = row.row[2] || 0
    const frequencyChange = row.row[3] || 0
    const sentiment = row.row[4] || 'stable'
    const latestTimestamp = row.row[5]

    // Calculate velocity (rate of change)
    const velocity = previousFrequency > 0 
      ? ((currentFrequency - previousFrequency) / previousFrequency) * 100
      : currentFrequency > 0 ? 100 : 0

    // Determine trend state
    let trendState: 'rising' | 'falling' | 'emerging' | 'stable' = 'stable'
    
    if (previousFrequency === 0 && currentFrequency > 0) {
      trendState = 'emerging'
    } else if (frequencyChange > 0 && velocity > 20) {
      trendState = 'rising'
    } else if (frequencyChange < 0 && velocity < -20) {
      trendState = 'falling'
    } else {
      trendState = sentiment as 'rising' | 'falling' | 'emerging' | 'stable'
    }

    // Predict future state
    let prediction: 'continue_rising' | 'continue_falling' | 'stabilize' | 'emerge' = 'stabilize'
    if (trendState === 'rising' && velocity > 30) {
      prediction = 'continue_rising'
    } else if (trendState === 'falling' && velocity < -30) {
      prediction = 'continue_falling'
    } else if (trendState === 'emerging') {
      prediction = 'emerge'
    }

    return {
      topic,
      currentFrequency,
      previousFrequency,
      frequencyChange,
      trendState,
      velocity,
      prediction
    }
    })
  } catch (error: any) {
    console.error('Error analyzing trends:', error)
    return []
  }
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
    const { researchId, timeWindow = 30 }: AnalyzeTrendsRequest = await req.json()

    // If Neo4j is not configured, return empty trends (not an error)
    if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
      return new Response(
        JSON.stringify({
          success: true,
          trends: [],
          stats: {
            total: 0,
            byState: {},
            rising: 0,
            falling: 0,
            emerging: 0,
            stable: 0
          },
          trendsByState: {},
          message: 'Neo4j not configured. Trend analysis requires Neo4j.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Analyze trends
    console.log('Analyzing trends...')
    const trends = await analyzeTrends(researchId, timeWindow)

    // Group by trend state
    const trendsByState = trends.reduce((acc, trend) => {
      const state = trend.trendState
      if (!acc[state]) {
        acc[state] = []
      }
      acc[state].push(trend)
      return acc
    }, {} as Record<string, TrendAnalysis[]>)

    return new Response(
      JSON.stringify({
        success: true,
        trends,
        stats: {
          total: trends.length,
          byState: Object.keys(trendsByState).reduce((acc, state) => {
            acc[state] = trendsByState[state].length
            return acc
          }, {} as Record<string, number>),
          rising: trends.filter(t => t.trendState === 'rising').length,
          falling: trends.filter(t => t.trendState === 'falling').length,
          emerging: trends.filter(t => t.trendState === 'emerging').length,
          stable: trends.filter(t => t.trendState === 'stable').length
        },
        trendsByState
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
    console.error('Error in analyze-trends function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to analyze trends',
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

