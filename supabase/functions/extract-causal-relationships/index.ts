// Causal Relationship Extraction (Phase 6)
// POST /functions/v1/extract-causal-relationships
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

interface Entity {
  name: string
  type?: string
}

interface CausalRelationship {
  from: string
  to: string
  type: 'causes' | 'leads_to' | 'triggers'
  description?: string
  confidence?: number
  evidence?: string
}

interface ExtractCausalRequest {
  text: string
  entities?: Entity[]
  researchId?: string
  createEdges?: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper: Delay function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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
async function executeNeo4jQuery(statements: Array<{ statement: string; parameters?: Record<string, any> }>): Promise<void> {
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
}

// Extract causal relationships using Gemini
async function extractCausalRelationships(text: string, entities?: Entity[]): Promise<CausalRelationship[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY secret not configured')
  }

  let entityContext = ''
  if (entities && entities.length > 0) {
    entityContext = `\n\nAvailable Entities (use exact names):
${entities.map(e => `- ${e.name}${e.type ? ` (${e.type})` : ''}`).join('\n')}

IMPORTANT: Use the exact entity names from the list above.`
  }

  const prompt = `You are an expert causal relationship extraction system. Extract ONLY causal relationships (cause → effect chains) from the following research content.

Focus on CAUSAL relationships only:
- causes: A directly causes B (A causes B)
- leads_to: A leads to B (A leads to B, A results in B)
- triggers: A triggers B (A triggers B, A initiates B)

Look for patterns like:
- "A causes B"
- "A leads to B"
- "A results in B"
- "A triggers B"
- "A brings about B"
- "A gives rise to B"
- "A creates B"
- "A produces B"
- "Due to A, B happens"
- "Because of A, B occurs"

${entityContext}

For each causal relationship, provide:
- from: Source entity (the cause)
- to: Target entity (the effect)
- type: One of causes, leads_to, triggers
- description: Brief description of the causal chain
- confidence: Confidence score 0-1 (optional, default 0.8)
- evidence: Evidence text from the content showing the causal relationship

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "from": "Battery Cost Reduction",
    "to": "EV Price Decrease",
    "type": "causes",
    "description": "Battery cost reduction directly causes EV price decrease",
    "confidence": 0.95,
    "evidence": "As battery costs decrease, EV prices follow suit"
  },
  {
    "from": "EV Price Decrease",
    "to": "Increased EV Adoption",
    "type": "leads_to",
    "description": "Lower EV prices lead to increased adoption",
    "confidence": 0.9,
    "evidence": "Lower prices make EVs more accessible, leading to higher adoption rates"
  },
  {
    "from": "Increased EV Adoption",
    "to": "Charging Infrastructure Demand",
    "type": "triggers",
    "description": "Higher EV adoption triggers demand for charging infrastructure",
    "confidence": 0.85,
    "evidence": "Growing EV fleet creates urgent need for charging stations"
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
          temperature: 0.2, // Lower temperature for more focused causal extraction
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

    const relationships = JSON.parse(content) as CausalRelationship[]
    
    return relationships
      .filter(r => r.from && r.to && r.type)
      .map(r => ({
        from: r.from.trim(),
        to: r.to.trim(),
        type: r.type,
        description: r.description?.trim() || '',
        confidence: r.confidence || 0.8,
        evidence: r.evidence?.trim() || ''
      }))
  } catch (error) {
    console.error('Error extracting causal relationships:', error)
    throw error
  }
}

// Create CAUSES edges in Neo4j
async function createCausalEdgesInNeo4j(relationships: CausalRelationship[], researchId?: string): Promise<{ created: number; errors: number }> {
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.warn('Neo4j not configured, skipping edge creation')
    return { created: 0, errors: 0 }
  }

  let created = 0
  let errors = 0

  try {
    const statements = relationships.map(rel => {
      const fromId = researchId 
        ? `${researchId}_${rel.from.toLowerCase().replace(/\s+/g, '_')}`
        : null
      const toId = researchId 
        ? `${researchId}_${rel.to.toLowerCase().replace(/\s+/g, '_')}`
        : null

      return {
        statement: researchId && fromId && toId
          ? `
            MATCH (a {id: $fromId, researchId: $researchId})
            MATCH (b {id: $toId, researchId: $researchId})
            MERGE (a)-[r:CAUSES]->(b)
            SET r.description = $description,
                r.confidence = $confidence,
                r.evidence = $evidence,
                r.originalType = $originalType,
                r.researchId = $researchId,
                r.updatedAt = datetime()
            ON CREATE SET r.createdAt = datetime()
            RETURN r
          `
          : `
            MATCH (a {name: $fromName})
            MATCH (b {name: $toName})
            MERGE (a)-[r:CAUSES]->(b)
            SET r.description = $description,
                r.confidence = $confidence,
                r.evidence = $evidence,
                r.originalType = $originalType,
                r.updatedAt = datetime()
            ON CREATE SET r.createdAt = datetime()
            RETURN r
          `,
        parameters: researchId && fromId && toId
          ? {
              fromId,
              toId,
              researchId,
              description: rel.description || '',
              confidence: rel.confidence || 0.8,
              evidence: rel.evidence || '',
              originalType: rel.type
            }
          : {
              fromName: rel.from,
              toName: rel.to,
              description: rel.description || '',
              confidence: rel.confidence || 0.8,
              evidence: rel.evidence || '',
              originalType: rel.type
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
          await delay(delayBetweenBatches)
        }
      } catch (error) {
        console.error(`Error creating batch ${i / batchSize + 1}:`, error)
        errors += batch.length
      }
    }

    console.log(`Created ${created} causal edges in Neo4j, ${errors} errors`)
  } catch (error) {
    console.error('Error creating causal edges in Neo4j:', error)
    errors += relationships.length
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
    const { text, entities, researchId, createEdges = true }: ExtractCausalRequest = await req.json()

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

    // Step 1: Extract causal relationships
    console.log('Extracting causal relationships from text...')
    const relationships = await extractCausalRelationships(text, entities)

    // Step 2: Create CAUSES edges in Neo4j (if requested)
    let neo4jResult = { created: 0, errors: 0 }
    if (createEdges) {
      console.log('Creating CAUSES edges in Neo4j...')
      neo4jResult = await createCausalEdgesInNeo4j(relationships, researchId)
    }

    // Step 3: Group by type
    const relationshipsByType = relationships.reduce((acc, rel) => {
      const type = rel.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(rel)
      return acc
    }, {} as Record<string, CausalRelationship[]>)

    return new Response(
      JSON.stringify({
        success: true,
        relationships,
        stats: {
          total: relationships.length,
          byType: Object.keys(relationshipsByType).reduce((acc, type) => {
            acc[type] = relationshipsByType[type].length
            return acc
          }, {} as Record<string, number>),
          neo4j: neo4jResult
        },
        relationshipsByType
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
    console.error('Error in extract-causal-relationships function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to extract causal relationships',
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

