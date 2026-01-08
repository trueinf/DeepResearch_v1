// Neo4j Connection Utility for Deno/Supabase Edge Functions
// Uses Neo4j HTTP API (compatible with Deno runtime)

interface Neo4jConfig {
  uri: string
  user: string
  password: string
}

interface Neo4jStatement {
  statement: string
  parameters?: Record<string, any>
}

interface Neo4jResponse {
  results: Array<{
    columns: string[]
    data: Array<{
      row: any[]
      meta: any[]
    }>
  }>
  errors: Array<{
    code: string
    message: string
  }>
}

class Neo4jClient {
  private config: Neo4jConfig
  private baseUrl: string

  constructor(config: Neo4jConfig) {
    this.config = config
    // Convert bolt:// or neo4j+s:// to HTTP API endpoint
    this.baseUrl = this.convertBoltToHttp(config.uri)
  }

  private convertBoltToHttp(uri: string): string {
    // Neo4j AuraDB: neo4j+s://xxxxx.databases.neo4j.io
    // AuraDB uses Query API v2: https://xxxxx.databases.neo4j.io/db/neo4j/query/v2
    // But we'll use the traditional HTTP API endpoint for compatibility:
    // https://xxxxx.databases.neo4j.io/db/data/transaction/commit
    
    if (uri.startsWith('neo4j+s://')) {
      // Extract host from neo4j+s://host:port or neo4j+s://host
      const match = uri.match(/neo4j\+s:\/\/([^:]+)(?::\d+)?/)
      if (match) {
        const host = match[1]
        // Use traditional HTTP API endpoint (works with AuraDB)
        return `https://${host}`
      }
      return uri.replace('neo4j+s://', 'https://')
    } else if (uri.startsWith('neo4j://')) {
      // Local Neo4j: neo4j://localhost:7687 -> http://localhost:7474
      const match = uri.match(/neo4j:\/\/([^:]+):(\d+)/)
      if (match) {
        return `http://${match[1]}:7474`
      }
      return uri.replace('neo4j://', 'http://').replace(':7687', ':7474')
    }
    // If already HTTP/HTTPS, return as is
    return uri
  }

  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.config.user}:${this.config.password}`)}`
  }

  async execute(statements: Neo4jStatement[]): Promise<Neo4jResponse> {
    // For AuraDB, try traditional HTTP API first (it's more compatible)
    // If that fails, we'll try Query API v2
    const isAuraDB = this.baseUrl.includes('databases.neo4j.io')
    
    // Try traditional HTTP API first
    try {
      return await this.executeTraditional(statements)
    } catch (error) {
      // If traditional API fails and it's AuraDB, try Query API v2
      if (isAuraDB && error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.log('Trying AuraDB Query API v2...')
        return await this.executeQueryV2(statements)
      }
      throw error
    }
  }

  private async executeTraditional(statements: Neo4jStatement[]): Promise<Neo4jResponse> {
    const url = `${this.baseUrl}/db/data/transaction/commit`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({ statements }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Neo4j request failed: ${response.status} - ${errorText}`)
    }

    const data: Neo4jResponse = await response.json()
    
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Neo4j query error: ${data.errors.map(e => e.message).join(', ')}`)
    }

    return data
  }

  private async executeQueryV2(statements: Neo4jStatement[]): Promise<Neo4jResponse> {
    // AuraDB Query API v2 format
    const url = `${this.baseUrl}/db/neo4j/query/v2`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({
        statements: statements.map(stmt => ({
          text: stmt.statement,
          parameters: stmt.parameters || {}
        }))
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Neo4j Query API v2 failed: ${response.status} - ${errorText}`)
    }

    // Query API v2 might return a different format, convert to standard format
    const data = await response.json()
    
    // Handle both v2 format and traditional format
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Neo4j query error: ${data.errors.map((e: any) => e.message || e).join(', ')}`)
    }

    // Convert v2 format to standard format if needed
    if (data.results) {
      return data as Neo4jResponse
    }
    
    // If it's already in standard format, return as is
    return data as Neo4jResponse
  }

  private async executeTraditional(statements: Neo4jStatement[]): Promise<Neo4jResponse> {
    const url = `${this.baseUrl}/db/data/transaction/commit`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthHeader(),
      },
      body: JSON.stringify({ statements }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Neo4j request failed: ${response.status} - ${errorText}`)
    }

    const data: Neo4jResponse = await response.json()
    
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Neo4j query error: ${data.errors.map(e => e.message).join(', ')}`)
    }

    return data
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.execute([{ statement: 'RETURN 1 as test' }])
      return true
    } catch (error) {
      console.error('Neo4j connection test failed:', error)
      return false
    }
  }
}

