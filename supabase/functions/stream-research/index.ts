// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
// @ts-ignore - Deno runtime
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
// @ts-ignore - Deno runtime
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // Handle browser preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, 
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain'
      }
    })
  }

  // Support both GET (for EventSource) and POST
  let prompt: string
  let model: string

  if (req.method === 'GET') {
    const url = new URL(req.url)
    prompt = url.searchParams.get('prompt') || ''
    model = url.searchParams.get('model') || 'gemini-1.5-pro'
  } else if (req.method === 'POST') {
    const body = await req.json()
    prompt = body.prompt || ''
    model = body.model || 'gemini-1.5-pro'
  } else {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: 'prompt required' }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    )
  }

  const encoder = new TextEncoder()

  // -------------------------------------------------------------------
  // 📌 CLAUDE ONLY (Triggered when model starts with "claude")
  // -------------------------------------------------------------------
  if (model.startsWith('claude')) {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Create SSE stream for Claude
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              messages: [{ role: 'user', content: prompt }],
              stream: true,
            }),
          })

          if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6))
                    if (data.type === 'content_block_delta' && data.delta?.text) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ token: data.delta.text })}\n\n`)
                      )
                    }
                  } catch {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          controller.close()
        } catch (error) {
          console.error('Claude streaming error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...corsHeaders
      },
    })
  }

  // -------------------------------------------------------------------
  // 📌 GEMINI ONLY (Triggered when model starts with "gemini")
  // -------------------------------------------------------------------
  if (model.startsWith('gemini')) {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Create SSE stream for Gemini
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
          const m = genAI.getGenerativeModel({ model })

          const result = await m.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          })

          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`)
            )
          }

          controller.close()
        } catch (error) {
          console.error('Gemini streaming error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        ...corsHeaders
      },
    })
  }

  // -------------------------------------------------------------------
  // ❌ Model not supported
  // -------------------------------------------------------------------
  return new Response(
    JSON.stringify({
      error: 'Model not supported',
      model_used: model
    }),
    { 
      status: 400, 
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  )
})

