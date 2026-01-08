// Initialize Neo4j Schema - Run this once to set up the database schema
// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { initializeNeo4jSchema, createNeo4jClient } from "../_shared/neo4j.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const NEO4J_URI = Deno.env.get('NEO4J_URI')
    const NEO4J_USER = Deno.env.get('NEO4J_USER')
    const NEO4J_PASSWORD = Deno.env.get('NEO4J_PASSWORD')

    if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
      return new Response(
        JSON.stringify({ 
          error: 'Neo4j credentials not configured',
          message: 'Please set NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in Supabase Secrets'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Test connection first
    const client = createNeo4jClient()
    if (!client) {
      throw new Error('Failed to create Neo4j client')
    }

    const connectionTest = await client.testConnection()
    if (!connectionTest) {
      throw new Error('Neo4j connection test failed')
    }

    // Initialize schema
    await initializeNeo4jSchema({
      uri: NEO4J_URI,
      user: NEO4J_USER,
      password: NEO4J_PASSWORD,
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Neo4j schema initialized successfully',
        schema: {
          nodes: ['Concept', 'Person', 'Organization', 'Trend', 'Problem', 'Solution'],
          relationships: ['RELATES_TO', 'INFLUENCES', 'CAUSES', 'CONTRADICTS', 'SUPPORTS', 'PART_OF']
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error initializing Neo4j schema:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to initialize Neo4j schema',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

