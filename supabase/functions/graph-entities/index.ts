// Entity Extraction and Neo4j Node Creation
// POST /functions/v1/graph-entities
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
  type: string
  name: string
  description?: string
  confidence?: number
  citations?: number[]
}

interface ExtractEntitiesRequest {
  text: string
  researchId?: string
  createNodes?: boolean
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

// Helper: Map entity type to Neo4j node type
function mapEntityTypeToNodeType(entityType: string): string {
  const mapping: Record<string, string> = {
    'Person': 'Person',
    'Organization': 'Organization',
    'Technology': 'Concept',
    'Concept': 'Concept',
    'Event': 'Trend',
    'Trend': 'Trend',
    'Risk': 'Problem',
    'Problem': 'Problem',
    'Benefit': 'Solution',
    'Solution': 'Solution',
    'Product': 'Concept',
    'Location': 'Concept',
  }
  return mapping[entityType] || 'Concept'
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

// Extract entities using Gemini
async function extractEntities(text: string): Promise<Entity[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY secret not configured')
  }

  const prompt = `You are an expert entity extraction system. Extract ALL entities from the following research content.

Entity Types to Extract:
- Concept: Abstract concepts, ideas, theories, technologies, products, locations
- Person: Individual people mentioned (names, researchers, experts, leaders)
- Organization: Companies, institutions, agencies, universities, organizations
- Trend: Trends, movements, patterns, emerging developments
- Problem: Problems, risks, threats, concerns, challenges
- Solution: Solutions, benefits, opportunities, improvements, fixes

For each entity, provide:
- type: One of Concept, Person, Organization, Trend, Problem, Solution
- name: The entity name as it appears (exact match)
- description: Brief description (1-2 sentences, optional)
- confidence: Confidence score 0-1 (optional, default 0.8)

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "type": "Concept",
    "name": "Battery Cost",
    "description": "The cost of battery technology",
    "confidence": 0.9
  },
  {
    "type": "Person",
    "name": "Elon Musk",
    "description": "CEO of Tesla",
    "confidence": 0.95
  },
  {
    "type": "Organization",
    "name": "Tesla",
    "description": "Electric vehicle manufacturer",
    "confidence": 0.95
  },
  {
    "type": "Trend",
    "name": "Electric Vehicle Adoption",
    "description": "Growing adoption of electric vehicles",
    "confidence": 0.85
  },
  {
    "type": "Problem",
    "name": "Range Anxiety",
    "description": "Fear of running out of battery charge",
    "confidence": 0.8
  },
  {
    "type": "Solution",
    "name": "Fast Charging Networks",
    "description": "Infrastructure for rapid battery charging",
    "confidence": 0.9
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

    const entities = JSON.parse(content) as Entity[]
    
    return entities
      .filter(e => e.type && e.name)
      .map(e => ({
        type: e.type,
        name: e.name.trim(),
        description: e.description?.trim() || '',
        confidence: e.confidence || 0.8,
        citations: e.citations || []
      }))
  } catch (error) {
    console.error('Error extracting entities:', error)
    throw error
  }
}

// Create nodes in Neo4j
async function createNodesInNeo4j(entities: Entity[], researchId?: string): Promise<{ created: number; errors: number }> {
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.warn('Neo4j not configured, skipping node creation')
    return { created: 0, errors: 0 }
  }

  let created = 0
  let errors = 0

  try {
    // Create statements for each entity
    const statements = entities.map(entity => {
      const nodeType = mapEntityTypeToNodeType(entity.type)
      const nodeId = researchId 
        ? `${researchId}_${entity.name.toLowerCase().replace(/\s+/g, '_')}`
        : entity.name.toLowerCase().replace(/\s+/g, '_')

      return {
        statement: `
          MERGE (n:${nodeType} {id: $id})
          SET n.name = $name,
              n.label = $name,
              n.description = $description,
              n.confidence = $confidence,
              n.citations = $citations,
              ${researchId ? 'n.researchId = $researchId,' : ''}
              n.updatedAt = datetime()
          ON CREATE SET n.createdAt = datetime()
          RETURN n
        `,
        parameters: {
          id: nodeId,
          name: entity.name,
          description: entity.description || '',
          confidence: entity.confidence || 0.8,
          citations: entity.citations || [],
          ...(researchId && { researchId })
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

    console.log(`Created ${created} nodes in Neo4j, ${errors} errors`)
  } catch (error) {
    console.error('Error creating nodes in Neo4j:', error)
    errors += entities.length
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
    const { text, researchId, createNodes = true }: ExtractEntitiesRequest = await req.json()

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

    // Step 1: Extract entities
    console.log('Extracting entities from text...')
    const entities = await extractEntities(text)

    // Step 2: Create nodes in Neo4j (if requested)
    let neo4jResult = { created: 0, errors: 0 }
    if (createNodes) {
      console.log('Creating nodes in Neo4j...')
      neo4jResult = await createNodesInNeo4j(entities, researchId)
    }

    // Step 3: Group entities by type for response
    const entitiesByType = entities.reduce((acc, entity) => {
      const type = entity.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(entity)
      return acc
    }, {} as Record<string, Entity[]>)

    return new Response(
      JSON.stringify({
        success: true,
        entities,
        stats: {
          total: entities.length,
          byType: Object.keys(entitiesByType).reduce((acc, type) => {
            acc[type] = entitiesByType[type].length
            return acc
          }, {} as Record<string, number>),
          neo4j: neo4jResult
        },
        entitiesByType
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
    console.error('Error in graph-entities function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to extract entities',
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
