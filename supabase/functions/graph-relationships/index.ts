// Relationship Extraction and Neo4j Edge Creation
// POST /functions/v1/graph-relationships
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

interface Relationship {
  from: string
  to: string
  type: string
  description?: string
  confidence?: number
  evidence?: string
}

interface ExtractRelationshipsRequest {
  text: string
  entities?: Entity[] // Optional: provide entities if already extracted
  researchId?: string
  createEdges?: boolean // Whether to create edges in Neo4j (default: true)
}

interface Neo4jStatement {
  statement: string
  parameters?: Record<string, any>
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

// Helper: Map relationship type to Neo4j schema
function mapRelationshipType(relType: string): string {
  const mapping: Record<string, string> = {
    'causes': 'CAUSES',
    'influences': 'INFLUENCES',
    'depends_on': 'PART_OF',
    'contradicts': 'CONTRADICTS',
    'supports': 'SUPPORTS',
    'part_of': 'PART_OF',
    'relates_to': 'RELATES_TO',
    'enables': 'RELATES_TO',
    'uses': 'RELATES_TO',
    'regulates': 'INFLUENCES',
    'accelerates': 'INFLUENCES',
    'reduces': 'INFLUENCES',
    'increases': 'INFLUENCES',
    'resists': 'CONTRADICTS',
  }
  return mapping[relType.toLowerCase()] || 'RELATES_TO'
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
async function executeNeo4jQuery(statements: Neo4jStatement[]): Promise<void> {
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

// Extract relationships using Gemini
async function extractRelationships(text: string, entities?: Entity[]): Promise<Relationship[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY secret not configured')
  }

  let entityContext = ''
  if (entities && entities.length > 0) {
    entityContext = `\n\nAvailable Entities (use exact names):
${entities.map(e => `- ${e.name}${e.type ? ` (${e.type})` : ''}`).join('\n')}

IMPORTANT: Use the exact entity names from the list above.`
  }

  const prompt = `You are an expert relationship extraction system. Extract ALL relationships between entities from the following research content.

Relationship Types to Extract:
- causes: A causes B (direct causation)
- influences: A influences B (general influence)
- depends_on: A depends on B (dependency)
- contradicts: A contradicts B (opposition)
- supports: A supports B (agreement/support)
- part_of: A is part of B (containment/hierarchy)

${entityContext}

For each relationship, provide:
- from: Source entity name (exact match from text or entity list)
- to: Target entity name (exact match from text or entity list)
- type: One of causes, influences, depends_on, contradicts, supports, part_of
- description: Brief description of the relationship (optional)
- confidence: Confidence score 0-1 (optional, default 0.8)
- evidence: Evidence text from the content (optional)

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "from": "Battery Prices",
    "to": "EV Adoption",
    "type": "influences",
    "description": "Lower battery prices influence EV adoption rates",
    "confidence": 0.9,
    "evidence": "As battery costs decrease, more consumers adopt electric vehicles"
  },
  {
    "from": "Charging Infrastructure",
    "to": "EV Adoption",
    "type": "depends_on",
    "description": "EV adoption depends on charging infrastructure",
    "confidence": 0.85,
    "evidence": "Widespread EV adoption requires extensive charging networks"
  },
  {
    "from": "Range Anxiety",
    "to": "EV Adoption",
    "type": "contradicts",
    "description": "Range anxiety contradicts EV adoption",
    "confidence": 0.8,
    "evidence": "Range anxiety is a barrier to EV adoption"
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

    const relationships = JSON.parse(content) as Relationship[]
    
    return relationships
      .filter(r => r.from && r.to && r.type)
      .map(r => ({
        from: r.from.trim(),
        to: r.to.trim(),
        type: r.type.toLowerCase(),
        description: r.description?.trim() || '',
        confidence: r.confidence || 0.8,
        evidence: r.evidence?.trim() || ''
      }))
  } catch (error) {
    console.error('Error extracting relationships:', error)
    throw error
  }
}

// Create edges in Neo4j
async function createEdgesInNeo4j(relationships: Relationship[], researchId?: string): Promise<{ created: number; errors: number }> {
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.warn('Neo4j not configured, skipping edge creation')
    return { created: 0, errors: 0 }
  }

  let created = 0
  let errors = 0

  try {
    // Create statements for each relationship
    const statements = relationships.map(rel => {
      const relType = mapRelationshipType(rel.type)
      const fromId = researchId 
        ? `${researchId}_${rel.from.toLowerCase().replace(/\s+/g, '_')}`
        : rel.from.toLowerCase().replace(/\s+/g, '_')
      const toId = researchId 
        ? `${researchId}_${rel.to.toLowerCase().replace(/\s+/g, '_')}`
        : rel.to.toLowerCase().replace(/\s+/g, '_')

      // Try to match by id first (if researchId provided), then fallback to name
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
            MERGE (a)-[r:${relType}]->(b)
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
            MERGE (a)-[r:${relType}]->(b)
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

    // Execute in batches with delay between batches
    const batchSize = 10
    const delayBetweenBatches = 500
    
    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize)
      try {
        await executeNeo4jQuery(batch)
        created += batch.length
        
        // Delay before next batch (except for last batch)
        if (i + batchSize < statements.length) {
          await delay(delayBetweenBatches)
        }
      } catch (error) {
        console.error(`Error creating batch ${i / batchSize + 1}:`, error)
        errors += batch.length
      }
    }

    console.log(`Created ${created} edges in Neo4j, ${errors} errors`)
  } catch (error) {
    console.error('Error creating edges in Neo4j:', error)
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
    const { text, entities, researchId, createEdges = true }: ExtractRelationshipsRequest = await req.json()

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

    // Step 1: Extract relationships
    console.log('Extracting relationships from text...')
    const relationships = await extractRelationships(text, entities)

    // Step 2: Create edges in Neo4j (if requested)
    let neo4jResult = { created: 0, errors: 0 }
    if (createEdges) {
      console.log('Creating edges in Neo4j...')
      neo4jResult = await createEdgesInNeo4j(relationships, researchId)
    }

    // Step 3: Group relationships by type for response
    const relationshipsByType = relationships.reduce((acc, rel) => {
      const type = rel.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(rel)
      return acc
    }, {} as Record<string, Relationship[]>)

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
    console.error('Error in graph-relationships function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to extract relationships',
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

