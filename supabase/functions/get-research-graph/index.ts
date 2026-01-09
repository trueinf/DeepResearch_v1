// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const NEO4J_URI = Deno.env.get('NEO4J_URI')
// @ts-ignore - Deno runtime
const NEO4J_USER = Deno.env.get('NEO4J_USER')
// @ts-ignore - Deno runtime
const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

// Helper function to encode to base64 for Basic Auth (Deno-compatible)
function encodeBase64Basic(str: string): string {
  try {
    // btoa() is available in Deno Edge Functions
    // @ts-ignore - btoa is available in Deno runtime
    if (typeof btoa !== 'undefined') {
      return btoa(str)
    }
    // Fallback: manual base64 encoding if btoa is not available
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i = 0
    const bytes = new TextEncoder().encode(str)
    
    while (i < bytes.length) {
      const a = bytes[i++]
      const b = i < bytes.length ? bytes[i++] : 0
      const c = i < bytes.length ? bytes[i++] : 0
      
      const bitmap = (a << 16) | (b << 8) | c
      result += chars.charAt((bitmap >> 18) & 63)
      result += chars.charAt((bitmap >> 12) & 63)
      result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '='
      result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : '='
    }
    return result
  } catch (error) {
    console.error('Base64 encoding error:', error)
    return ''
  }
}

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
    let requestData
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('Failed to parse request JSON:', parseError)
      return new Response(
        JSON.stringify({ 
          success: true,
          graph: { nodes: [], relationships: [] },
          stats: { nodes: 0, relationships: 0 },
          message: 'Invalid request format. Graph will be built from report data.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const { researchId } = requestData as { researchId?: string }

    if (!researchId || typeof researchId !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: true,
          graph: { nodes: [], relationships: [] },
          stats: { nodes: 0, relationships: 0 },
          message: 'researchId is required. Graph will be built from report data.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
      try {
        // Check if query returned results
        if (!queryData || !queryData.results || queryData.results.length === 0 || !queryData.results[0] || !queryData.results[0].data) {
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

        const dataRows = queryData.results[0].data || []
        
        dataRows.forEach((row: any) => {
          try {
            // Process nodes
            if (row && row.row && row.row[0]) {
              const node = row.row[0]
              const nodeId = node?.id || node?.properties?.id || String(node)
              if (nodeId && !nodeMap.has(nodeId)) {
                nodeMap.set(nodeId, true)
                nodes.push({
                  id: nodeId,
                  label: node?.label || node?.properties?.label || String(nodeId),
                  type: (node?.labels && Array.isArray(node.labels) && node.labels[0]) || 
                        (typeof node.labels === 'object' && Object.keys(node.labels || {})[0]) || 
                        'Concept',
                  properties: {
                    description: node?.description || node?.properties?.description || '',
                    confidence: node?.confidence || node?.properties?.confidence || 0,
                    citations: node?.citations || node?.properties?.citations || []
                  }
                })
              }
            }

            if (row && row.row && row.row[2]) {
              const node = row.row[2]
              const nodeId = node?.id || node?.properties?.id || String(node)
              if (nodeId && !nodeMap.has(nodeId)) {
                nodeMap.set(nodeId, true)
                nodes.push({
                  id: nodeId,
                  label: node?.label || node?.properties?.label || String(nodeId),
                  type: (node?.labels && Array.isArray(node.labels) && node.labels[0]) || 
                        (typeof node.labels === 'object' && Object.keys(node.labels || {})[0]) || 
                        'Concept',
                  properties: {
                    description: node?.description || node?.properties?.description || '',
                    confidence: node?.confidence || node?.properties?.confidence || 0,
                    citations: node?.citations || node?.properties?.citations || []
                  }
                })
              }
            }

            // Process relationships
            if (row && row.row && row.row[1]) {
              const rel = row.row[1]
              const sourceId = row.row[0]?.id || row.row[0]?.properties?.id || String(row.row[0])
              const targetId = row.row[2]?.id || row.row[2]?.properties?.id || String(row.row[2])
              
              if (sourceId && targetId) {
                relationships.push({
                  source: sourceId,
                  target: targetId,
                  type: rel?.type || rel?.properties?.type || 'RELATED',
                  properties: {
                    confidence: rel?.confidence || rel?.properties?.confidence || 0,
                    evidence: rel?.evidence || rel?.properties?.evidence || '',
                    strength: rel?.strength || rel?.properties?.strength || 0,
                    citations: rel?.citations || rel?.properties?.citations || []
                  }
                })
              }
            }
          } catch (rowError) {
            console.error('Error processing row:', rowError)
            // Continue processing other rows
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
      } catch (processError: any) {
        console.error('Error processing Neo4j response:', processError)
        // Return empty graph if processing fails
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
            message: 'Error processing Neo4j response. Graph will be built from report data.'
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

    const baseUrl = convertBoltToHttp(NEO4J_URI)
    
    // Query Neo4j for graph data using Neo4j HTTP API
    try {
      // Create base64 auth header for Neo4j (Deno-compatible)
      const credentials = `${NEO4J_USER}:${NEO4J_PASSWORD}`
      const encodedCredentials = encodeBase64Basic(credentials)
      
      // Try Neo4j 4.x/5.x HTTP API endpoint
      const queryResponse = await fetch(`${baseUrl}/db/neo4j/tx/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${encodedCredentials}`,
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
            'Authorization': `Basic ${encodedCredentials}`,
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
        let fallbackQueryData
        try {
          fallbackQueryData = await fallbackResponse.json()
        } catch (jsonError) {
          console.error('Failed to parse fallback Neo4j response:', jsonError)
          return new Response(
            JSON.stringify({
              success: true,
              graph: { nodes: [], relationships: [] },
              stats: { nodes: 0, relationships: 0 },
              message: 'Neo4j fallback response parsing failed. Graph will be built from report data.'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }
        return processNeo4jResponse(fallbackQueryData)
      }

      // Use primary response
      let queryData
      try {
        queryData = await queryResponse.json()
      } catch (jsonError) {
        console.error('Failed to parse Neo4j response:', jsonError)
        // Return empty graph if response parsing fails
        return new Response(
          JSON.stringify({
            success: true,
            graph: { nodes: [], relationships: [] },
            stats: { nodes: 0, relationships: 0 },
            message: 'Neo4j response parsing failed. Graph will be built from report data.'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
      }
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