// Initialize schema with node types and relationships
export async function initializeNeo4jSchema(config: Neo4jConfig): Promise<void> {
  const client = new Neo4jClient(config)

  const schemaStatements: Neo4jStatement[] = [
    // Create indexes for better performance
    {
      statement: `
        CREATE CONSTRAINT concept_id IF NOT EXISTS
        FOR (n:Concept) REQUIRE n.id IS UNIQUE
      `,
    },
    {
      statement: `
        CREATE CONSTRAINT person_id IF NOT EXISTS
        FOR (n:Person) REQUIRE n.id IS UNIQUE
      `,
    },
    {
      statement: `
        CREATE CONSTRAINT organization_id IF NOT EXISTS
        FOR (n:Organization) REQUIRE n.id IS UNIQUE
      `,
    },
    {
      statement: `
        CREATE CONSTRAINT trend_id IF NOT EXISTS
        FOR (n:Trend) REQUIRE n.id IS UNIQUE
      `,
    },
    {
      statement: `
        CREATE CONSTRAINT problem_id IF NOT EXISTS
        FOR (n:Problem) REQUIRE n.id IS UNIQUE
      `,
    },
    {
      statement: `
        CREATE CONSTRAINT solution_id IF NOT EXISTS
        FOR (n:Solution) REQUIRE n.id IS UNIQUE
      `,
    },
    // Create indexes for researchId (for faster queries)
    {
      statement: `
        CREATE INDEX researchId_index IF NOT EXISTS
        FOR (n) ON (n.researchId)
      `,
    },
  ]

  try {
    // Execute schema creation (some may fail if already exists, that's OK)
    for (const stmt of schemaStatements) {
      try {
        await client.execute([stmt])
      } catch (error) {
        // Ignore errors for existing constraints/indexes
        if (!error.message?.includes('already exists')) {
          console.warn('Schema initialization warning:', error)
        }
      }
    }
    console.log('Neo4j schema initialized successfully')
  } catch (error) {
    console.error('Error initializing Neo4j schema:', error)
    throw error
  }
}

// Create Neo4j client instance
export function createNeo4jClient(): Neo4jClient | null {
  const uri = Deno.env.get('NEO4J_URI')
  const user = Deno.env.get('NEO4J_USER')
  const password = Deno.env.get('NEO4J_PASSWORD')

  if (!uri || !user || !password) {
    return null
  }

  return new Neo4jClient({ uri, user, password })
}

// Node type mapping (from research entities to schema types)
export function mapEntityTypeToNodeType(entityType: string): string {
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

// Relationship type mapping
export function mapRelationshipType(relType: string): string {
  const mapping: Record<string, string> = {
    'INFLUENCES': 'INFLUENCES',
    'CAUSES': 'CAUSES',
    'ENABLES': 'RELATES_TO',
    'CONTRADICTS': 'CONTRADICTS',
    'DEPENDS_ON': 'PART_OF',
    'SIMILAR_TO': 'RELATES_TO',
    'PART_OF': 'PART_OF',
    'USES': 'RELATES_TO',
    'REGULATES': 'INFLUENCES',
    'ACCELERATES': 'INFLUENCES',
    'REDUCES': 'INFLUENCES',
    'INCREASES': 'INFLUENCES',
    'RESISTS': 'CONTRADICTS',
    'SUPPORTS': 'SUPPORTS',
  }
  return mapping[relType] || 'RELATES_TO'
}

export { Neo4jClient }
export type { Neo4jConfig, Neo4jStatement, Neo4jResponse }

