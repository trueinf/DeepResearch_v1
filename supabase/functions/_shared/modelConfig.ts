// Shared utility for model configuration management
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, serviceRoleKey)

const DEFAULT_MODELS = [
  'Provider: Gemini Model: gemini-1.5-pro-latest',
  'Provider: Claude Model: claude-sonnet-4-20250514',
]

export async function ensureDefaultModelsSeeded() {
  try {
    const { data, error } = await supabase
      .from('model_configurations')
      .select('document_content')

    if (error) {
      console.error('Error reading model_configurations', error)
      return
    }

    const existing = new Set((data || []).map((d) => d.document_content.trim()))

    const toInsert = DEFAULT_MODELS
      .filter((doc) => !existing.has(doc))
      .map((doc) => ({
        document_content: doc,
        document_format: 'text',
        version: 1,
        is_active: true,
      }))

    if (toInsert.length === 0) {
      console.log('All default models already exist')
      return
    }

    const { error: insertError } = await supabase
      .from('model_configurations')
      .insert(toInsert)

    if (insertError) {
      console.error('Error seeding model_configurations', insertError)
    } else {
      console.log(`✅ Seeded ${toInsert.length} default models`)
    }
  } catch (err) {
    console.error('Error in ensureDefaultModelsSeeded', err)
  }
}

