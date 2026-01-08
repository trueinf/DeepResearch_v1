// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// @ts-ignore - Deno runtime
const NEO4J_URI = Deno.env.get('NEO4J_URI') // e.g., "neo4j+s://xxxxx.databases.neo4j.io"
// @ts-ignore - Deno runtime
const NEO4J_USER = Deno.env.get('NEO4J_USER')
// @ts-ignore - Deno runtime
const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

interface ResearchReport {
  topic: string
  executiveSummary?: string | null
  detailedAnalysis?: string | null
  keyFindings?: Array<{ text: string; citations?: number[] }>
  insights?: string | null
  conclusion?: string | null
  sources?: Array<{ url: string; domain: string; date: string; title?: string }>
}

interface Entity {
  id: string
  label: string
  type: 'Person' | 'Organization' | 'Technology' | 'Concept' | 'Event' | 'Risk' | 'Benefit' | 'Product' | 'Location'
  properties?: {
    description?: string
    confidence?: number
    citations?: number[]
    timestamp?: string
  }
}

interface Relationship {
  source: string
  target: string
  type: 'INFLUENCES' | 'CAUSES' | 'ENABLES' | 'CONTRADICTS' | 'DEPENDS_ON' | 'SIMILAR_TO' | 'PART_OF' | 'USES' | 'REGULATES' | 'ACCELERATES' | 'REDUCES' | 'INCREASES' | 'RESISTS'
  properties?: {
    confidence?: number
    evidence?: string
    citations?: number[]
    strength?: number
  }
}

interface GraphData {
  nodes: Entity[]
  relationships: Relationship[]
  clusters?: Array<{
    id: string
    nodes: string[]
    theme: string
  }>
  centrality?: Array<{
    nodeId: string
    score: number
    type: 'degree' | 'pagerank' | 'betweenness'
  }>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Extract entities using Gemini
async function extractEntities(report: ResearchReport): Promise<Entity[]> {
  const fullText = `
Topic: ${report.topic}

Executive Summary: ${report.executiveSummary || ''}

Detailed Analysis: ${report.detailedAnalysis || ''}

Key Findings: ${JSON.stringify(report.keyFindings || [])}

Insights: ${report.insights || ''}

Conclusion: ${report.conclusion || ''}
`.trim()

  const prompt = `You are an expert knowledge extraction system. Extract ALL entities from the following research report.

Entity Types:
- Person: Individual people mentioned
- Organization: Companies, institutions, agencies
- Technology: Technologies, tools, systems
- Concept: Abstract concepts, ideas, theories
- Event: Historical or future events
- Risk: Risks, threats, concerns
- Benefit: Benefits, advantages, opportunities
- Product: Products, services, solutions
- Location: Places, regions, countries

For each entity, provide:
- id: unique identifier (lowercase, no spaces, use underscores)
- label: the entity name as it appears
- type: one of the types above
- description: brief description (1-2 sentences)
- confidence: confidence score 0-1
- citations: array of citation numbers if mentioned in findings

Return ONLY valid JSON array of entities, no markdown, no explanation:
[
  {
    "id": "generative_ai",
    "label": "Generative AI",
    "type": "Technology",
    "description": "AI systems that generate new content",
    "confidence": 0.95,
    "citations": [1, 3]
  },
  ...
]

Research Report:
${fullText.substring(0, 50000)}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent`, {
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

    // Parse JSON response
    const entities = JSON.parse(content) as Entity[]
    return entities
  } catch (error) {
    console.error('Error extracting entities:', error)
    throw error
  }
}

// Extract relationships using Gemini
async function extractRelationships(report: ResearchReport, entities: Entity[]): Promise<Relationship[]> {
  const entityList = entities.map(e => `${e.id} (${e.label}, ${e.type})`).join('\n')
  
  const fullText = `
Topic: ${report.topic}

Executive Summary: ${report.executiveSummary || ''}

Detailed Analysis: ${report.detailedAnalysis || ''}

Key Findings: ${JSON.stringify(report.keyFindings || [])}

Insights: ${report.insights || ''}

Conclusion: ${report.conclusion || ''}
`.trim()

  const prompt = `You are an expert relationship extraction system. Extract ALL relationships between entities from the research report.

Available Entities:
${entityList}

Relationship Types:
- INFLUENCES: A influences B
- CAUSES: A causes B
- ENABLES: A enables B
- CONTRADICTS: A contradicts B
- DEPENDS_ON: A depends on B
- SIMILAR_TO: A is similar to B
- PART_OF: A is part of B
- USES: A uses B
- REGULATES: A regulates B
- ACCELERATES: A accelerates B
- REDUCES: A reduces B
- INCREASES: A increases B
- RESISTS: A resists B

For each relationship, provide:
- source: entity id (from the list above)
- target: entity id (from the list above)
- type: relationship type (UPPERCASE)
- evidence: brief evidence text (1 sentence)
- confidence: confidence score 0-1
- strength: relationship strength 0-1
- citations: array of citation numbers if mentioned

Return ONLY valid JSON array of relationships, no markdown, no explanation:
[
  {
    "source": "generative_ai",
    "target": "radiology_summarization",
    "type": "ENABLES",
    "evidence": "Generative AI enables automated radiology summarization",
    "confidence": 0.9,
    "strength": 0.85,
    "citations": [2]
  },
  ...
]

Research Report:
${fullText.substring(0, 50000)}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent`, {
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
  } catch (error) {
    console.error('Error extracting relationships:', error)
    throw error
  }
}

// Build graph in Neo4j
async function buildNeo4jGraph(researchId: string, entities: Entity[], relationships: Relationship[]): Promise<void> {
  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.warn('Neo4j credentials not configured, skipping graph build')
    return
  }

