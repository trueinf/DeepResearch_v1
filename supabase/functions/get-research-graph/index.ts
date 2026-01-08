// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const NEO4J_URI = Deno.env.get('NEO4J_URI')
// @ts-ignore - Deno runtime
const NEO4J_USER = Deno.env.get('NEO4J_USER')
// @ts-ignore - Deno runtime
const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const { researchId } = await req.json() as { researchId: string }

    if (!researchId) {
      return new Response(
        JSON.stringify({ error: 'researchId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
      // Return empty graph if Neo4j is not configured (graph was built in-memory)
      return new Response(
        JSON.stringify({
          success: true,
          graph: {
            nodes: [],
            relationships: []
          },
          stats: {
            nodes: 0,
            relationships: 0
          },
          message: 'Neo4j not configured. Graph data is available from build-research-graph.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Convert Neo4j URI to HTTP endpoint
    const convertBoltToHttp = (uri: string): string => {
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

    // Helper function to process Neo4j response
    function processNeo4jResponse(queryData: any) {
      // Check if query returned results
      if (!queryData.results || queryData.results.length === 0 || !queryData.results[0].data) {
        return new Response(
          JSON.stringify({
            success: true,
            graph: {
              nodes: [],
              relationships: []
            },
            stats: {
              nodes: 0,
              relationships: 0
            },
            message: 'No graph data found in Neo4j.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
      
      // Transform Neo4j response to graph format
      const nodes: any[] = []
      const relationships: any[] = []
      const nodeMap = new Map()

      queryData.results[0].data.forEach((row: any) => {
        // Process nodes
        if (row.row[0]) {
          const node = row.row[0]
          const nodeId = node.id
          if (!nodeMap.has(nodeId)) {
            nodeMap.set(nodeId, true)
            nodes.push({
              id: nodeId,
              label: node.label,
              type: Object.keys(node.labels || {})[0] || 'Concept',
              properties: {
                description: node.description,
                confidence: node.confidence,
                citations: node.citations || []
              }
            })
          }
        }

        if (row.row[2]) {
          const node = row.row[2]
          const nodeId = node.id
          if (!nodeMap.has(nodeId)) {
            nodeMap.set(nodeId, true)
            nodes.push({
              id: nodeId,
              label: node.label,
              type: Object.keys(node.labels || {})[0] || 'Concept',
              properties: {
                description: node.description,
                confidence: node.confidence,
                citations: node.citations || []
              }
            })
          }
        }

        // Process relationships
        if (row.row[1]) {
          const rel = row.row[1]
          relationships.push({
            source: row.row[0]?.id,
            target: row.row[2]?.id,
            type: rel.type,
            properties: {
              confidence: rel.confidence,
              evidence: rel.evidence,
              strength: rel.strength,
              citations: rel.citations || []
            }
          })
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          graph: {
            nodes,
            relationships
          },
          stats: {
            nodes: nodes.length,
            relationships: relationships.length
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

    const baseUrl = convertBoltToHttp(NEO4J_URI)
    
    // Query Neo4j for graph data using Neo4j HTTP API
    try {
      // Try Neo4j 4.x/5.x HTTP API endpoint
      const queryResponse = await fetch(`${baseUrl}/db/neo4j/tx/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${NEO4J_USER}:${NEO4J_PASSWORD}`)}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          statements: [{
            statement: `
              MATCH (n {researchId: $researchId})
              OPTIONAL MATCH (n)-[r]->(m {researchId: $researchId})
              RETURN n, r, m
              LIMIT 1000
            `,
            parameters: { researchId }
          }]
        }),
      })

      if (!queryResponse.ok) {
        // Try fallback to older API endpoint
        const fallbackResponse = await fetch(`${baseUrl}/db/data/transaction/commit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${NEO4J_USER}:${NEO4J_PASSWORD}`)}`,
          },
          body: JSON.stringify({
            statements: [{
              statement: `
                MATCH (n {researchId: $researchId})
                OPTIONAL MATCH (n)-[r]->(m {researchId: $researchId})
                RETURN n, r, m
                LIMIT 1000
              `,
              parameters: { researchId }
            }]
          }),
        })

        if (!fallbackResponse.ok) {
          const errorText = await fallbackResponse.text().catch(() => 'Unknown error')
          console.error(`Neo4j query failed: ${fallbackResponse.status} - ${errorText}`)
          // Return empty graph instead of error
          return new Response(
            JSON.stringify({
              success: true,
              graph: {
                nodes: [],
                relationships: []
              },
              stats: {
                nodes: 0,
                relationships: 0
              },
              message: 'Neo4j not accessible. Graph will be built from report data.'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }

        // Use fallback response
        const queryData = await fallbackResponse.json()
        return processNeo4jResponse(queryData)
      }

      // Use primary response
      const queryData = await queryResponse.json()
      return processNeo4jResponse(queryData)
    } catch (neo4jError: any) {
      console.error('Neo4j connection error:', neo4jError)
      // Return empty graph instead of error - frontend will build from report
      return new Response(
        JSON.stringify({
          success: true,
          graph: {
            nodes: [],
            relationships: []
          },
          stats: {
            nodes: 0,
            relationships: 0
          },
          message: 'Neo4j not accessible. Graph will be built from report data.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }
  } catch (error: any) {
    console.error('Error fetching graph:', error)
    // Return empty graph instead of 500 error - frontend will build from report data
    return new Response(
      JSON.stringify({
        success: true,
        graph: {
          nodes: [],
          relationships: []
        },
        stats: {
          nodes: 0,
          relationships: 0
        },
        message: 'Error fetching graph from Neo4j. Graph will be built from report data.'
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
})

