import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function parseDocumentContent(doc) {
  // "Provider: Gemini Model: gemini-1.5-pro"
  const match = doc.match(/Provider:\s*(.+?)\s+Model:\s*(.+)$/i)
  if (!match) return null
  return {
    provider: match[1].trim(),
    model: match[2].trim(),
  }
}

export function useModelConfigurations() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadModels() {
      try {
        const { data, error: fetchError } = await supabase
          .from('model_configurations')
          .select('document_content, is_active')
          .eq('is_active', true)

        if (fetchError) {
          console.error('Error loading models', fetchError)
          setError(fetchError.message)
          setLoading(false)
          return
        }

        const parsed = (data || [])
          .map((row) => parseDocumentContent(row.document_content))
          .filter(Boolean)

        setModels(parsed)
        setLoading(false)
      } catch (err) {
        console.error('Error in useModelConfigurations', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadModels()
  }, [])

  return { models, loading, error }
}

