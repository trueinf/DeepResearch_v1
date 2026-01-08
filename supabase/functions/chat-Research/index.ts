// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// @ts-ignore - Deno runtime
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

interface ChatRequest {
  question: string
  report: {
    topic: string
    executiveSummary?: string | null
    detailedAnalysis?: string | null
    keyFindings?: Array<{ text: string; citations: number[] }>
    insights?: string | null
    conclusion?: string | null
    metadata?: string | null
  }
  clarifyingAnswers?: Array<{ question: string; answer: string }> | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function cleanAnswer(text: string): string {
  if (!text) return text
  
  // Remove markdown formatting
  text = text
    .replace(/^#+\s*/gm, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/^[-*•]\s+/gm, '') // Remove bullet points
    .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
    .trim()

  // Remove common introductory phrases
  const introPhrases = [
    /^Based on the research report[,:]?\s*/i,
    /^According to the research report[,:]?\s*/i,
    /^The research report (indicates|shows|states|mentions|suggests)[,:]?\s*/i,
    /^According to the report[,:]?\s*/i,
    /^Based on the report[,:]?\s*/i,
  ]
  
  for (const phrase of introPhrases) {
    text = text.replace(phrase, '')
  }

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  
  // Limit to maximum 4 sentences
  if (sentences.length > 4) {
    text = sentences.slice(0, 4).join(' ').trim()
  } else {
    text = sentences.join(' ').trim()
  }

  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
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
    const requestBody = await req.json()
    console.log('Chat request received:', { 
      hasQuestion: !!requestBody.question,
      hasReport: !!requestBody.report,
      reportKeys: requestBody.report ? Object.keys(requestBody.report) : []
    })

    const { question, report, clarifyingAnswers } = requestBody as ChatRequest

    if (!question || !question.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

    if (!report || !report.topic) {
      return new Response(
        JSON.stringify({ error: 'Report data is required. Report must include at least a topic.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      )
    }

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

    // Build the research report context
    let reportContext = `Research Topic: ${report.topic}\n\n`
    
    // Add clarifying answers context if available
    if (clarifyingAnswers && Array.isArray(clarifyingAnswers) && clarifyingAnswers.length > 0) {
      reportContext += `Original Research Context (User's Clarifications):\n`
      clarifyingAnswers.forEach((qa, idx) => {
        if (qa && qa.question && qa.answer) {
          reportContext += `${idx + 1}. Q: ${qa.question}\n   A: ${qa.answer}\n`
        }
      })
      reportContext += `\n`
    }
    
    if (report.executiveSummary && report.executiveSummary.trim()) {
      reportContext += `Executive Summary:\n${report.executiveSummary}\n\n`
    }
    
    if (report.detailedAnalysis && report.detailedAnalysis.trim()) {
      reportContext += `Detailed Analysis:\n${report.detailedAnalysis}\n\n`
    }
    
    if (report.keyFindings && Array.isArray(report.keyFindings) && report.keyFindings.length > 0) {
      reportContext += `Key Findings:\n`
      report.keyFindings.forEach((finding, idx) => {
        if (finding && finding.text && finding.text.trim()) {
          reportContext += `${idx + 1}. ${finding.text}\n`
        }
      })
      reportContext += `\n`
    }
    
    if (report.insights && report.insights.trim()) {
      reportContext += `Insights and Implications:\n${report.insights}\n\n`
    }
    
    if (report.conclusion && report.conclusion.trim()) {
      reportContext += `Conclusion:\n${report.conclusion}\n\n`
    }

    // If no report content, return error
    if (reportContext.trim() === `Research Topic: ${report.topic}`) {
      return new Response(
        JSON.stringify({ 
          error: 'Report has no content to answer questions from. Please ensure the research report is complete.' 
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

    const chatPrompt = `Answer the question below using ONLY information from the research report. Your answer must be EXACTLY 2-4 sentences. NO exceptions.

STRICT RULES:
1. Maximum 4 sentences - NO MORE
2. NO paragraphs, NO bullet points, NO lists, NO markdown formatting
3. NO introductory phrases (do NOT say "Based on the research report" or similar)
4. NO repetition of the question
5. NO background context or explanations
6. Get straight to the answer - first sentence should directly answer the question
7. If information is missing, say: "This information is not available in the report."

FORMAT EXAMPLE:
Question: "What is the population?"
Good Answer: "The population is 1.4 billion people. This represents a 12% increase from 2010. The growth rate has slowed in recent years."
Bad Answer: "Based on the research report, the population data shows that... [long paragraph with details]"

RESEARCH REPORT:
${reportContext}

USER QUESTION: ${question}

Answer (2-4 sentences only, no formatting):`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: chatPrompt }]
        }],
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
      
      console.error('Gemini API error:', response.status, errorData)
      
      let errorMessage = 'Failed to get answer from Gemini'
      if (response.status === 401) {
        errorMessage = 'Invalid Gemini API key. Please check your API key configuration.'
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.'
      } else if (response.status >= 500) {
        errorMessage = 'Gemini API server error. Please try again later.'
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: response.status,
          details: errorData 
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
    let answer = ''
    
    // Gemini API response structure: candidates[0].content.parts[0].text
    if (data.candidates && Array.isArray(data.candidates) && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
        answer = candidate.content.parts
          .filter((part: any) => part.text)
          .map((part: any) => part.text)
          .join(' ')
      }
    } else if (data.text) {
      answer = String(data.text)
    } else {
      answer = JSON.stringify(data, null, 2)
    }

    if (!answer || answer.trim().length === 0) {
      answer = "This information is not available in the report."
    } else {
      // Clean up the answer to ensure it's concise
      answer = cleanAnswer(answer)
    }

    return new Response(
      JSON.stringify({
        answer: answer.trim()
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

