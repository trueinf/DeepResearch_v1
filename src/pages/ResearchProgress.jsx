import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { ArrowLeft, Square, CheckCircle, Circle, Loader2 } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const steps = [
  { id: 'planning', label: 'Planning', message: 'Analyzing research requirements...' },
  { id: 'searching', label: 'Searching', message: 'Gathering relevant sources...' },
  { id: 'synthesizing', label: 'Synthesizing', message: 'Analyzing and connecting findings...' },
  { id: 'finalizing', label: 'Finalizing', message: 'Preparing final report...' }
]

const stepMap = {
  planning: 0,
  searching: 1,
  synthesizing: 2,
  finalizing: 3
}

export default function ResearchProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { getResearch, updateResearchStatus, setResearchReport } = useResearch()
  
  const research = getResearch(id)
  const refinedBrief = location.state?.refinedBrief || research?.topic
  const [currentStep, setCurrentStep] = useState(0)
  const [currentMessage, setCurrentMessage] = useState('')
  const [isStopped, setIsStopped] = useState(false)
  const [rateLimitCountdown, setRateLimitCountdown] = useState(null) // { seconds: number, initialSeconds: number, attempt: number, total: number }
  const hasStartedRef = useRef(false) // Prevent duplicate requests

  useEffect(() => {
    console.log('ResearchProgress useEffect triggered', { 
      research: research?.id, 
      status: research?.status, 
      isStopped, 
      hasStarted: hasStartedRef.current,
      refinedBrief: refinedBrief?.substring(0, 50)
    })

    if (!research || research.status !== 'In Progress') {
      console.log('Skipping: research not found or status not "In Progress"', { 
        hasResearch: !!research, 
        status: research?.status 
      })
      return
    }

    if (isStopped) {
      console.log('Skipping: research stopped')
      updateResearchStatus(id, 'Failed')
      return
    }

    // Prevent duplicate requests
    if (hasStartedRef.current) {
      console.log('Skipping: request already started')
      return
    }
    hasStartedRef.current = true

    // Use fetch with streaming instead of EventSource for better CORS support
    const controller = new AbortController()
    const signal = controller.signal

    const performResearch = async () => {
      // First, try to get clarifyingAnswers from location.state
      let clarifyingAnswers = location.state?.clarifyingAnswers || ''
      
      // Parse refinedBrief to extract originalQuery and clarifyingAnswers
      let originalQuery = refinedBrief || research?.topic || ''
      
      // If clarifyingAnswers not in state, try to parse from refinedBrief
      if (!clarifyingAnswers && refinedBrief && refinedBrief.includes('Research topic:')) {
        const topicMatch = refinedBrief.match(/Research topic:\s*(.+?)(?:\n|$)/i)
        if (topicMatch) {
          originalQuery = topicMatch[1].trim()
        }
        
        const clarificationsMatch = refinedBrief.match(/Clarifications:\s*([\s\S]+?)(?:\n\nPlease conduct|$)/i)
        if (clarificationsMatch) {
          clarifyingAnswers = clarificationsMatch[1].trim()
        }
      }
      
      // Also check research.options.clarifyingAnswers as fallback
      if (!clarifyingAnswers && research?.options?.clarifyingAnswers) {
        // Handle both string and array formats
        if (typeof research.options.clarifyingAnswers === 'string') {
          clarifyingAnswers = research.options.clarifyingAnswers
        } else if (Array.isArray(research.options.clarifyingAnswers)) {
          clarifyingAnswers = research.options.clarifyingAnswers.map((qa, i) => 
            typeof qa === 'string' ? qa : `${qa.question || ''}: ${qa.answer || ''}`
          ).join('\n')
        } else if (typeof research.options.clarifyingAnswers === 'object') {
          // Handle object format
          clarifyingAnswers = JSON.stringify(research.options.clarifyingAnswers)
        }
      }
      
      // Ensure clarifyingAnswers is always a string
      if (clarifyingAnswers && typeof clarifyingAnswers !== 'string') {
        clarifyingAnswers = String(clarifyingAnswers)
      }
      if (!clarifyingAnswers) {
        clarifyingAnswers = ''
      }
      
      // Fallback: use research.topic if originalQuery is still empty
      if (!originalQuery || originalQuery.trim() === '') {
        originalQuery = research?.topic || ''
      }
      
      // Validate that we have a query
      if (!originalQuery || originalQuery.trim() === '') {
        console.error('No research query available:', { refinedBrief, researchTopic: research?.topic })
        updateResearchStatus(id, 'Failed')
        alert('Error: No research topic found. Please go back and try again.')
        navigate('/')
        return
      }
      
      console.log('Starting deep research with:', { 
        originalQuery: typeof originalQuery === 'string' ? originalQuery.substring(0, 100) : '', 
        clarifyingAnswers: typeof clarifyingAnswers === 'string' ? clarifyingAnswers.substring(0, 100) : '', 
        researchId: id,
        hasClarifyingAnswers: !!clarifyingAnswers
      })
      
      // Update progress steps
      setCurrentStep(0)
      setCurrentMessage('Analyzing research requirements...')
      
      try {
        // Update progress immediately without delays
        setCurrentStep(1)
        setCurrentMessage('Gathering relevant sources...')
        
        // Call deep-Research-gemini function immediately
        setCurrentStep(2)
        setCurrentMessage('Analyzing and connecting findings...')
        
        const startTime = Date.now()
        const researchModel = research?.model || location.state?.model || 'gemini-2.5-flash'
        const documentContext = location.state?.documentContext || null
        const ingestedContent = location.state?.ingestedContent || null
        
        // Use deep-Research-gemini for both Gemini and Claude (it now supports both end-to-end)
        const functionName = 'deep-Research-gemini'
        
        console.log('Starting deep research API call...', {
          url: `${SUPABASE_URL}/functions/v1/${functionName}`,
          originalQuery: originalQuery?.substring(0, 50),
          researchId: id,
          model: researchModel,
          hasIngestedContent: !!ingestedContent
        })
        
        const researchMode = location.state?.researchMode || 'comprehensive'
        
        // Use let so we can update model for fallback
        let requestBody = {
          originalQuery: originalQuery,
          clarifyingAnswers: clarifyingAnswers || 'No specific clarifications provided.',
          researchId: id,
          model: researchModel,
          documentContext: documentContext,
          ingestedContent: ingestedContent, // Pass structured content from ingestion agent
          mode: researchMode
        }
        
        console.log('Request payload:', {
          originalQuery: typeof requestBody.originalQuery === 'string' ? requestBody.originalQuery.substring(0, 100) : '',
          originalQueryLength: typeof requestBody.originalQuery === 'string' ? requestBody.originalQuery.length : 0,
          hasOriginalQuery: !!requestBody.originalQuery,
          clarifyingAnswers: typeof requestBody.clarifyingAnswers === 'string' ? requestBody.clarifyingAnswers.substring(0, 50) : '',
          researchId: requestBody.researchId,
          model: requestBody.model
        })
        
        // Simple retry logic for non-rate-limit errors only
        const maxRetries = 2 // Reduced retries since we're not handling rate limits
        let retryCount = 0
        let response = null
        let lastError = null
        
        // Proactive throttling: Add delay before request to avoid hitting rate limits
        // This helps prevent rate limits instead of just reacting to them
        const THROTTLE_DELAY = 5000 // 5 seconds delay before request (increased to reduce rate limit hits)
        console.log(`⏳ Throttling: Waiting ${THROTTLE_DELAY / 1000}s before API call to avoid rate limits...`)
        setCurrentMessage('Preparing research request...')
        await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY))
        
        while (retryCount <= maxRetries) {
          try {
            response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
              },
              body: JSON.stringify(requestBody),
              signal
            })

            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
            console.log(`Response received after ${elapsedTime}s (attempt ${retryCount + 1}):`, {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              headers: Object.fromEntries(response.headers.entries())
            })

            // Parse response body to check for errors (even with 200 status)
            let responseData = null
            let responseText = ''
            try {
              responseText = await response.text()
              if (responseText) {
                responseData = JSON.parse(responseText)
              }
            } catch (parseError) {
              // If parsing fails, continue with normal error handling
              console.warn('Failed to parse response:', parseError)
            }

            // Check if response body contains any error (even with 200 status)
            if (responseData) {
              // Log full response for debugging
              console.log('Deep research API response:', {
                status: responseData.status,
                hasError: !!responseData.error,
                error: responseData.error,
                hasReport: !!responseData.report,
                statusCode: responseData.statusCode,
                details: responseData.details
              })
              
              // Check for rate limit errors - fail immediately (no retries)
              if (responseData.status === 429 || (responseData.error && (responseData.error.includes('Rate limit') || responseData.error.includes('rate limit') || responseData.error.includes('429')))) {
                setRateLimitCountdown(null)
                throw new Error('Rate limit exceeded. Please wait a moment and try again, or switch to a different model.')
              }
              
              // Check for other errors in response body
              if (responseData.error && responseData.status !== 'completed') {
                const errorMsg = responseData.error || 'Research failed'
                const errorDetails = responseData.details || {}
                const statusCode = responseData.statusCode || responseData.status
                
                console.error('Deep research API returned error:', {
                  error: errorMsg,
                  status: responseData.status,
                  statusCode: statusCode,
                  details: errorDetails,
                  fullResponse: responseData
                })
                
                // Build more descriptive error message
                let descriptiveError = errorMsg
                
                // Extract API error message if available
                if (errorDetails && typeof errorDetails === 'object') {
                  // Check for nested error messages
                  const apiError = errorDetails.apiError || errorDetails.error || errorDetails
                  const apiErrorMsg = apiError?.error?.message || apiError?.message || apiError
                  
                  if (apiErrorMsg && typeof apiErrorMsg === 'string' && apiErrorMsg !== errorMsg) {
                    descriptiveError = `${errorMsg}: ${apiErrorMsg}`
                  } else {
                    // Fallback to showing key details
                    const detailStr = Object.entries(errorDetails)
                      .filter(([key]) => !['apiError', 'error', 'model', 'triedModels'].includes(key))
                      .map(([key, value]) => {
                        if (typeof value === 'object') {
                          return `${key}: ${JSON.stringify(value).substring(0, 100)}`
                        }
                        return `${key}: ${value}`
                      })
                      .join(', ')
                    if (detailStr) {
                      descriptiveError = `${errorMsg} (${detailStr})`
                    }
                  }
                  
                  // Add tried models info if available
                  if (errorDetails.triedModels && Array.isArray(errorDetails.triedModels)) {
                    descriptiveError += ` (tried models: ${errorDetails.triedModels.join(', ')})`
                  }
                }
                
                throw new Error(descriptiveError)
              }
              
              // If completed successfully, store data and break
              if (responseData.status === 'completed' && responseData.report) {
                response._parsedData = responseData
                break
              }
            }

            // If response.ok but no valid data, treat as error
            if (response.ok && !responseData) {
              throw new Error('Invalid response format from server')
            }

            // Handle rate limit errors - fail immediately (no retries)
            if (response.status === 429) {
              setRateLimitCountdown(null)
              throw new Error('Rate limit exceeded. Please wait a moment and try again, or switch to a different model.')
            }

            // For other errors, handle normally
            // Use already parsed responseData if available
            let errorData = responseData || { error: `HTTP error! status: ${response.status}` }
            if (!responseData && responseText) {
              try {
                errorData = JSON.parse(responseText)
              } catch {
                errorData = { error: responseText || `HTTP error! status: ${response.status}` }
              }
            }
            
            console.error('Deep research error:', {
              status: response.status,
              statusText: response.statusText,
              errorData: errorData,
              errorText: errorText,
              url: `${SUPABASE_URL}/functions/v1/${functionName}`,
              functionName: functionName,
              supabaseUrl: SUPABASE_URL
            })
            
            // Check if it's a function not found error
            if (response.status === 404 || errorText.includes('not found') || errorText.includes('404')) {
              throw new Error(`Edge function "${functionName}" not found. Please ensure the function is deployed to Supabase.`)
            }
            
            // Check if it's a CORS error
            if (errorText.includes('CORS') || errorText.includes('cors')) {
              throw new Error('CORS error. Please check your Supabase configuration and ensure the edge function allows CORS.')
            }
            
            // Extract detailed error message
            let errorMessage = errorData.error || errorData.message || `HTTP error! status: ${response.status}`
            
            // Check for API-specific errors in details
            if (errorData.details?.error?.message) {
              errorMessage = errorData.details.error.message
            } else if (errorData.details?.message) {
              errorMessage = errorData.details.message
            }
            
            // Add helpful suggestions for common errors
            if (errorMessage.includes('credit') || errorMessage.includes('balance') || errorMessage.includes('billing')) {
              errorMessage = `${errorMessage}\n\n💡 Tip: Try switching to Gemini model (gemini-3-pro) which may have different billing requirements. You can change the model in the top bar.`
            } else if (errorMessage.includes('API key')) {
              errorMessage = `${errorMessage}\n\n💡 Tip: Check your Supabase Edge Function secrets to ensure the API key is configured correctly.`
            }
            
            throw new Error(errorMessage)
          } catch (fetchError) {
            // If it's an abort error, don't retry
            if (fetchError.name === 'AbortError') {
              throw fetchError
            }
            
            // If it's a rate limit error - fail immediately (no retries)
            if (fetchError.message?.includes('Rate limit') || fetchError.message?.includes('429')) {
              setRateLimitCountdown(null)
              throw new Error('Rate limit exceeded. Please wait a moment and try again, or switch to a different model.')
            }
            
            // For other errors or max retries reached, throw
            throw fetchError
          }
        }
        
        // If we get here and response is not ok, handle it
        if (!response || !response.ok) {
          throw new Error('Request failed after retries')
        }

        // Step 3: Finalizing
        setCurrentStep(3)
        setCurrentMessage('Preparing final report...')

        // Use parsed data from response or parse it now
        const data = response._parsedData || await response.json()
        console.log('Deep research completed:', data)

        if (data.status === 'completed' && data.report) {
          const report = data.report
          
          console.log('Saving research report:', {
            hasKeyFindings: !!report.keyFindings,
            hasSources: !!report.sources,
            hasExecutiveSummary: !!report.executiveSummary,
            hasDetailedAnalysis: !!report.detailedAnalysis,
            hasInsights: !!report.insights,
            hasConclusion: !!report.conclusion
          })
          
          await setResearchReport(id, {
            topic: research.topic,
            keyFindings: report.keyFindings || [],
            sources: report.sources || [],
            executiveSummary: report.executiveSummary || null,
            detailedAnalysis: report.detailedAnalysis || null,
            insights: report.insights || null,
            conclusion: report.conclusion || null,
            universalResearchOutput: data.universalReport ? JSON.stringify(data.universalReport) : (data.universalResearchOutput || null),
            universalReport: data.universalReport || null, // Store as object for easy access
            metadata: report.metadata || null
          })
          
          navigate(`/report/${id}`)
        } else {
          console.error('Research response missing report:', data)
          throw new Error(data.error || 'Research failed to complete - no report generated')
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Request aborted (expected if component unmounts)')
          return
        }
        console.error('Research error:', error)
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        updateResearchStatus(id, 'Failed')
        
        // Show more helpful error message
        const errorMsg = error.message || 'Unknown error'
        let userMessage = errorMsg
        
        // Format the error message for better readability
        if (errorMsg.includes('Rate limit') || errorMsg.includes('rate limit') || errorMsg.includes('429')) {
          userMessage = `⏱️ Rate Limit Exceeded\n\nThe Gemini API has rate-limited your requests. This usually means:\n\n• Too many requests in a short time\n• API quota/limits reached\n• Multiple research processes running simultaneously\n\n💡 Solutions:\n1. Wait 2-3 minutes and try again (rate limits reset per minute)\n2. Check your Gemini API quota at: https://aistudio.google.com/app/apikey\n3. Switch to a different model (use model selector in top bar)\n4. Try a simpler or shorter research query\n5. Avoid running multiple research processes at once`
        } else if (errorMsg.includes('credit') || errorMsg.includes('balance') || errorMsg.includes('billing')) {
          userMessage = `❌ ${errorMsg}\n\n💡 Suggestion: Your Anthropic API account has insufficient credits. You can:\n1. Add credits to your Anthropic account, or\n2. Switch to Gemini model (use the model selector in the top bar)`
        } else if (errorMsg.includes('timeout')) {
          userMessage = '⏱️ Research timed out. The query might be too complex. Try a simpler query or check your API keys.'
        } else if (errorMsg.includes('API key')) {
          userMessage = `🔑 ${errorMsg}\n\n💡 Please check your API key configuration in Supabase Edge Function secrets.`
        } else if (errorMsg.includes('CORS')) {
          userMessage = '🌐 CORS error. Please check that the Edge Function is properly deployed.'
        } else {
          userMessage = `Research failed: ${errorMsg}`
        }
        
        alert(`${userMessage}\n\nCheck browser console (F12) for detailed error information.`)
      } finally {
        console.log('Research process completed')
      }
    }

    console.log('Calling performResearch()')
    performResearch()

    return () => {
      console.log('Cleanup: aborting request and resetting hasStartedRef')
      controller.abort()
      hasStartedRef.current = false
    }
  }, [id, research?.status, refinedBrief, isStopped, updateResearchStatus, setResearchReport, navigate])

  if (!research) {
    return (
      <div className="pt-16 min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <p className="text-[#666666]">Research not found</p>
      </div>
    )
  }

  const handleStop = () => {
    setIsStopped(true)
    updateResearchStatus(id, 'Failed')
    setTimeout(() => navigate('/'), 2000)
  }

  return (
    <div className="pt-16 min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="max-w-2xl w-full px-6 py-12">
        <div className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl font-bold text-[#000000] mb-3">
            Research in Progress
          </h1>
          <p className="text-[#666666] text-base">Please wait while we gather and analyze information...</p>
        </div>

        {/* Rate Limit Countdown Banner */}
        {rateLimitCountdown && (
          <div className="mb-6 bg-white border border-[#dddddd] rounded-lg p-6 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[#666666] animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-[#000000] text-base">Rate Limit Reached</h3>
                  <p className="text-[#666666] text-sm">
                    Automatically retrying in <span className="font-bold text-[#000000]">{rateLimitCountdown.seconds}</span> seconds
                    <span className="ml-2 text-xs">(Attempt {rateLimitCountdown.attempt}/{rateLimitCountdown.total})</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#000000]">{rateLimitCountdown.seconds}s</div>
                <div className="text-xs text-[#666666] mt-1">Please wait...</div>
              </div>
            </div>
            <div className="mt-4 bg-[#f0f0f0] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#000000] h-1.5 rounded-full transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${((rateLimitCountdown.initialSeconds - rateLimitCountdown.seconds) / rateLimitCountdown.initialSeconds) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-8 mb-6 animate-fadeIn">
          <div className="space-y-6">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep
              const isPending = index > currentStep

              return (
                <div 
                  key={step.id} 
                  className="flex items-start gap-4 animate-fadeIn"
                  style={{ animationDelay: `${0.1 * index}s`, animationFillMode: 'both' }}
                >
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full bg-[#000000] flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="w-10 h-10 rounded-full bg-[#333333] flex items-center justify-center shadow-sm">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-[#000000] bg-white flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border border-[#000000]"></div>
                      </div>
                    )}
                    {index < steps.length - 1 && (
                      <div 
                        className={`mt-2 h-16 w-0.5 transition-all duration-500 ${
                          isCompleted ? 'bg-[#000000]' : 'bg-[#e0e0e0]'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className={`font-bold text-base mb-1 transition-all duration-300 ${
                      isActive ? 'text-[#000000]' : isCompleted ? 'text-[#000000]' : 'text-[#999999]'
                    }`}>
                      {step.label}
                    </h3>
                    {isActive && (
                      <p className="text-sm text-[#666666] font-normal animate-fadeIn leading-relaxed mt-1">
                        {currentMessage || step.message}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 text-[#666666] hover:text-[#000000] transition-all duration-200 group text-sm font-normal"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </button>
          <button
            onClick={handleStop}
            disabled={isStopped}
            className="flex items-center gap-2 px-6 py-3 bg-[#f0f0f0] text-[#000000] border border-[#dddddd] rounded-lg font-medium hover:bg-[#e0e0e0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-4 h-4" />
            Stop Research
          </button>
        </div>
      </div>
    </div>
  )
}

