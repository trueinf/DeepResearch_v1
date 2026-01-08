// Community Detection using Neo4j GDS Louvain Algorithm
// POST /functions/v1/detect-communities
// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const NEO4J_URI = Deno.env.get('NEO4J_URI')
// @ts-ignore - Deno runtime
const NEO4J_USER = Deno.env.get('NEO4J_USER')
// @ts-ignore - Deno runtime
const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

interface DetectCommunitiesRequest {
  researchId?: string
  minCommunitySize?: number
}

interface Cluster {
  id: string
  theme: string
  nodes: string[]
  color: string
  size: number
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

// Generate theme name for cluster based on node types
function generateClusterTheme(nodes: any[], communityId: number): string {
  const typeCounts: Record<string, number> = {}
  
  nodes.forEach(node => {
    const type = node.type || 'Unknown'
    typeCounts[type] = (typeCounts[type] || 0) + 1
  })

  // Find dominant type
  const dominantType = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'General'

  // Map to theme names
  const themeMap: Record<string, string> = {
    'Technology': 'Tech Cluster',
    'Person': 'Stakeholder Cluster',
    'Organization': 'Organization Cluster',
    'Concept': 'Concept Cluster',
    'Trend': 'Market Cluster',
    'Problem': 'Risk Cluster',
    'Solution': 'Solution Cluster',
    'Product': 'Product Cluster',
    'Event': 'Event Cluster'
  }

  return themeMap[dominantType] || `Cluster ${communityId + 1}`
}

// Get color for cluster
function getClusterColor(clusterIndex: number): string {
  const colors = [
    '#9B59B6', // Purple - Cluster 1
    '#2ECC71', // Green - Cluster 2
    '#F2C94C', // Yellow - Cluster 3
    '#3498DB', // Blue - Cluster 4
    '#E74C3C', // Red - Cluster 5
    '#F39C12', // Orange - Cluster 6
    '#1ABC9C', // Teal - Cluster 7
    '#E67E22', // Dark Orange - Cluster 8
  ]
  return colors[clusterIndex % colors.length]
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
    const { researchId, minCommunitySize = 2 }: DetectCommunitiesRequest = await req.json()

    if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
      return new Response(
        JSON.stringify({ error: 'Neo4j credentials not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Step 1: Create a graph projection (if using GDS)
    // For AuraDB, we'll use a simpler approach with Cypher queries
    // First, get all nodes and relationships
    const getGraphQuery = researchId
      ? {
          statement: `
            MATCH (n)
            WHERE n.researchId = $researchId
            OPTIONAL MATCH (n)-[r]->(m)
            WHERE m.researchId = $researchId
            RETURN n, r, m
            LIMIT 1000
          `,
          parameters: { researchId }
        }
      : {
          statement: `
            MATCH (n)
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN n, r, m
            LIMIT 1000
          `,
          parameters: {}
        }

    const graphData = await executeNeo4jQuery([getGraphQuery])
    
    if (!graphData.results || graphData.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          clusters: [],
          message: 'No graph data found'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Step 2: Use a simplified community detection algorithm
    // Since GDS might not be available in AuraDB Free, we'll use a label propagation approach
    const communityQuery = researchId
      ? {
          statement: `
            CALL gds.labelPropagation.stream({
              nodeQuery: 'MATCH (n) WHERE n.researchId = $researchId RETURN id(n) AS id',
              relationshipQuery: 'MATCH (n)-[r]->(m) WHERE n.researchId = $researchId AND m.researchId = $researchId RETURN id(n) AS source, id(m) AS target',
              relationshipWeightProperty: null
            })
            YIELD nodeId, communityId
            RETURN gds.util.asNode(nodeId) AS node, communityId
            ORDER BY communityId, node.name
          `,
          parameters: { researchId }
        }
      : {
          statement: `
            CALL gds.labelPropagation.stream({
              nodeQuery: 'MATCH (n) RETURN id(n) AS id',
              relationshipQuery: 'MATCH (n)-[r]->(m) RETURN id(n) AS source, id(m) AS target',
              relationshipWeightProperty: null
            })
            YIELD nodeId, communityId
            RETURN gds.util.asNode(nodeId) AS node, communityId
            ORDER BY communityId, node.name
          `,
          parameters: {}
        }

    let communities: Record<number, any[]> = {}
    
    try {
      const communityData = await executeNeo4jQuery([communityQuery])
      
      if (communityData.results && communityData.results.length > 0) {
        const rows = communityData.results[0].data || []
        rows.forEach((row: any) => {
          const communityId = row.row[1] // communityId
          const node = row.row[0] // node
          
          if (!communities[communityId]) {
            communities[communityId] = []
          }
          
          communities[communityId].push({
            id: node.id || node.name,
            name: node.name,
            type: Object.keys(node.labels || {})[0] || 'Unknown',
            properties: node.properties || {}
          })
        })
      }
    } catch (gdsError) {
      // If GDS is not available, use a simpler approach
      console.log('GDS not available, using fallback community detection')
      
      // Fallback: Group by node type and relationships
      const fallbackQuery = researchId
        ? {
            statement: `
              MATCH (n)
              WHERE n.researchId = $researchId
              OPTIONAL MATCH (n)-[r]-(m)
              WHERE m.researchId = $researchId
              WITH n, collect(DISTINCT m) AS neighbors
              RETURN n, neighbors
              ORDER BY size(neighbors) DESC
            `,
            parameters: { researchId }
          }
        : {
            statement: `
              MATCH (n)
              OPTIONAL MATCH (n)-[r]-(m)
              WITH n, collect(DISTINCT m) AS neighbors
              RETURN n, neighbors
              ORDER BY size(neighbors) DESC
            `,
            parameters: {}
          }

      const fallbackData = await executeNeo4jQuery([fallbackQuery])
      
      if (fallbackData.results && fallbackData.results.length > 0) {
        const rows = fallbackData.results[0].data || []
        const nodeTypeGroups: Record<string, any[]> = {}
        
        rows.forEach((row: any) => {
          const node = row.row[0]
          const nodeType = Object.keys(node.labels || {})[0] || 'Unknown'
          
          if (!nodeTypeGroups[nodeType]) {
            nodeTypeGroups[nodeType] = []
          }
          
          nodeTypeGroups[nodeType].push({
            id: node.id || node.name,
            name: node.name,
            type: nodeType,
            properties: node.properties || {}
          })
        })
        
        // Convert type groups to communities
        Object.entries(nodeTypeGroups).forEach(([type, nodes], index) => {
          if (nodes.length >= minCommunitySize) {
            communities[index] = nodes
          }
        })
      }
    }

    // Step 3: Format clusters
    const clusters: Cluster[] = Object.entries(communities)
      .filter(([_, nodes]) => nodes.length >= minCommunitySize)
      .map(([communityId, nodes], index) => {
        const theme = generateClusterTheme(nodes, parseInt(communityId))
        const nodeIds = nodes.map(n => n.id || n.name)
        
        return {
          id: `cluster-${communityId}`,
          theme,
          nodes: nodeIds,
          color: getClusterColor(index),
          size: nodes.length
        }
      })
      .sort((a, b) => b.size - a.size) // Sort by size

    return new Response(
      JSON.stringify({
        success: true,
        clusters,
        stats: {
          totalClusters: clusters.length,
          totalNodes: clusters.reduce((sum, c) => sum + c.size, 0),
          averageClusterSize: clusters.length > 0 
            ? Math.round(clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length)
            : 0
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
    console.error('Error in detect-communities function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to detect communities',
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

