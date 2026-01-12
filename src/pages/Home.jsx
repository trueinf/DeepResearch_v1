import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { Clock, CheckCircle, Loader2, Zap, BarChart3, Users, Cpu, ArrowRight, Filter, Grid3x3, MoreVertical, Upload, File, X, Pencil, Trash2, Search, ChevronDown } from 'lucide-react'
import ClarifyQuestions from '../components/ClarifyQuestions'
import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function Home({ selectedModel = 'gemini-2.5-flash' }) {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('new')
  const [depth, setDepth] = useState('light')
  const [showClarify, setShowClarify] = useState(false)
  const [clarifyData, setClarifyData] = useState(null)
  const [isClarifying, setIsClarifying] = useState(false)
  
  // Force gemini-2.5-flash if pro is passed
  const safeSelectedModel = selectedModel === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : (selectedModel || 'gemini-2.5-flash')
  const [model, setModel] = useState(safeSelectedModel)
  
  // Sync model state with selectedModel prop when it changes, but never allow pro
  useEffect(() => {
    const safeModel = selectedModel === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : (selectedModel || 'gemini-2.5-flash')
    setModel(safeModel)
  }, [selectedModel])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [ingestedContent, setIngestedContent] = useState(null) // Store structured content from ingestion agent
  const [isIngesting, setIsIngesting] = useState(false)
  const [weeklyTokens, setWeeklyTokens] = useState(0)
  const [weeklyCost, setWeeklyCost] = useState(0)
  const [totalSources, setTotalSources] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResearch, setEditingResearch] = useState(null)
  const [editQuery, setEditQuery] = useState('')
  
  const navigate = useNavigate()
  const { researches, createResearch, loading, updateResearchStatus, deleteResearch } = useResearch()
  
  const ongoingResearches = Array.isArray(researches) 
    ? researches.filter(r => r.status === 'In Progress')
    : []
  const completedResearches = Array.isArray(researches)
    ? researches.filter(r => r.status === 'Done')
    : []

  // Fetch weekly token usage and sources from Supabase from Supabase
  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        // Fetch weekly token usage
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        let totalTokens = 0
        let totalCost = 0
        
        // Try multiple strategies to fetch token usage (RLS might be blocking)
        if (user) {
          // Strategy 1: Query with user_id filter
          let { data: tokenData, error: tokenError } = await supabase
            .from('token_usage')
            .select('total_tokens, total_cost_usd, created_at, user_id')
            .eq('user_id', user.id)
            .gte('created_at', oneWeekAgo.toISOString())
          
          // Strategy 2: If no data or error, try without user filter (may work if RLS allows)
          if (tokenError || !tokenData || tokenData.length === 0) {
            console.log('⚠️ No data with user filter, trying without user filter...')
            const { data: allData, error: allError } = await supabase
              .from('token_usage')
              .select('total_tokens, total_cost_usd, created_at, user_id')
              .gte('created_at', oneWeekAgo.toISOString())
            
            if (!allError && allData && allData.length > 0) {
              // Filter client-side to get user's data
              const userData = allData.filter(r => r.user_id === user.id)
              if (userData.length > 0) {
                tokenData = userData
                tokenError = null
                console.log('✅ Found', userData.length, 'records for user (client-side filtered)')
              } else {
                // Show all data if no user-specific data (for debugging)
                tokenData = allData
                tokenError = null
                console.log('⚠️ No user-specific data, showing all records:', allData.length)
              }
            } else if (allError) {
              console.log('⚠️ Query without user filter also failed:', allError.message)
            }
          }
          
          if (tokenError) {
            console.error('❌ Error fetching token usage:', tokenError)
            if (tokenError.code === 'PGRST301' || tokenError.message?.includes('permission') || tokenError.message?.includes('RLS')) {
              console.log('⚠️ RLS policy is blocking token usage access')
              console.log('💡 Run this SQL in Supabase SQL Editor to fix:')
              console.log('   DROP POLICY IF EXISTS "Users can view own token usage" ON token_usage;')
              console.log('   CREATE POLICY "Users can view token usage" ON token_usage FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR true);')
            }
          } else if (tokenData && tokenData.length > 0) {
            totalTokens = tokenData.reduce((sum, record) => sum + (record.total_tokens || 0), 0) || 0
            totalCost = tokenData.reduce((sum, record) => sum + (Number(record.total_cost_usd) || 0), 0) || 0
            console.log('✅ Token usage fetched:', {
              tokens: totalTokens,
              cost: totalCost,
              records: tokenData.length,
              userId: user.id
            })
          } else {
            console.log('⚠️ No token usage records found for user in last 7 days')
          }
        } else {
          // Not authenticated - try to get all token usage
          const { data: tokenData, error: tokenError } = await supabase
            .from('token_usage')
            .select('total_tokens, total_cost_usd, created_at')
            .gte('created_at', oneWeekAgo.toISOString())

          if (tokenError) {
            console.error('❌ Error fetching token usage (anonymous):', tokenError)
            if (tokenError.code === 'PGRST301') {
              console.log('💡 RLS is blocking anonymous access. Token usage requires authentication.')
            }
          } else if (tokenData && tokenData.length > 0) {
            totalTokens = tokenData.reduce((sum, record) => sum + (record.total_tokens || 0), 0) || 0
            totalCost = tokenData.reduce((sum, record) => sum + (Number(record.total_cost_usd) || 0), 0) || 0
            console.log('✅ Token usage fetched (all users):', {
              tokens: totalTokens,
              cost: totalCost,
              records: tokenData.length
            })
          }
        }
        
        setWeeklyTokens(totalTokens)
        setWeeklyCost(totalCost)

        // Fetch total sources from research_reports table
        // Get ALL researches from database (not just from state)
        const { data: allResearches, error: researchesError } = await supabase
          .from('researches')
          .select('id')
          .order('created_at', { ascending: false })
        
        let sourcesCount = 0
        
        if (researchesError) {
          console.error('Error fetching researches:', researchesError)
          // Fallback: use researches from state
          const allResearchIds = [...ongoingResearches, ...completedResearches].map(r => r.id)
          if (allResearchIds.length > 0) {
            const { data: reportsData, error: reportsError } = await supabase
              .from('research_reports')
              .select('sources')
              .in('research_id', allResearchIds)
            
            if (!reportsError && reportsData) {
              reportsData.forEach(report => {
                if (report.sources && Array.isArray(report.sources)) {
                  const realSources = report.sources.filter(s => {
                    if (!s) return false
                    const url = String(s?.url || '').toLowerCase()
                    const domain = String(s?.domain || '').toLowerCase()
                    return !url.includes('example.com') && 
                           !domain.includes('example') &&
                           !url.includes('placeholder') &&
                           !domain.includes('placeholder') &&
                           !url.includes('test.com') &&
                           !domain.includes('test')
                  })
                  sourcesCount += realSources.length
                }
              })
            }
          }
        } else if (allResearches && allResearches.length > 0) {
          // Fetch sources from all researches
          const allResearchIds = allResearches.map(r => r.id)
          
          const { data: reportsData, error: reportsError } = await supabase
            .from('research_reports')
            .select('sources')
            .in('research_id', allResearchIds)
          
          if (reportsError) {
            console.error('Error fetching sources:', reportsError)
          } else if (reportsData && Array.isArray(reportsData)) {
            // Count sources from all reports, filtering out placeholder sources
            reportsData.forEach(report => {
              if (report.sources && Array.isArray(report.sources)) {
                // Filter out example.com placeholder sources
                const realSources = report.sources.filter(s => {
                  if (!s) return false
                  const url = String(s?.url || '').toLowerCase()
                  const domain = String(s?.domain || '').toLowerCase()
                  return !url.includes('example.com') && 
                         !domain.includes('example') &&
                         !url.includes('placeholder') &&
                         !domain.includes('placeholder') &&
                         !url.includes('test.com') &&
                         !domain.includes('test')
                })
                sourcesCount += realSources.length
              }
            })
            console.log('✅ Sources fetched:', sourcesCount, 'real sources from', reportsData.length, 'reports')
          }
        }
        
        setTotalSources(sourcesCount)
        console.log('✅ Sources count updated:', sourcesCount, 'real sources')

      } catch (err) {
        console.error('❌ Error fetching stats:', err)
        setWeeklyTokens(0)
        setTotalSources(0)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [researches, ongoingResearches, completedResearches])

  // Format number with k suffix
  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k'
    }
    return num.toString()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    // Always show clarifying questions, even with files uploaded
    setIsClarifying(true)
    try {
      // Determine which function to call based on selected model
      // Use clarify-Questions-gemini for both Gemini and Claude (it now supports both)
      const currentModel = selectedModel || model || 'gemini-2.5-flash'
      const functionName = 'clarify-Questions-gemini'
      const isGemini = currentModel?.toLowerCase().includes('gemini')
      
      console.log('Calling clarify function:', functionName, 'for model:', currentModel, 'isGemini:', isGemini)
      
      // Single attempt with immediate fallback on rate limit - don't block user
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ input: query, model: currentModel })
        })
        
        // Parse response
        let responseData = null
        try {
          const responseText = await response.text()
          if (responseText) {
            responseData = JSON.parse(responseText)
          } else {
            responseData = { status: 'error', error: 'Empty response from server' }
          }
        } catch (parseError) {
          console.warn('Failed to parse response, showing fallback questions')
          setIsClarifying(false)
          setClarifyData({ 
            questions: [],
            summary: query,
            originalTopic: query 
          })
          setShowClarify(true)
          return
        }
        
        // Check for rate limit errors - if rate limited, show fallback immediately
        if (response.status === 429 || 
            (responseData && (responseData.status === 429 || 
                             responseData.statusCode === 429 ||
                             (responseData.error && (responseData.error.includes('Rate limit') || 
                                                   responseData.error.includes('rate limit') || 
                                                   responseData.error.includes('429')))))) {
          console.warn('Rate limit detected for clarify questions, showing fallback immediately')
          setIsClarifying(false)
          setClarifyData({ 
            questions: [],
            summary: query,
            originalTopic: query 
          })
          setShowClarify(true)
          return
        }
        
        // If successful, use the data
        if (response.ok && responseData && (responseData.questions || responseData.summary)) {
          setIsClarifying(false)
          setClarifyData({
            questions: responseData.questions || [],
            summary: responseData.summary || query,
            originalTopic: responseData.originalTopic || query
          })
          setShowClarify(true)
          return
        }
        
        // For other errors, show fallback immediately
        console.warn('Error getting clarifying questions, showing fallback:', responseData?.error || `HTTP ${response.status}`)
        setIsClarifying(false)
        setClarifyData({ 
          questions: [],
          summary: query,
          originalTopic: query 
        })
        setShowClarify(true)
      } catch (error) {
        // On any error, show fallback immediately
        console.warn('Error getting clarifying questions, showing fallback:', error.message || error)
        setIsClarifying(false)
        setClarifyData({ 
          questions: [],
          summary: query,
          originalTopic: query 
        })
        setShowClarify(true)
      }
    } catch (error) {
      console.error('Error getting clarifying questions:', error)
      // Show clarifying page even on error
      setIsClarifying(false)
      setClarifyData({ 
        questions: [],
        summary: query,
        originalTopic: query 
      })
      setShowClarify(true)
    } finally {
      setIsClarifying(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    const processedFiles = []

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 50MB.`)
        continue
      }

      try {
        const extractedText = await extractTextFromFile(file)
        // Clean and limit the extracted text
        const cleanedText = cleanTextForDatabase(extractedText).substring(0, 50000)
        processedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          extractedText: cleanedText
        })
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        const errorMessage = error?.message || 'Unknown error occurred'
        alert(`Failed to process ${file.name}.\n\nError: ${errorMessage}\n\nPlease try:\n- A different file format\n- A smaller file\n- Converting PDF to text first`)
      }
    }

    setUploadedFiles([...uploadedFiles, ...processedFiles])
    setIsUploading(false)
    e.target.value = '' // Reset input

    // If files were processed, call ingestion agent to extract structured content
    if (processedFiles.length > 0) {
      await processFilesWithIngestion(processedFiles)
    }
  }

  // Process files with ingestion agent to extract structured content
  const processFilesWithIngestion = async (files) => {
    if (files.length === 0) return

    setIsIngesting(true)
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      // Prepare files for ingestion agent
      const filesForIngestion = files.map(file => ({
        name: file.name,
        content: file.extractedText || '',
        type: file.type || 'text/plain'
      }))

      console.log('Calling ingestion agent for', filesForIngestion.length, 'file(s)')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/document-ingestion-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          files: filesForIngestion,
          researchTopic: refinedBrief || '',
          presentationStyle: 'executive'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'success' && data.content) {
          console.log('✅ Ingestion successful:', {
            keyPoints: data.content.keyPoints?.length || 0,
            dataPoints: data.content.dataPoints?.length || 0,
            tables: data.content.tables?.length || 0,
            insights: data.content.insights?.length || 0
          })
          setIngestedContent(data.content)
          // Cache ingested content in localStorage
          try {
            localStorage.setItem('ingestedContent', JSON.stringify({
              content: data.content,
              timestamp: Date.now(),
              files: files.map(f => f.name)
            }))
          } catch (e) {
            console.warn('Could not cache ingested content:', e)
          }
        }
      } else {
        console.warn('Ingestion agent returned error, continuing without structured content')
        setIngestedContent(null)
      }
    } catch (error) {
      console.error('Error processing files with ingestion agent:', error)
      // Don't block user flow if ingestion fails
      setIngestedContent(null)
    } finally {
      setIsIngesting(false)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
  }

  // Clean text to remove null characters and invalid Unicode that PostgreSQL can't handle
  const cleanTextForDatabase = (text) => {
    if (!text) return ''
    // Remove null characters (\u0000) and other control characters except newlines and tabs
    return text
      .replace(/\u0000/g, '') // Remove null characters
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters except \n, \r, \t
      .replace(/\uFFFD/g, '') // Remove replacement characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove additional control characters
  }

  const extractTextFromFile = async (file) => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

    // For text files, read directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text()
      return cleanTextForDatabase(text)
    }

    // For other files, use extraction function
    const formData = new FormData()
    formData.append('file', file)

    // Add timeout for large files (35 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-file-text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to extract text (status: ${response.status})`)
      }

      const data = await response.json()
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text could be extracted from the file')
      }
      // Clean the extracted text before returning
      return cleanTextForDatabase(data.text)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('File processing timed out. The file might be too large. Try a smaller file.')
      }
      throw error
    }
  }

  const proceedWithResearch = async (refinedBrief, clarifyingAnswers = null) => {
    try {
      // Validate that we have a query
      if (!refinedBrief || !refinedBrief.trim()) {
        alert('Error: Please enter a research topic before proceeding.')
        return
      }
      
      // Combine document content with research query
      let documentContext = ''
      if (uploadedFiles.length > 0) {
        documentContext = uploadedFiles
          .map((file, idx) => {
            // Clean each file's extracted text before combining
            const cleanedText = cleanTextForDatabase(file.extractedText || '')
            return `\n\n--- Document ${idx + 1}: ${file.name} ---\n${cleanedText}`
          })
          .join('\n\n')
      }

      // Clean the final documentContext before sending to database
      const cleanedDocumentContext = cleanTextForDatabase(documentContext).substring(0, 100000)
      
      // Clean the refinedBrief/topic as well
      const cleanedRefinedBrief = cleanTextForDatabase(refinedBrief)
      
      // Validate after cleaning
      if (!cleanedRefinedBrief || !cleanedRefinedBrief.trim()) {
        alert('Error: The research topic appears to be empty after processing. Please try again with a different query.')
        return
      }

      const id = await createResearch(cleanedRefinedBrief, {
        depth,
        timeframe: 'all',
        sources: '10',
        model,
        documentContext: cleanedDocumentContext, // Cleaned and limited context
        clarifyingAnswers: clarifyingAnswers // Store clarifying answers for follow-up
      })
      navigate(`/progress/${id}`, { state: { refinedBrief: cleanedRefinedBrief, model, documentContext: cleanedDocumentContext, clarifyingAnswers, researchMode: 'comprehensive' } })
    } catch (error) {
      console.error('Error creating research:', error)
      alert(`Failed to start research: ${error?.message || 'Unknown error'}\n\nIf this persists, try removing uploaded files and starting again.`)
    }
  }

  const handleClarifyConfirm = async (answers, summary, additionalQueries = '') => {
    setShowClarify(false)
    
    // Clean all text inputs
    const cleanedTopic = cleanTextForDatabase(clarifyData.originalTopic)
    const cleanedSummary = cleanTextForDatabase(summary)
    const cleanedAnswers = answers.map(a => ({
      question: cleanTextForDatabase(a.question),
      answer: cleanTextForDatabase(a.answer)
    }))
    const cleanedAdditionalQueries = cleanTextForDatabase(additionalQueries)
    
    const clarificationsText = cleanedAnswers.map((a, i) => {
      return `${i + 1}. ${a.question}\n   Answer: ${a.answer}`
    }).join('\n')
    
    let refinedBrief = `Research topic: ${cleanedTopic}
    
Research objective: ${cleanedSummary}

Clarifications:
${clarificationsText}
`

    // Add additional queries if provided
    if (cleanedAdditionalQueries && cleanedAdditionalQueries.trim()) {
      refinedBrief += `\n\nAdditional Research Queries:\n${cleanedAdditionalQueries}`
    }

    refinedBrief += `\n\nPlease conduct comprehensive deep research on this topic with the above clarifications in mind.`
    
    await proceedWithResearch(refinedBrief, cleanedAnswers)
  }

  const handleClarifySkip = async () => {
    if (window.confirm('Are you sure you want to skip the clarifying questions? The research may be less accurate without your input.')) {
      setShowClarify(false)
      await proceedWithResearch(query)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const formatUpdatedDate = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Updated just now'
    if (diffMins < 60) return `Updated ${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`
    if (diffHours < 24) return `Updated ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    return `Updated ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  }

  const extractOriginalQuery = (topic) => {
    if (!topic) return ''
    
    if (topic.startsWith('Research topic:')) {
      const lines = topic.split('\n')
      const firstLine = lines[0]
      const match = firstLine.match(/Research topic:\s*(.+)/i)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    return topic
  }

  const formatFullResearchDisplay = (research) => {
    let display = ''
    
    // Extract original query
    const originalQuery = extractOriginalQuery(research.topic)
    display += `Research Query: ${originalQuery}\n\n`
    
    // Add clarifying questions and answers if available
    const clarifyingAnswers = research?.options?.clarifyingAnswers
    if (clarifyingAnswers) {
      if (Array.isArray(clarifyingAnswers) && clarifyingAnswers.length > 0) {
        display += 'Clarifying Questions & Answers:\n'
        clarifyingAnswers.forEach((qa, index) => {
          if (qa && typeof qa === 'object') {
            display += `${index + 1}. ${qa.question || 'Question'}\n   Answer: ${qa.answer || 'No answer provided'}\n\n`
          } else if (typeof qa === 'string') {
            display += `${index + 1}. ${qa}\n\n`
          }
        })
      } else if (typeof clarifyingAnswers === 'string' && clarifyingAnswers.trim()) {
        display += `Clarifying Answers: ${clarifyingAnswers}\n\n`
      }
    }
    
    // If topic contains the full research brief, show it
    if (research.topic && research.topic.includes('Research objective:') || research.topic.includes('Clarifications:')) {
      display += 'Full Research Brief:\n'
      display += research.topic
    }
    
    return display.trim()
  }

  const getProgress = (research) => {
    if (!research) return { steps: 0, total: 12, percentage: 0 }
    const steps = research.current_step || research.progress_step || 0
    const total = research.total_steps || 12
    const percentage = total > 0 ? Math.min(Math.round((steps / total) * 100), 100) : 0
    return { steps, total, percentage }
  }

  const getModelBadge = (model) => {
    const models = {
      'claude-sonnet-4-20250514': { name: 'CLAUDE SONNET 4', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
      'claude-4-sonnet-20250514': { name: 'CLAUDE SONNET 4', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
      'gemini-2.5-flash': { name: 'GEMINI 2.5 FLASH', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
      'gemini-2.5-pro': { name: 'GEMINI 2.5 PRO', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
      'gemini-1.5-flash': { name: 'GEMINI 1.5 FLASH', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
      'gemini-1.5-pro': { name: 'GEMINI 1.5 PRO', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
      'gpt-4': { name: 'GPT-4', color: 'bg-[#f0f0f0] text-[#000000] border-[#dddddd]' },
    }
    // Match partial model names
    if (model?.includes('claude') && (model?.includes('4') || model?.includes('sonnet-4'))) {
      return models['claude-sonnet-4-20250514'] || models['claude-4-sonnet-20250514']
    }
    if (model?.includes('claude')) {
      return models['claude-sonnet-4-20250514'] || models['claude-4-sonnet-20250514']
    }
    if (model?.includes('gemini') && model?.includes('2.5-flash')) {
      return models['gemini-2.5-flash']
    }
    if (model?.includes('gemini') && model?.includes('2.5-pro')) {
      return models['gemini-2.5-pro']
    }
    if (model?.includes('gemini') && model?.includes('1.5-flash')) {
      return models['gemini-1.5-flash']
    }
    if (model?.includes('gemini') && model?.includes('1.5-pro')) {
      return models['gemini-1.5-pro']
    }
    if (model?.includes('gemini')) {
        return models['gemini-2.5-flash'] || models['gemini-2.5-pro'] || models['gemini-1.5-pro'] || models['gemini-1.5-flash']
    }
    return models[model] || models['gemini-2.5-flash'] || models['gemini-2.5-pro']
  }

  const getModelName = (modelId) => {
    const models = {
      'gemini-2.5-flash': 'Gemini 2.5 Flash',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-4-sonnet-20250514': 'Claude Sonnet 4',
      'gpt-4': 'GPT-4'
    }
    // Match partial model names
    if (modelId?.includes('claude') && (modelId?.includes('4') || modelId?.includes('sonnet-4'))) {
      return models['claude-sonnet-4-20250514'] || models['claude-4-sonnet-20250514'] || 'Claude Sonnet 4'
    }
    if (modelId?.includes('claude')) {
      return models['claude-sonnet-4-20250514'] || models['claude-4-sonnet-20250514'] || 'Claude Sonnet 4'
    }
    if (modelId?.includes('gemini') && modelId?.includes('2.5-flash')) {
      return models['gemini-2.5-flash'] || 'Gemini 2.5 Flash'
    }
    if (modelId?.includes('gemini') && modelId?.includes('2.5-pro')) {
      return models['gemini-2.5-pro'] || 'Gemini 2.5 Pro'
    }
    if (modelId?.includes('gemini') && modelId?.includes('1.5-pro')) {
      return models['gemini-1.5-pro'] || 'Gemini 1.5 Pro'
    }
    if (modelId?.includes('gemini') && modelId?.includes('1.5-flash')) {
      return models['gemini-1.5-flash'] || 'Gemini 1.5 Flash'
    }
    if (modelId?.includes('gemini')) {
        return models['gemini-2.5-flash'] || models['gemini-2.5-pro'] || models['gemini-1.5-pro'] || models['gemini-1.5-flash'] || 'Gemini 2.5 Pro'
    }
    return models[modelId] || 'Gemini 2.5 Flash'
  }

  const handleDelete = async (researchId, e) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this research? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteResearch(researchId)
      setOpenDropdown(null)
    } catch (error) {
      console.error('Error deleting research:', error)
      alert('Failed to delete research. Please try again.')
    }
  }

  const handleEdit = (research, e) => {
    e.stopPropagation()
    setEditingResearch(research)
    setEditQuery(extractOriginalQuery(research.topic))
    setShowEditModal(true)
    setOpenDropdown(null)
  }

  const handleReinitiate = async () => {
    if (!editQuery.trim()) {
      alert('Please enter a research topic')
      return
    }
    
    setShowEditModal(false)
    setQuery(editQuery)
    
    // Trigger clarifying questions flow
    setIsClarifying(true)
    try {
      const currentModel = editingResearch?.model || model || 'gemini-2.5-flash'
      const functionName = 'clarify-Questions-gemini'
      
      // Single attempt - no retries (fail fast on rate limits)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ input: editQuery.trim(), model: currentModel })
      })
      
      // Handle rate limit errors - fail immediately
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.')
      }
      
      // For other errors, handle normally
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Edge Function error:', errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Clarify response:', data)
      
      setIsClarifying(false)
      setClarifyData({ 
        questions: data.questions || [],
        summary: editQuery.trim(),
        originalTopic: editQuery.trim() 
      })
      setShowClarify(true)
    } catch (error) {
      console.error('Error fetching clarifying questions:', error)
      setIsClarifying(false)
      setClarifyData({ 
        questions: [],
        summary: editQuery.trim(),
        originalTopic: editQuery.trim() 
      })
      setShowClarify(true)
    }
    
    setEditingResearch(null)
    setEditQuery('')
  }

  const handleCancelEdit = () => {
    setShowEditModal(false)
    setEditingResearch(null)
    setEditQuery('')
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown-button')) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])


  return (
    <div className="min-h-screen bg-white text-[#000000] w-full">
      {/* Edit Research Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCancelEdit}
        >
          <div 
            className="bg-white rounded-xl border border-[#dddddd] max-w-2xl w-full p-8 animate-scaleIn shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#000000]">Edit Research Query</h2>
              <button
                onClick={handleCancelEdit}
                className="text-[#666666] hover:text-[#000000] hover:bg-[#f0f0f0] rounded-full p-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#000000] mb-2">
                Research Query
              </label>
              <textarea
                value={editQuery}
                onChange={(e) => setEditQuery(e.target.value)}
                placeholder="Enter your research query..."
                rows={4}
                className="w-full px-5 py-4 border border-[#dddddd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-[#000000] text-[#000000] placeholder-[#aaaaaa] bg-white transition-all resize-y"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2.5 text-[#000000] border border-[#dddddd] rounded-xl hover:bg-[#f0f0f0] hover:border-[#000000] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReinitiate}
                className="px-6 py-2.5 bg-[#000000] text-white rounded-xl hover:opacity-90 transition-opacity font-semibold flex items-center gap-2 shadow-sm"
              >
                <ArrowRight className="w-5 h-5" />
                Re-initiate
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clarification modal */}
      {showClarify && clarifyData && (
        <ClarifyQuestions
          questions={clarifyData.questions}
          summary={clarifyData.summary}
          onConfirm={handleClarifyConfirm}
          onSkip={handleClarifySkip}
        />
      )}
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-12">
        {/* Header Section with Background */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-3xl font-bold text-[#000000] mb-1.5 tracking-tight">Deep Research</h1>
              <p className="text-[#666666] text-sm">Gather enterprise-level market, client, and industry insights via LLMs.</p>
            </div>
          </div>

          {/* Modern Step Indicator with Progress Bar */}
          <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200 shadow-sm">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start justify-between relative">
                {/* Progress Line Background */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 rounded-full" style={{left: '8%', right: '8%'}}></div>
                {/* Progress Line Active */}
                <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-gray-900 to-black rounded-full transition-all duration-500" style={{width: '8%', left: '8%'}}></div>
                
                {/* Step 1 - Active */}
                <div className="flex flex-col items-center relative z-10 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center font-bold text-base mb-2.5 shadow-lg ring-3 ring-gray-100 transition-all duration-300">
                    1
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-bold text-gray-900 uppercase tracking-wide">Deep Research</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5">Active</span>
                  </div>
                </div>
                
                {/* Step 2 - Inactive */}
                <div className="flex flex-col items-center relative z-10 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center font-bold text-base mb-2.5 shadow-sm transition-all duration-300 hover:border-gray-400">
                    2
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Storyboarding</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">Next</span>
                  </div>
                </div>
                
                {/* Step 3 - Inactive */}
                <div className="flex flex-col items-center relative z-10 flex-1">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center font-bold text-base mb-2.5 shadow-sm transition-all duration-300 hover:border-gray-400">
                    3
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Deck Generation</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs with Pills Design */}
        <div className="flex items-center gap-3 mb-8 bg-gray-100 rounded-xl p-1.5 w-fit">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'new'
                  ? 'bg-white text-[#000000] shadow-sm'
                  : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              <span className="text-lg">+</span> New Research
            </button>
            <button
              onClick={() => setActiveTab('ongoing')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'ongoing'
                  ? 'bg-white text-[#000000] shadow-sm'
                  : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              <Clock className="w-4 h-4" />
              Ongoing
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-white text-[#000000] shadow-sm'
                  : 'text-[#666666] hover:text-[#000000]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Completed
            </button>
          </div>

          {activeTab === 'new' && (
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Research Topic Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#000000] mb-4">
                    <Search className="w-4 h-4" />
                    Research Topic
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                    placeholder="e.g. Impact of solid state batteries on EV market by 2030..."
                    rows={5}
                    className="w-full px-5 py-4 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent text-[#000000] placeholder-[#aaaaaa] bg-gray-50 transition-all duration-200 font-normal resize-none leading-relaxed hover:border-gray-300"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>Press Shift + Enter for new line</span>
                    <span>{query.length} characters</span>
                  </div>
                </div>

                {/* Upload Documents Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#000000] mb-4">
                    <Upload className="w-4 h-4" />
                    Upload Documents <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                  </label>
                  <label className="block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all bg-gray-50/50">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="text-sm text-[#666666]">
                          <div className="font-semibold mb-1">Click to upload or drag and drop</div>
                          <div className="text-xs text-gray-500">PDF, DOCX, DOC, TXT, MD (Max 50MB per file)</div>
                        </div>
                      </div>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <File className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-[#000000]">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </label>
                </div>

                {/* Configuration Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#000000] mb-4">
                    <Cpu className="w-4 h-4" />
                    Research Configuration
                  </label>
                  
                  {/* Target Depth */}
                  <div className="mb-6">
                    <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">
                      Target Depth
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setDepth('light')}
                        className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                          depth === 'light'
                            ? 'bg-[#000000] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepth('standard')}
                        className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                          depth === 'standard'
                            ? 'bg-[#000000] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepth('deep')}
                        className={`flex-1 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                          depth === 'deep'
                            ? 'bg-[#000000] text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Deep
                      </button>
                    </div>
                  </div>

                  {/* AI Model */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">
                      AI Model
                    </label>
                    <div className="relative">
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full px-5 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#000000] focus:border-transparent text-[#000000] bg-gray-50 appearance-none cursor-pointer hover:border-gray-300 transition-all"
                      >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isClarifying || !query.trim()}
                  className={`w-full px-8 py-4 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl ${
                    isClarifying 
                      ? 'bg-[#000000]' 
                      : 'bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900'
                  }`}
                >
                  {isClarifying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Initializing Research Agent...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span>Initialize Research Agent</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                </button>
              </form>

              {/* Feature Cards */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Market Landscape</h3>
                  <p className="text-sm text-gray-600">Analyze market trends and opportunities with comprehensive data</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Competitor Intel</h3>
                  <p className="text-sm text-gray-600">Track competitor strategies and market positioning</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center mb-4">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Tech Deep Dive</h3>
                  <p className="text-sm text-gray-600">Explore technical innovations and capabilities in depth</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ongoing' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wide">ACTIVE PROJECTS</span>
                    <Zap className="w-5 h-5 text-[#000000]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000]">{ongoingResearches.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wide">TOKENS USED (WK)</span>
                    <BarChart3 className="w-5 h-5 text-[#000000]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000]">
                    {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-[#666666]" /> : formatNumber(weeklyTokens)}
                  </div>
                  {weeklyCost > 0 && (
                    <div className="text-xs text-[#666666] mt-1">
                      ${weeklyCost.toFixed(4)} cost
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wide">SOURCES ANALYZED</span>
                    <Cpu className="w-5 h-5 text-[#000000]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000]">
                    {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-[#666666]" /> : totalSources}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#dddddd] shadow-sm">
                <div className="p-6 border-b border-[#dddddd] flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#000000]">ACTIVE RESEARCH SESSIONS</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      className="p-2 hover:bg-[#f0f0f0] rounded-xl transition-colors"
                      aria-label="Filter research sessions"
                      title="Filter research sessions"
                    >
                      <Filter className="w-5 h-5 text-[#666666]" />
                    </button>
                    <button 
                      className="p-2 hover:bg-[#f0f0f0] rounded-xl transition-colors"
                      aria-label="Change view layout"
                      title="Change view layout"
                    >
                      <Grid3x3 className="w-5 h-5 text-[#666666]" />
                    </button>
                  </div>
                </div>

                <div className="px-4 sm:px-6 md:px-8">
                  {loading ? (
                    <div className="text-center py-16 text-[#666666]">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-[#000000] animate-spin" />
                      <p className="font-medium text-[#666666]">Loading ongoing research...</p>
                    </div>
                  ) : ongoingResearches.length === 0 ? (
                    <div className="text-center py-20 text-[#666666]">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-[#aaaaaa]" />
                      <p className="font-medium text-lg text-[#000000] mb-2">No ongoing research</p>
                      <p className="text-sm text-[#666666]">Start a new research to see it here</p>
                    </div>
                  ) : (
                    ongoingResearches.map((research) => {
                      const progress = getProgress(research)
                      const modelBadge = getModelBadge(research.model || 'gemini-2.5-flash')
                      return (
                        <div
                          key={research.id}
                          onClick={() => navigate(`/progress/${research.id}`)}
                          className="p-6 sm:p-7 md:p-8 border-b border-[#dddddd] hover:bg-[#f0f0f0] transition-colors cursor-pointer last:border-b-0 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#000000] mb-3 text-base leading-relaxed">{extractOriginalQuery(research.topic)}</h4>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-3 py-1 bg-[#f0f0f0] text-[#000000] rounded-full text-xs font-semibold flex items-center gap-1.5 border border-[#dddddd]">
                                  <Clock className="w-3 h-3 text-[#000000]" />
                                  In Progress
                                </span>
                                <span className="text-xs text-[#666666]">{formatUpdatedDate(research.updated_at || research.created_at)}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${modelBadge.color}`}>
                                  {modelBadge.name}
                                </span>
                              </div>
                            </div>
                            <div className="relative">
                              <button
                                className="dropdown-button p-2 hover:bg-[#e0e0e0] rounded-xl transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdown(openDropdown === research.id ? null : research.id)
                                }}
                                aria-label="Open research options menu"
                                title="Open research options menu"
                              >
                                <MoreVertical className="w-5 h-5 text-[#666666]" />
                              </button>
                              {openDropdown === research.id && (
                                <div className="dropdown-menu absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-[#dddddd] z-50">
                                  <button
                                    onClick={(e) => handleEdit(research, e)}
                                    className="w-full px-4 py-2 text-left text-sm text-[#000000] hover:bg-[#f0f0f0] flex items-center gap-2 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(research.id, e)}
                                    className="w-full px-4 py-2 text-left text-sm text-[#dc2626] hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <span className="text-xs text-[#666666] font-medium">{progress.steps}/{progress.total} steps</span>
                            <div className="flex-1 bg-[#f0f0f0] rounded-full h-2">
                              <div 
                                className="bg-[#000000] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-[#000000]">{progress.percentage}%</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-8">
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wide">ACTIVE PROJECTS</span>
                    <Zap className="w-5 h-5 text-[#000000]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000]">{completedResearches.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wide">TOKENS USED (WK)</span>
                    <BarChart3 className="w-5 h-5 text-[#000000]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000]">
                    {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-[#666666]" /> : formatNumber(weeklyTokens)}
                  </div>
                  {weeklyCost > 0 && (
                    <div className="text-xs text-[#666666] mt-1">
                      ${weeklyCost.toFixed(4)} cost
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#666666] uppercase tracking-wide">SOURCES ANALYZED</span>
                    <Cpu className="w-5 h-5 text-[#000000]" />
                  </div>
                  <div className="text-3xl font-bold text-[#000000]">
                    {statsLoading ? <Loader2 className="w-8 h-8 animate-spin text-[#666666]" /> : totalSources}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#dddddd] shadow-sm">
                <div className="p-6 border-b border-[#dddddd] flex items-center justify-between">
                  <h3 className="text-lg font-bold text-[#000000]">RESEARCH ARCHIVE</h3>
                  <div className="flex items-center gap-3">
                    <button 
                      className="p-2 hover:bg-[#f0f0f0] rounded-xl transition-colors"
                      aria-label="Filter research sessions"
                      title="Filter research sessions"
                    >
                      <Filter className="w-5 h-5 text-[#666666]" />
                    </button>
                    <button 
                      className="p-2 hover:bg-[#f0f0f0] rounded-xl transition-colors"
                      aria-label="Change view layout"
                      title="Change view layout"
                    >
                      <Grid3x3 className="w-5 h-5 text-[#666666]" />
                    </button>
                  </div>
                </div>

                <div className="px-4 sm:px-6 md:px-8">
                  {loading ? (
                    <div className="text-center py-16 text-[#666666]">
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-[#000000] animate-spin" />
                      <p className="font-medium text-[#666666]">Loading completed research...</p>
                    </div>
                  ) : completedResearches.length === 0 ? (
                    <div className="text-center py-20 text-[#666666]">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#aaaaaa]" />
                      <p className="font-medium text-lg text-[#000000] mb-2">No completed research</p>
                      <p className="text-sm text-[#666666]">Completed research will appear here</p>
                    </div>
                  ) : (
                    completedResearches.map((research) => {
                      const progress = getProgress(research)
                      const modelBadge = getModelBadge(research.model || 'gemini-2.5-flash')
                      const finalProgress = { steps: progress.total, total: progress.total, percentage: 100 }
                      return (
                        <div
                          key={research.id}
                          onClick={() => navigate(`/report/${research.id}`)}
                          className="p-6 sm:p-7 md:p-8 border-b border-[#dddddd] hover:bg-[#f0f0f0] transition-colors cursor-pointer last:border-b-0 rounded-lg"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#000000] mb-3 text-base leading-relaxed">{extractOriginalQuery(research.topic)}</h4>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-3 py-1 bg-[#f0f0f0] text-[#000000] rounded-full text-xs font-semibold flex items-center gap-1.5 border border-[#dddddd]">
                                  <CheckCircle className="w-3 h-3 text-[#000000]" />
                                  Completed
                                </span>
                                <span className="text-xs text-[#666666]">{formatUpdatedDate(research.updated_at || research.created_at)}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${modelBadge.color}`}>
                                  {modelBadge.name}
                                </span>
                                <span className="text-xs text-[#666666]">{finalProgress.steps}/{finalProgress.total} steps</span>
                              </div>
                            </div>
                            <div className="relative">
                              <button
                                className="dropdown-button p-2 hover:bg-[#e0e0e0] rounded-xl transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenDropdown(openDropdown === research.id ? null : research.id)
                                }}
                                aria-label="Open research options menu"
                                title="Open research options menu"
                              >
                                <MoreVertical className="w-5 h-5 text-[#666666]" />
                              </button>
                              {openDropdown === research.id && (
                                <div className="dropdown-menu absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-[#dddddd] z-50">
                                  <button
                                    onClick={(e) => handleEdit(research, e)}
                                    className="w-full px-4 py-2 text-left text-sm text-[#000000] hover:bg-[#f0f0f0] flex items-center gap-2 transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => handleDelete(research.id, e)}
                                    className="w-full px-4 py-2 text-left text-sm text-[#dc2626] hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-4">
                            <span className="text-xs font-medium text-[#666666]">Research Progress</span>
                            <div className="flex-1 bg-[#f0f0f0] rounded-full h-2">
                              <div 
                                className="bg-[#000000] h-2 rounded-full transition-all duration-300"
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-[#000000]">100%</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}