  try {
    // Use Neo4j HTTP API (simpler than driver in Deno)
    const authResponse = await fetch(`${NEO4J_URI.replace(/\/$/, '')}/db/data/transaction/commit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${NEO4J_USER}:${NEO4J_PASSWORD}`)}`,
      },
      body: JSON.stringify({
        statements: [{
          statement: 'RETURN 1 as test'
        }]
      }),
    })

    if (!authResponse.ok) {
      throw new Error(`Neo4j connection failed: ${authResponse.status}`)
    }

    // Create nodes
    const nodeStatements = entities.map(entity => ({
      statement: `
        MERGE (n:${entity.type} {id: $id, researchId: $researchId})
        SET n.label = $label,
            n.description = $description,
            n.confidence = $confidence,
            n.citations = $citations,
            n.updatedAt = datetime()
        RETURN n
      `,
      parameters: {
        id: `${researchId}_${entity.id}`,
        researchId,
        label: entity.label,
        description: entity.properties?.description || '',
        confidence: entity.properties?.confidence || 0.5,
        citations: entity.properties?.citations || []
      }
    }))

    // Create relationships
    const relStatements = relationships.map(rel => ({
      statement: `
        MATCH (a {id: $sourceId, researchId: $researchId})
        MATCH (b {id: $targetId, researchId: $researchId})
        MERGE (a)-[r:${rel.type}]->(b)
        SET r.confidence = $confidence,
            r.evidence = $evidence,
            r.strength = $strength,
            r.citations = $citations,
            r.updatedAt = datetime()
        RETURN r
      `,
      parameters: {
        sourceId: `${researchId}_${rel.source}`,
        targetId: `${researchId}_${rel.target}`,
        researchId,
        confidence: rel.properties?.confidence || 0.5,
        evidence: rel.properties?.evidence || '',
        strength: rel.properties?.strength || 0.5,
        citations: rel.properties?.citations || []
      }
    }))

    // Execute in batches
    const batchSize = 10
    for (let i = 0; i < nodeStatements.length; i += batchSize) {
      const batch = nodeStatements.slice(i, i + batchSize)
      await fetch(`${NEO4J_URI.replace(/\/$/, '')}/db/data/transaction/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${NEO4J_USER}:${NEO4J_PASSWORD}`)}`,
        },
        body: JSON.stringify({
          statements: batch
        }),
      })
    }

    for (let i = 0; i < relStatements.length; i += batchSize) {
      const batch = relStatements.slice(i, i + batchSize)
      await fetch(`${NEO4J_URI.replace(/\/$/, '')}/db/data/transaction/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${NEO4J_USER}:${NEO4J_PASSWORD}`)}`,
        },
        body: JSON.stringify({
          statements: batch
        }),
      })
    }

    console.log(`Graph built: ${entities.length} nodes, ${relationships.length} relationships`)
  } catch (error) {
    console.error('Error building Neo4j graph:', error)
    // Don't throw - allow graph to be returned even if Neo4j fails
  }
}

// Run graph algorithms (simulated - would use Neo4j GDS in production)
async function runGraphAlgorithms(entities: Entity[], relationships: Relationship[]): Promise<{
  clusters: Array<{ id: string; nodes: string[]; theme: string }>
  centrality: Array<{ nodeId: string; score: number; type: string }>
}> {
  // Simple community detection (Louvain-like)
  const clusters: Array<{ id: string; nodes: string[]; theme: string }> = []
  const nodeToCluster = new Map<string, string>()
  
  // Group by entity type as initial clusters
  const typeGroups = new Map<string, string[]>()
  entities.forEach(entity => {
    if (!typeGroups.has(entity.type)) {
      typeGroups.set(entity.type, [])
    }
    typeGroups.get(entity.type)!.push(entity.id)
  })

  typeGroups.forEach((nodes, type) => {
    const clusterId = `cluster_${type.toLowerCase()}`
    clusters.push({
      id: clusterId,
      nodes,
      theme: type
    })
    nodes.forEach(nodeId => nodeToCluster.set(nodeId, clusterId))
  })

  // Calculate degree centrality
  const degreeCount = new Map<string, number>()
  relationships.forEach(rel => {
    degreeCount.set(rel.source, (degreeCount.get(rel.source) || 0) + 1)
    degreeCount.set(rel.target, (degreeCount.get(rel.target) || 0) + 1)
  })

  const centrality = Array.from(degreeCount.entries())
    .map(([nodeId, score]) => ({
      nodeId,
      score,
      type: 'degree'
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) // Top 10

  return { clusters, centrality }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  try {
    const { report, researchId } = await req.json() as { report: ResearchReport; researchId: string }

    if (!report || !report.topic) {
      return new Response(
        JSON.stringify({ error: 'Report data with topic is required' }),
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
    console.log('Extracting entities...')
    const entities = await extractEntities(report)

    // Step 2: Extract relationships
    console.log('Extracting relationships...')
    const relationships = await extractRelationships(report, entities)

    // Step 3: Build Neo4j graph (if configured)
    if (researchId && NEO4J_URI && NEO4J_USER && NEO4J_PASSWORD) {
      console.log('Building Neo4j graph...')
      await buildNeo4jGraph(researchId, entities, relationships)
    }

    // Step 4: Run graph algorithms
    console.log('Running graph algorithms...')
    const { clusters, centrality } = await runGraphAlgorithms(entities, relationships)

    // Step 5: Return graph data
    const graphData: GraphData = {
      nodes: entities,
      relationships,
      clusters,
      centrality
    }

    return new Response(
      JSON.stringify({
        success: true,
        graph: graphData,
        stats: {
          nodes: entities.length,
          relationships: relationships.length,
          clusters: clusters.length
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
  } catch (error: any) {
    console.error('Error building research graph:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to build research graph',
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

