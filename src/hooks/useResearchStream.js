import { useEffect, useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function useResearchStream(prompt, model) {
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!prompt || !model) {
      setOutput('')
      setIsStreaming(false)
      return
    }

    setOutput('')
    setIsStreaming(true)
    setError(null)

    // Use fetch with ReadableStream for SSE (EventSource doesn't support auth headers)
    const url = `${SUPABASE_URL}/functions/v1/stream-research`
    
    const controller = new AbortController()
    
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        prompt,
        model
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Stream failed: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            setIsStreaming(false)
            break
          }

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.token) {
                  setOutput((prev) => prev + data.token)
                } else if (data.error) {
                  setError(data.error)
                  setIsStreaming(false)
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Stream error:', err)
          setError(err.message)
          setIsStreaming(false)
        }
      })

    return () => {
      controller.abort()
      setIsStreaming(false)
    }
  }, [prompt, model])

  return { output, isStreaming, error }
}

