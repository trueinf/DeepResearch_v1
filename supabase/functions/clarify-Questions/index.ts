// @ts-ignore - Deno runtime types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore - Deno runtime
const ANTHROPIC_API_KEY = Deno.env.get('clarify-Questions');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const instructions = `
You are an intelligent research assistant helping a user define the scope of a research query.

The user has entered an initial question or topic. 

Before starting any research, your goal is to ask **clarifying follow-up questions** that help narrow or define what kind of research is needed.

### OBJECTIVE:

Ask questions that help determine the *focus, context, and boundaries* of the research so a future agent can deliver a deep, targeted analysis.

### BEHAVIOR GUIDELINES:

- Ask **3–5 clear, specific, and insightful questions**.

- Focus on questions that:

  1. Clarify **scope or focus area** — e.g., "Do you want this research to focus on global trends or a specific country?"

  2. Define **time period or relevance** — e.g., "Should this cover the past 5 years, or include historical context?"

  3. Identify **industry, domain, or audience** — e.g., "Is the interest mainly in consumer behavior or company strategy?"

  4. Confirm **output expectations** — e.g., "Are you looking for a summary, statistical data, or actionable insights?"

  5. Explore **comparative or contextual aspects** — e.g., "Would you like this compared with competitors or benchmarks?"

- Keep each question short, conversational, and non-redundant.

- Do **not** begin doing research, analysis, or summaries.

- Avoid restating or rephrasing the user's input.

- If the user's input is already detailed and specific, ask **only 1–2 short confirmation questions.**

- Maintain a **friendly, analytical tone**, as if you're preparing for a professional research briefing.

### OUTPUT FORMAT:

Return the questions as a **numbered list**, each on a SINGLE line (do not split questions across multiple lines), for example:

1. What specific region or market should this analysis focus on?
2. Do you want the data from the past 5 years or more recent trends?
3. Should the research include financial or competitive metrics?

CRITICAL REQUIREMENTS:
- Each question must be COMPLETE and on a SINGLE line
- Each question must end with a question mark (?)
- Each question must be a full, grammatically complete sentence
- Do NOT split questions across multiple lines
- Do NOT include any introduction or closing remarks
- Only return the numbered questions, one per line
`;
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
  try {
    const { input } = await req.json();
    if (!input) {
      return new Response(JSON.stringify({
        error: 'Input is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({
        error: 'clarify-Questions secret not configured'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `${instructions}\n\nUser input: ${input}`
          }
        ]
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch  {
        errorData = {
          message: errorText
        };
      }
      console.error('Anthropic API error:', response.status, errorData);
      return new Response(JSON.stringify({
        error: 'Failed to get clarification from Anthropic',
        status: response.status,
        details: errorData
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    const data = await response.json();
    console.log('Full Anthropic response:', JSON.stringify(data, null, 2));
    console.log('Response keys:', Object.keys(data));
    let outputText = '';
    let rawResponse = data;
    // Anthropic Messages API structure: content[0].text
    if (data.content && Array.isArray(data.content)) {
      outputText = data.content.filter((item)=>item.type === 'text').map((item)=>item.text).join('\n\n');
    } else if (data.text) {
      outputText = String(data.text);
    } else {
      outputText = JSON.stringify(data, null, 2);
    }
    // Ensure outputText is always a string
    outputText = String(outputText || '').trim();
    // If outputText looks like JSON, try to parse it and extract text
    if (outputText.startsWith('{') || outputText.startsWith('[')) {
      try {
        const parsed = JSON.parse(outputText);
        // If it's an object with text/content fields, extract them
        if (parsed && typeof parsed === 'object') {
          const textFromJson = parsed.text || parsed.content || parsed.message || parsed.response;
          if (textFromJson && typeof textFromJson === 'string' && textFromJson.length > 10) {
            outputText = textFromJson;
          } else if (parsed.questions && Array.isArray(parsed.questions)) {
            // If questions are already structured, use them directly
            outputText = parsed.questions.join('\n');
          }
        }
      } catch (e) {
        // Not valid JSON, continue with original outputText
        console.log('outputText is not valid JSON, continuing as-is');
      }
    }
    // Store the raw response as a readable string
    const rawString = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse, null, 2);
    console.log('Extracted outputText type:', typeof outputText, 'Length:', outputText.length);
    console.log('Output text preview:', outputText.substring(0, 500));
    console.log('Full outputText:', outputText);
    const questions = parseQuestions(outputText);
    const summary = parseSummary(outputText, input);
    console.log('Parsed questions:', questions);
    console.log('Parsed summary:', summary);
    console.log('Questions count:', questions.length);
    return new Response(JSON.stringify({
      summary: summary,
      questions: questions,
      raw: rawString,
      debug: {
        outputTextLength: outputText.length,
        outputTextPreview: outputText.substring(0, 200),
        responseKeys: Object.keys(data),
        hasContent: !!data.content,
        contentType: typeof data.content,
        isArray: Array.isArray(data.content)
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error?.message || 'Internal server error',
      details: error?.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});
function parseQuestions(text: string): string[] {
  const questions: string[] = [];
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('parseQuestions: Empty or invalid text');
    return [];
  }
  console.log('parseQuestions: Parsing text of length', text.length);
  // First, try to split by numbered patterns (1., 2., etc.) and capture complete questions
  // This handles multi-line questions better
  const lines = text.split('\n');
  let currentQuestion = '';
  let questionNumber = 0;
  for(let i = 0; i < lines.length; i++){
    const line = lines[i].trim();
    // Check if this line starts a new numbered question
    const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)/);
    if (numberedMatch) {
      // Save previous question if it exists
      if (currentQuestion.trim().length > 10 && currentQuestion.trim().endsWith('?')) {
        const cleaned = currentQuestion.trim();
        if (!questions.includes(cleaned) && cleaned.length > 15) {
          questions.push(cleaned);
        }
      }
      // Start new question
      currentQuestion = numberedMatch[2];
      questionNumber = parseInt(numberedMatch[1]);
    } else if (currentQuestion && line.length > 0) {
      // Continue building current question (multi-line)
      // Only add if it doesn't look like a new question starting
      if (!line.match(/^\d+[\.\)]\s/) && !line.match(/^[-•]\s/)) {
        currentQuestion += ' ' + line;
      } else {
        // This looks like a new question, save current one
        if (currentQuestion.trim().length > 10 && currentQuestion.trim().endsWith('?')) {
          const cleaned = currentQuestion.trim();
          if (!questions.includes(cleaned) && cleaned.length > 15) {
            questions.push(cleaned);
          }
        }
        currentQuestion = line.replace(/^[-•]\s*/, '').trim();
      }
    }
  }
  // Save last question
  if (currentQuestion.trim().length > 10 && currentQuestion.trim().endsWith('?')) {
    const cleaned = currentQuestion.trim();
    if (!questions.includes(cleaned) && cleaned.length > 15) {
      questions.push(cleaned);
    }
  }
  // If we got questions from numbered pattern, return them
  if (questions.length > 0) {
    console.log('parseQuestions: Found', questions.length, 'questions from numbered pattern');
    return questions.slice(0, 5);
  }
  // Fallback: Try regex patterns for other formats
  // Pattern 1: Numbered questions (1., 2., etc.) - improved to handle multi-line
  let numberedPattern = /(\d+[\.\)]\s*)(.+?)(?=\d+[\.\)]\s*|$)/gs;
  let match;
  while((match = numberedPattern.exec(text)) !== null){
    let question = match[2]?.trim();
    // Clean up: remove extra whitespace, ensure it ends with ?
    question = question.replace(/\s+/g, ' ').trim();
    if (question && !question.endsWith('?')) {
      // Find the last ? in the question
      const lastQ = question.lastIndexOf('?');
      if (lastQ > 0) {
        question = question.substring(0, lastQ + 1);
      } else {
        continue; // Skip if no ? found
      }
    }
    if (question && question.length > 15 && question.endsWith('?')) {
      if (!questions.includes(question)) {
        questions.push(question);
      }
    }
  }
  // Pattern 2: Bullet points with questions
  let bulletPattern = /[-•]\s*(.+?)(?=[-•]\s*|\d+[\.\)]\s*|$)/gs;
  while((match = bulletPattern.exec(text)) !== null){
    let question = match[1]?.trim();
    question = question.replace(/\s+/g, ' ').trim();
    if (question && !question.endsWith('?')) {
      const lastQ = question.lastIndexOf('?');
      if (lastQ > 0) {
        question = question.substring(0, lastQ + 1);
      } else {
        continue;
      }
    }
    if (question && question.length > 15 && question.endsWith('?')) {
      if (!questions.includes(question)) {
        questions.push(question);
      }
    }
  }
  // Pattern 3: Lines that are complete questions
  const allLines = text.split(/\n+/);
  for (const line of allLines){
    const trimmed = line.trim();
    // Check if it's a complete question (starts with capital, ends with ?, reasonable length)
    if (trimmed.match(/^[A-Z]/) && trimmed.endsWith('?') && trimmed.length > 20 && trimmed.length < 300) {
      // Make sure it's not already captured
      if (!questions.some((q)=>q.includes(trimmed) || trimmed.includes(q))) {
        questions.push(trimmed);
      }
    }
  }
  // Final cleanup: ensure all questions are complete and well-formed
  const cleanedQuestions = questions.map((q)=>q.replace(/\s+/g, ' ').trim()).filter((q)=>{
    // Must end with ?
    if (!q.endsWith('?')) return false;
    // Must be reasonable length
    if (q.length < 15 || q.length > 500) return false;
    // Must not be a fragment (check for common incomplete patterns)
    if (q.match(/^(tuning|embedding|or|and|the|a|an)\s/i) && q.length < 50) return false;
    return true;
  }).slice(0, 5);
  console.log('parseQuestions: Found', cleanedQuestions.length, 'questions after cleanup');
  return cleanedQuestions;
}
function parseSummary(text, originalInput) {
  if (!text || typeof text !== 'string') {
    return `Research request: ${originalInput.substring(0, 150)}`;
  }
  const sentences = text.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim();
  if (firstSentence && firstSentence.length > 50) {
    return firstSentence.substring(0, 200);
  }
  return `Research request: ${originalInput.substring(0, 150)}`;
}
