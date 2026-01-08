// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
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

  try {
    // Add timeout for large files
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const formData = await req.formData()
      const file = formData.get('file') as File

      if (!file) {
        clearTimeout(timeoutId)
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        clearTimeout(timeoutId)
        return new Response(
          JSON.stringify({ error: `File size exceeds 50MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB` }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
      }

      let extractedText = ''

      // Handle different file types
      const fileName = file.name.toLowerCase()
      const fileType = file.type

      console.log(`Processing file: ${file.name}, type: ${fileType}, size: ${file.size} bytes`)

      if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileType === 'text/plain') {
        // Plain text files
        extractedText = await file.text()
      } else if (fileName.endsWith('.pdf')) {
        // PDF files - improved extraction approach
        try {
          const arrayBuffer = await file.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          
          // Check if it's a valid PDF (starts with %PDF)
          const header = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array.slice(0, 8))
          if (!header.includes('%PDF')) {
            clearTimeout(timeoutId)
            return new Response(
              JSON.stringify({ error: 'Invalid PDF file. The file may be corrupted or not a valid PDF.' }),
              { 
                status: 400, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders
                } 
              }
            )
          }
          
          // Improved PDF text extraction
          // Extract text between stream objects and text operators
          const textDecoder = new TextDecoder('utf-8', { fatal: false })
          let text = textDecoder.decode(uint8Array)
          
          // Extract text from PDF streams (between BT and ET markers)
          const streamMatches = text.match(/BT[\s\S]*?ET/g)
          if (streamMatches && streamMatches.length > 0) {
            text = streamMatches.join(' ')
          }
          
          // Extract text from text show operators (Tj, TJ, ')
          const textMatches = text.match(/\((.*?)\)\s*Tj|\[(.*?)\]\s*TJ|'(.*?)'/g)
          if (textMatches && textMatches.length > 0) {
            text = textMatches
              .map(match => {
                // Extract content from parentheses, brackets, or quotes
                const parenMatch = match.match(/\(([^)]*)\)/)
                const bracketMatch = match.match(/\[([^\]]*)\]/)
                const quoteMatch = match.match(/'([^']*)'/)
                return parenMatch?.[1] || bracketMatch?.[1] || quoteMatch?.[1] || ''
              })
              .filter(t => t && t.length > 0)
              .join(' ')
          }
          
          // Fallback: extract readable ASCII text
          if (!text || text.trim().length < 50) {
            // Extract words that look like text (3+ character sequences)
            text = textDecoder.decode(uint8Array)
            text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
            text = text.replace(/[^\x20-\x7E\n\r]/g, ' ')
            const words = text.match(/[A-Za-z]{3,}/g) || []
            text = words.join(' ')
          }
          
          // Clean up the text
          text = text.replace(/\s+/g, ' ').trim()
          
          if (!text || text.length < 10) {
            clearTimeout(timeoutId)
            return new Response(
              JSON.stringify({ error: 'Could not extract readable text from PDF. The PDF might be image-based or encrypted. Try converting it to text first.' }),
              { 
                status: 400, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders
                } 
              }
            )
          }
          
          extractedText = text.substring(0, 50000) // Limit to 50k chars
        } catch (pdfError: any) {
          clearTimeout(timeoutId)
          console.error('PDF extraction error:', pdfError)
          return new Response(
            JSON.stringify({ 
              error: `Failed to process PDF: ${pdfError?.message || 'Unknown error'}. The file might be corrupted or too large.` 
            }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
      } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        // DOCX/DOC files - basic extraction
        try {
          const arrayBuffer = await file.arrayBuffer()
          const uint8Array = new Uint8Array(arrayBuffer)
          const textDecoder = new TextDecoder('utf-8', { fatal: false })
          let text = textDecoder.decode(uint8Array)
          
          // Extract readable text (basic approach)
          text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ')
          text = text.replace(/[^\x20-\x7E\n\r]/g, ' ')
          const words = text.match(/[A-Za-z]{3,}/g) || []
          text = words.join(' ')
          
          if (!text || text.length < 10) {
            clearTimeout(timeoutId)
            return new Response(
              JSON.stringify({ error: 'Could not extract readable text from document. The file might be corrupted or in an unsupported format.' }),
              { 
                status: 400, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders
                } 
              }
            )
          }
          
          extractedText = text.substring(0, 50000)
        } catch (docError: any) {
          clearTimeout(timeoutId)
          console.error('DOC extraction error:', docError)
          return new Response(
            JSON.stringify({ 
              error: `Failed to process document: ${docError?.message || 'Unknown error'}` 
            }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
      } else {
        // Try to read as text for other file types
        try {
          extractedText = await file.text()
        } catch {
          clearTimeout(timeoutId)
          return new Response(
            JSON.stringify({ error: 'Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or MD files.' }),
            { 
              status: 400, 
              headers: { 
                'Content-Type': 'application/json',
                ...corsHeaders
              } 
            }
          )
        }
      }

      clearTimeout(timeoutId)

      if (!extractedText || extractedText.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Could not extract text from file. The file might be empty, corrupted, or in an unsupported format.' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
      }

      // Clean text to remove null characters and invalid Unicode that PostgreSQL can't handle
      const cleanText = extractedText
        .replace(/\u0000/g, '') // Remove null characters
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n, \r, \t
        .replace(/\uFFFD/g, '') // Remove replacement characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove additional control characters

      console.log(`Successfully extracted ${cleanText.length} characters from ${file.name}`)

      return new Response(
        JSON.stringify({
          success: true,
          text: cleanText,
          fileName: file.name,
          fileSize: file.size
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          },
        }
      )
    } catch (abortError: any) {
      clearTimeout(timeoutId)
      if (abortError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ error: 'File processing timed out. The file might be too large or complex. Try a smaller file or split it into parts.' }),
          { 
            status: 408, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
      }
      throw abortError
    }
  } catch (error: any) {
    console.error('Error extracting file text:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
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

