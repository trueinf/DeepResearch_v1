// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// @ts-ignore - Deno runtime
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface ClarifyRequest {
  input: string
  model?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const instructions = `
You are an intelligent research assistant helping a user define the scope of a research query.

The user has entered an initial question or topic. 

Before starting any research, your goal is to ask **clarifying follow-up questions** that help narrow or define what kind of research is needed.

### OBJECTIVE:

Ask questions that help determine the *focus, context, and boundaries* of the research so a future agent can deliver a deep, targeted analysis.

### BEHAVIOR GUIDELINES:

- Ask **exactly 5 clear, specific, and insightful questions**.

- Focus on questions that:

  1. Clarify **scope or focus area** — e.g., "Do you want this research to focus on global trends or a specific country?"

  2. Define **time period or relevance** — e.g., "Should this cover the past 5 years, or include historical context?"

  3. Identify **industry, domain, or audience** — e.g., "Is the interest mainly in consumer behavior or company strategy?"

  4. Confirm **output expectations** — e.g., "Are you looking for a summary, statistical data, or actionable insights?"

  5. Explore **comparative or contextual aspects** — e.g., "Would you like this compared with competitors or benchmarks?"

- Keep each question short, conversational, and non-redundant.

- Do **not** begin doing research, analysis, or summaries.

- Avoid restating or rephrasing the user's input.

- If the user's input is already detailed and specific, still ask **5 questions** but make them more focused and confirmatory.

- Maintain a **friendly, analytical tone**, as if you're preparing for a professional research briefing.

### OUTPUT FORMAT:

Return **exactly 5 questions** as a **numbered list**, each on a SINGLE line (do not split questions across multiple lines), for example:

1. What specific region or market should this analysis focus on?
2. Do you want the data from the past 5 years or more recent trends?
3. Should the research include financial or competitive metrics?
4. What level of detail or depth is required for this research?
5. Are there any specific comparisons or benchmarks you want included?

CRITICAL REQUIREMENTS:
- You MUST return exactly 5 questions (no more, no less)
- Each question must be COMPLETE and on a SINGLE line
- Each question must end with a question mark (?)
- Each question must be a full, grammatically complete sentence
- Do NOT split questions across multiple lines
- Do NOT include any introduction or closing remarks
- Only return the numbered questions, one per line
`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
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
    const { input, model } = await req.json() as ClarifyRequest

    if (!input) {
      return new Response(
        JSON.stringify({ error: 'Input is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    // Determine which provider to use based on model name
    // Default to gemini-2.5-flash (matching frontend default)
    const selectedModel = model || 'gemini-2.5-flash'
    const isClaude = selectedModel?.toLowerCase().includes('claude')
    const isGemini = selectedModel?.toLowerCase().includes('gemini') || !isClaude

    // Enhanced prompt with full instructions for adaptive questions
    const fullPrompt = `${instructions}

RESEARCH QUERY TO ANALYZE:
"${input}"

YOUR TASK:
Analyze the research query above and generate exactly 5 clarifying questions that are SPECIFICALLY TAILORED to this research topic. 

IMPORTANT REQUIREMENTS:
1. Each question must be ADAPTIVE and RELEVANT to the specific research query provided
2. Questions should help narrow down the scope, context, and boundaries for THIS PARTICULAR research
3. Make questions specific to the domain, industry, or topic mentioned in the query
4. Do NOT use generic questions - tailor each one to the research query
5. You MUST return exactly 5 questions, numbered 1-5, each on a single line
6. Each question must end with a question mark (?)
7. Do NOT include any explanations, introductions, or additional text
8. Only return the 5 numbered questions

EXAMPLE FORMAT:
1. [Question specifically tailored to the research query]?
2. [Question specifically tailored to the research query]?
3. [Question specifically tailored to the research query]?
4. [Question specifically tailored to the research query]?
5. [Question specifically tailored to the research query]?

Now generate exactly 5 adaptive clarifying questions for: "${input}"`

    let response: Response
    let outputText = ''
    let rawResponseData: any = null

    // -------------------------------------------------------------------
    // 📌 CLAUDE SUPPORT (Triggered when model starts with "claude")
    // -------------------------------------------------------------------
    if (isClaude) {
      if (!ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_KEY secret not configured' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
      }

      console.log('Calling Claude API with model:', selectedModel)

      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 800,
          messages: [{ role: 'user', content: fullPrompt }],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('Claude API error:', response.status, errorData)
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to get clarification from Claude', 
            status: response.status,
            details: errorData,
            errorMessage: errorData?.error?.message || errorData?.message || 'Unknown error'
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

      const data = await response.json()
      rawResponseData = data
      console.log('Full Claude response:', JSON.stringify(data, null, 2))
      
      // Claude API response structure: content[0].text
      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        outputText = data.content[0].text || ''
      } else if (data.text) {
        outputText = String(data.text)
      } else {
        outputText = JSON.stringify(data, null, 2)
      }
    } 
    // -------------------------------------------------------------------
    // 📌 GEMINI SUPPORT (Default)
    // -------------------------------------------------------------------
    else {
      if (!GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY secret not configured' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            } 
          }
        )
      }

      const requestBody = {
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800,
        },
        systemInstruction: {
          parts: [{ text: 'You are an expert research assistant. Your job is to generate exactly 5 adaptive, specific clarifying questions tailored to each research query. Always return exactly 5 questions, numbered 1-5, each on a single line, ending with a question mark.' }]
        }
      }

      // Use the model passed from frontend, or intelligent fallback
      let modelName = selectedModel
      
      // If it's a generic "gemini" or "2.5" without specific model, use intelligent selection
      if (!modelName || modelName === 'gemini' || modelName === '2.5') {
        modelName = 'gemini-2.5-flash' // Default to flash for speed
      } else if (modelName.includes('2.5-flash') || modelName.includes('flash')) {
        modelName = 'gemini-2.5-flash'
      } else if (modelName.includes('2.5-pro') || modelName.includes('pro')) {
        modelName = 'gemini-2.5-pro'
      } else if (modelName.includes('1.5-pro')) {
        modelName = 'gemini-1.5-pro'
      } else if (modelName.includes('1.5-flash')) {
        modelName = 'gemini-1.5-flash'
      } else if (modelName.includes('2.5')) {
        // If just "2.5" is specified, default to flash for speed
        modelName = 'gemini-2.5-flash'
      } else {
        // Fallback to flash for speed
        modelName = 'gemini-2.5-flash'
      }
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`
      
      console.log('Calling Gemini API with model:', modelName)
      console.log('API URL:', apiUrl)
      console.log('API Key present:', !!GEMINI_API_KEY)

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        console.error('Gemini API error:', response.status, errorData)
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to get clarification from Gemini', 
            status: response.status,
            details: errorData,
            errorMessage: errorData?.error?.message || errorData?.message || 'Unknown error'
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

      const data = await response.json()
      rawResponseData = data
      console.log('Full Gemini response:', JSON.stringify(data, null, 2))
      
      // Gemini API response structure: candidates[0].content.parts[0].text
      if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const candidate = data.candidates[0]
        if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
          outputText = candidate.content.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('\n\n')
        }
      } else if (data.text) {
        outputText = String(data.text)
      } else {
        outputText = JSON.stringify(data, null, 2)
      }
    }

    // Ensure outputText is always a string
    outputText = String(outputText || '').trim()
    
    // If outputText looks like JSON, try to parse it and extract text
    if (outputText.startsWith('{') || outputText.startsWith('[')) {
      try {
        const parsed = JSON.parse(outputText)
        // If it's an object with text/content fields, extract them
        if (parsed && typeof parsed === 'object') {
          const textFromJson = parsed.text || parsed.content || parsed.message || parsed.response
          if (textFromJson && typeof textFromJson === 'string' && textFromJson.length > 10) {
            outputText = textFromJson
          } else if (parsed.questions && Array.isArray(parsed.questions)) {
            // If questions are already structured, use them directly
            outputText = parsed.questions.join('\n')
          }
        }
      } catch (e) {
        // Not valid JSON, continue with original outputText
        console.log('outputText is not valid JSON, continuing as-is')
      }
    }
    
    // Store the raw response as a readable string
    const rawString = rawResponseData ? JSON.stringify(rawResponseData, null, 2) : outputText
    
    console.log('Extracted outputText type:', typeof outputText, 'Length:', outputText.length)
    console.log('Output text preview:', outputText.substring(0, 500))
    console.log('Full outputText:', outputText)
    
    const questions = parseQuestions(outputText)
    const summary = parseSummary(outputText, input)
    
    console.log('Parsed questions:', questions)
    console.log('Parsed summary:', summary)
    console.log('Questions count:', questions.length)

    return new Response(
      JSON.stringify({
        summary: summary,
        questions: questions,
        raw: rawString,
        debug: rawResponseData ? {
          outputTextLength: outputText.length,
          outputTextPreview: outputText.substring(0, 200),
          responseKeys: Object.keys(rawResponseData),
          hasContent: !!rawResponseData.content,
          contentType: typeof rawResponseData.content,
          isArray: Array.isArray(rawResponseData.content)
        } : {
          outputTextLength: outputText.length,
          outputTextPreview: outputText.substring(0, 200)
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
      }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Internal server error',
        details: error?.stack 
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

function parseQuestions(text: string): string[] {
  const questions: string[] = []
  
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('parseQuestions: Empty or invalid text')
    return []
  }

  console.log('parseQuestions: Parsing text of length', text.length)

  // First, try to split by numbered patterns (1., 2., etc.) and capture complete questions
  // This handles multi-line questions better
  const lines = text.split('\n')
  let currentQuestion = ''
  let questionNumber = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if this line starts a new numbered question
    const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)/)
    
    if (numberedMatch) {
      // Save previous question if it exists
      if (currentQuestion.trim().length > 10 && currentQuestion.trim().endsWith('?')) {
        const cleaned = currentQuestion.trim()
        if (!questions.includes(cleaned) && cleaned.length > 15) {
          questions.push(cleaned)
        }
      }
      
      // Start new question
      currentQuestion = numberedMatch[2]
      questionNumber = parseInt(numberedMatch[1])
    } else if (currentQuestion && line.length > 0) {
      // Continue building current question (multi-line)
      // Only add if it doesn't look like a new question starting
      if (!line.match(/^\d+[\.\)]\s/) && !line.match(/^[-•]\s/)) {
        currentQuestion += ' ' + line
      } else {
        // This looks like a new question, save current one
        if (currentQuestion.trim().length > 10 && currentQuestion.trim().endsWith('?')) {
          const cleaned = currentQuestion.trim()
          if (!questions.includes(cleaned) && cleaned.length > 15) {
            questions.push(cleaned)
          }
        }
        currentQuestion = line.replace(/^[-•]\s*/, '').trim()
      }
    }
  }
  
  // Save last question
  if (currentQuestion.trim().length > 10 && currentQuestion.trim().endsWith('?')) {
    const cleaned = currentQuestion.trim()
    if (!questions.includes(cleaned) && cleaned.length > 15) {
      questions.push(cleaned)
    }
  }

  // If we got questions from numbered pattern, ensure we have 5
  if (questions.length > 0) {
    console.log('parseQuestions: Found', questions.length, 'questions from numbered pattern')
    // If we have less than 5, try to extract more from the text
    if (questions.length < 5) {
      console.log('parseQuestions: Only found', questions.length, 'questions, trying to extract more...')
      // Try to find more questions in the remaining text
      const remainingText = text.substring(text.indexOf(questions[questions.length - 1]) + questions[questions.length - 1].length)
      const additionalMatches = remainingText.match(/(\d+[\.\)]\s*)(.+?)(?=\d+[\.\)]\s*|$)/gs)
      if (additionalMatches) {
        for (const match of additionalMatches) {
          const questionMatch = match.match(/\d+[\.\)]\s*(.+)/)
          if (questionMatch) {
            let question = questionMatch[1].trim()
            question = question.replace(/\s+/g, ' ').trim()
            if (question && question.endsWith('?') && question.length > 15) {
              if (!questions.includes(question) && questions.length < 5) {
                questions.push(question)
              }
            }
          }
        }
      }
    }
    return questions.slice(0, 5)
  }

  // Fallback: Try regex patterns for other formats
  // Pattern 1: Numbered questions (1., 2., etc.) - improved to handle multi-line
  let numberedPattern = /(\d+[\.\)]\s*)(.+?)(?=\d+[\.\)]\s*|$)/gs
  let match
  while ((match = numberedPattern.exec(text)) !== null) {
    let question = match[2]?.trim()
    // Clean up: remove extra whitespace, ensure it ends with ?
    question = question.replace(/\s+/g, ' ').trim()
    if (question && !question.endsWith('?')) {
      // Find the last ? in the question
      const lastQ = question.lastIndexOf('?')
      if (lastQ > 0) {
        question = question.substring(0, lastQ + 1)
      } else {
        continue // Skip if no ? found
      }
    }
    if (question && question.length > 15 && question.endsWith('?')) {
      if (!questions.includes(question)) {
        questions.push(question)
      }
    }
  }

  // Pattern 2: Bullet points with questions
  let bulletPattern = /[-•]\s*(.+?)(?=[-•]\s*|\d+[\.\)]\s*|$)/gs
  while ((match = bulletPattern.exec(text)) !== null) {
    let question = match[1]?.trim()
    question = question.replace(/\s+/g, ' ').trim()
    if (question && !question.endsWith('?')) {
      const lastQ = question.lastIndexOf('?')
      if (lastQ > 0) {
        question = question.substring(0, lastQ + 1)
      } else {
        continue
      }
    }
    if (question && question.length > 15 && question.endsWith('?')) {
      if (!questions.includes(question)) {
        questions.push(question)
      }
    }
  }

  // Pattern 3: Lines that are complete questions
  const allLines = text.split(/\n+/)
  for (const line of allLines) {
    const trimmed = line.trim()
    // Check if it's a complete question (starts with capital, ends with ?, reasonable length)
    if (trimmed.match(/^[A-Z]/) && trimmed.endsWith('?') && trimmed.length > 20 && trimmed.length < 300) {
      // Make sure it's not already captured
      if (!questions.some(q => q.includes(trimmed) || trimmed.includes(q))) {
        questions.push(trimmed)
      }
    }
  }

  // Final cleanup: ensure all questions are complete and well-formed
  let cleanedQuestions = questions
    .map(q => q.replace(/\s+/g, ' ').trim())
    .filter(q => {
      // Must end with ?
      if (!q.endsWith('?')) return false
      // Must be reasonable length
      if (q.length < 15 || q.length > 500) return false
      // Must not be a fragment (check for common incomplete patterns)
      if (q.match(/^(tuning|embedding|or|and|the|a|an)\s/i) && q.length < 50) return false
      return true
    })

  // If we still have less than 5 questions, try one more extraction pass
  if (cleanedQuestions.length < 5 && text) {
    console.log('parseQuestions: Only', cleanedQuestions.length, 'questions after cleanup, doing final extraction...')
    // Try a more aggressive pattern to find any remaining questions
    const aggressivePattern = /(\d+[\.\)]\s*)([^0-9\n]+?\?)/g
    let aggressiveMatch
    while ((aggressiveMatch = aggressivePattern.exec(text)) !== null && cleanedQuestions.length < 5) {
      let question = aggressiveMatch[2]?.trim()
      question = question.replace(/\s+/g, ' ').trim()
      if (question && question.endsWith('?') && question.length > 15 && question.length < 500) {
        // Check if this question is not already in our list
        const isDuplicate = cleanedQuestions.some(q => 
          q.toLowerCase().includes(question.toLowerCase().substring(0, 20)) ||
          question.toLowerCase().includes(q.toLowerCase().substring(0, 20))
        )
        if (!isDuplicate) {
          cleanedQuestions.push(question)
        }
      }
    }
  }

  // Ensure we return exactly 5 questions (pad with generic ones if needed)
  if (cleanedQuestions.length < 5) {
    console.log('parseQuestions: Warning - Only', cleanedQuestions.length, 'questions found, expected 5')
    // Add generic questions if we're missing some
    const genericQuestions = [
      'What specific time period should this research cover?',
      'What geographic region or market should be the focus?',
      'What level of detail or depth is required?',
      'Are there any specific metrics or data points needed?',
      'Should this include comparative analysis or benchmarks?'
    ]
    for (let i = cleanedQuestions.length; i < 5 && i < genericQuestions.length; i++) {
      if (!cleanedQuestions.includes(genericQuestions[i])) {
        cleanedQuestions.push(genericQuestions[i])
      }
    }
  }

  console.log('parseQuestions: Returning', cleanedQuestions.length, 'questions after final processing')
  return cleanedQuestions.slice(0, 5)
}

function parseSummary(text: string, originalInput: string): string {
  if (!text || typeof text !== 'string') {
    return `Research request: ${originalInput.substring(0, 150)}`
  }
  
  const sentences = text.split(/[.!?]+/)
  const firstSentence = sentences[0]?.trim()
  
  if (firstSentence && firstSentence.length > 50) {
    return firstSentence.substring(0, 200)
  }

  return `Research request: ${originalInput.substring(0, 150)}`
}
