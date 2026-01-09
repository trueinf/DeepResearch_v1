import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { ArrowLeft, MessageCircle, Download, Copy, ExternalLink, Calendar, Loader2, X, Network, Sparkles, TrendingUp, Zap, ChevronDown, ChevronUp, Clock, Palette, Type, Layout, Image, Settings, Eye, Paintbrush, Layers, Square, Box, Check, AlertCircle, Film, Search } from 'lucide-react'
import pptxgen from 'pptxgenjs'
import { rateLimitHandler } from '../utils/rateLimitHandler'
import { supabase } from '../lib/supabase'
import StoryboardView from '../components/StoryboardView'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function ReportView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResearch, getResearchReport } = useResearch()
  
  const research = getResearch(id)
  const [report, setReport] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false)
  const [slides, setSlides] = useState([])
  const [showSlidesModal, setShowSlidesModal] = useState(false)
  const [slidesError, setSlidesError] = useState('')
  const [presentationStyle, setPresentationStyle] = useState('executive')
  const [agentRecommendations, setAgentRecommendations] = useState(null)
  // Level-6 integration state
  const [useLevel6, setUseLevel6] = useState(false)
  const [level6JobId, setLevel6JobId] = useState(null)
  const [level6JobStatus, setLevel6JobStatus] = useState(null) // 'pending', 'processing', 'done', 'failed'
  const [level6PptUrl, setLevel6PptUrl] = useState(null)
  const [level6Error, setLevel6Error] = useState(null)
  const [universalFramework, setUniversalFramework] = useState(null)
  const [isGeneratingUniversal, setIsGeneratingUniversal] = useState(false)
  const [universalRateLimitCountdown, setUniversalRateLimitCountdown] = useState(null) // { seconds: number, initialSeconds: number, attempt: number, total: number }
  const [expandedUniversalSections, setExpandedUniversalSections] = useState({
    questionPrecision: false,
    context: false,
    oneSentenceAnswer: false,
    keyInsights: false,
    stakeholders: false,
    evidence: false,
    confidence: false,
    implications: false,
    limitations: false,
    keyTakeaways: false
  })
  const [showPPTSettings, setShowPPTSettings] = useState(false)
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)
  const [previewType, setPreviewType] = useState('content') // 'title' or 'content'
  const [pptSettings, setPptSettings] = useState({
    theme: 'professional',
    primaryColor: '0F172A',
    secondaryColor: '1E40AF',
    accentColor: '3B82F6',
    backgroundColor: 'F8FAFC',
    backgroundType: 'solid', // 'solid', 'gradient'
    fontFamily: 'Calibri',
    fontSize: 'normal', // 'small', 'normal', 'large'
    layout: 'LAYOUT_WIDE', // 'LAYOUT_WIDE', 'LAYOUT_4x3', 'LAYOUT_16x10'
    // New advanced options
    bulletStyle: 'circle', // 'circle', 'square', 'arrow', 'dash', 'none'
    headerHeight: 'normal', // 'small', 'normal', 'large'
    showSlideNumbers: true,
    showFooter: true,
    footerText: 'AskDepth Research',
    textAlignment: 'left', // 'left', 'center', 'right'
    lineSpacing: 'normal', // 'tight', 'normal', 'loose'
    borderStyle: 'solid', // 'solid', 'dashed', 'dotted', 'none'
    borderWidth: 'normal', // 'thin', 'normal', 'thick'
    shadowEffect: true,
    roundedCorners: false,
    gradientDirection: 'horizontal', // 'horizontal', 'vertical', 'diagonal'
    titleSlideStyle: 'centered', // 'centered', 'left', 'minimal'
    contentPadding: 'normal', // 'tight', 'normal', 'spacious'
    iconStyle: 'filled', // 'filled', 'outline', 'minimal'
    accentBarPosition: 'bottom' // 'top', 'bottom', 'both', 'none'
  })
  const [expandedSections, setExpandedSections] = useState({
    executiveSummary: true,
    detailedAnalysis: true,
    keyFindings: true,
    insights: true,
    conclusion: true
  })
  
  // Remove expand/collapse buttons - always show content
  // Storyboard state
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false)
  const [storyboard, setStoryboard] = useState(null)
  const [showStoryboard, setShowStoryboard] = useState(false)
  const [storyboardError, setStoryboardError] = useState('')
  const [storySpine, setStorySpine] = useState('problem-insight-resolution')

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getPreview = (text, maxLength = 200) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return null
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start
    
    if (diffMs < 0) return null
    
    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const getResearchDuration = () => {
    if (!research) return null
    
    // Use updated_at as completion time, or created_at if still in progress
    const startTime = research.created_at
    const endTime = research.status === 'Done' ? research.updated_at : new Date().toISOString()
    
    return formatDuration(startTime, endTime)
  }

  // Reset preview slide index when slides change
  useEffect(() => {
    if (slides.length > 0 && previewSlideIndex >= slides.length) {
      setPreviewSlideIndex(0)
    }
  }, [slides.length, previewSlideIndex])

  useEffect(() => {
    let pollInterval = null
    
    const normalizeReport = (data) => {
      if (!data) return null
      
      // Normalize keyFindings to always be an array
      data.keyFindings = Array.isArray(data.keyFindings) 
        ? data.keyFindings 
        : (data.keyFindings === 0 || !data.keyFindings ? [] : [data.keyFindings])
      
      // Normalize sources to always be an array
      data.sources = Array.isArray(data.sources) 
        ? data.sources 
        : (data.sources === 0 || !data.sources ? [] : [data.sources])
      
      // Ensure each finding has citations as an array
      if (data.keyFindings && Array.isArray(data.keyFindings)) {
        data.keyFindings = data.keyFindings.map(finding => ({
          ...finding,
          citations: Array.isArray(finding?.citations) 
            ? finding.citations 
            : (finding.citations === 0 || !finding.citations ? [] : [finding.citations])
        }))
      }
      
      return data
    }
    
    const loadReport = async () => {
      if (!research) {
        console.log('No research found for ID:', id)
        setLoading(false)
        return
      }
      
      console.log('Loading report for research ID:', id)
      const reportData = await getResearchReport(id)
      console.log('Report data loaded:', reportData ? 'Found' : 'Not found')
      
      // Normalize data to ensure arrays are always arrays (not 0 or other values)
      if (reportData) {
        const normalized = normalizeReport(reportData)
        console.log('Report normalized:', {
          hasExecutiveSummary: !!normalized.executiveSummary,
          keyFindingsCount: normalized.keyFindings?.length || 0,
          sourcesCount: normalized.sources?.length || 0,
          sourcesData: normalized.sources,
          sourcesType: Array.isArray(normalized.sources) ? 'array' : typeof normalized.sources,
          firstSource: normalized.sources?.[0]
        })
        setReport(normalized)
        setLoading(false)
      } else {
        console.log('No report data found - research may still be in progress')
        setLoading(false)
      }
      
      // Poll for real-time updates if research is in progress
      if (research && research.status === 'In Progress') {
        pollInterval = setInterval(async () => {
          const polledData = await getResearchReport(id)
          if (polledData) {
            const normalized = normalizeReport(polledData)
            setReport(prevReport => {
              // Only update if sources count changed or report content changed
              if (!prevReport) {
                console.log('🔄 Real-time update: Initial report loaded')
                return normalized
              }
              
              const prevSourcesCount = prevReport.sources?.length || 0
              const newSourcesCount = normalized.sources?.length || 0
              
              if (newSourcesCount > prevSourcesCount) {
                console.log('🔄 Real-time update: New sources detected', {
                  previousCount: prevSourcesCount,
                  newCount: newSourcesCount,
                  newSources: normalized.sources.slice(prevSourcesCount)
                })
                return normalized
              }
              
              // Also update if other content changed
              const reportChanged = 
                prevReport.executiveSummary !== normalized.executiveSummary ||
                prevReport.detailedAnalysis !== normalized.detailedAnalysis ||
                (prevReport.keyFindings?.length || 0) !== (normalized.keyFindings?.length || 0)
              
              if (reportChanged) {
                console.log('🔄 Real-time update: Report content updated')
                return normalized
              }
              
              return prevReport
            })
          }
          
          // Check if research is still in progress
          const currentResearch = getResearch(id)
          if (currentResearch && currentResearch.status !== 'In Progress') {
            console.log('🔄 Real-time update: Research completed, stopping polling')
            if (pollInterval) {
              clearInterval(pollInterval)
            }
          }
        }, 3000) // Poll every 3 seconds for real-time updates
      }
    }
    
    loadReport()
    
    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [id, research, getResearchReport, getResearch])

  if (!research || loading) {
    return (
      <div className="pt-16 min-h-screen bg-white flex items-center justify-center">
        <p className="text-[#666666]">{loading ? 'Loading...' : 'Research not found'}</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="pt-16 min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#000000] mx-auto mb-4" />
          <p className="text-[#666666] mb-2">Loading report...</p>
          <p className="text-sm text-[#666666]">If this takes too long, the report may still be generating.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#000000] text-white rounded-lg hover:opacity-90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const handleExportPDF = () => {
    window.print()
  }

  const handleCopyMarkdown = () => {
    let markdown = `# ${report.topic}\n\n`
    
    if (report.executiveSummary) {
      markdown += `## Executive Summary\n\n${report.executiveSummary}\n\n`
    }
    
    if (report.detailedAnalysis) {
      markdown += `## Detailed Analysis\n\n${report.detailedAnalysis}\n\n`
    }
    
    if (Array.isArray(report.keyFindings) && report.keyFindings.length > 0) {
      markdown += `## Key Findings\n\n${report.keyFindings.map((f, i) => {
        const citations = Array.isArray(f.citations) ? f.citations.map(c => `[${c}]`).join(' ') : ''
        return `${i + 1}. ${f.text} ${citations}`
      }).join('\n\n')}\n\n`
    }
    
    if (report.insights) {
      markdown += `## Insights and Implications\n\n${report.insights}\n\n`
    }
    
    if (report.conclusion) {
      markdown += `## Conclusion\n\n${report.conclusion}\n\n`
    }
    
    if (Array.isArray(report.sources) && report.sources.length > 0) {
      markdown += `## Sources\n\n${report.sources.map((s, i) => {
        let sourceUrl = s.url || ''
        if (sourceUrl && !sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
          sourceUrl = 'https://' + sourceUrl
        }
        return `${i + 1}. [${s.title || s.domain || 'Source'}](${sourceUrl}) - ${s.date || 'N/A'}`
      }).join('\n')}`
    }
    
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateStoryboard = async () => {
    if (!report) return
    
    setIsGeneratingStoryboard(true)
    setStoryboardError('')
    setStoryboard(null)

    console.log('Starting storyboard generation...', {
      hasReport: !!report,
      topic: report?.topic,
      hasKeyFindings: !!report?.keyFindings?.length,
      storySpine
    })

    // Single attempt - no retries (fail fast on rate limits)
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-storyboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          report: {
            topic: research?.topic || report.topic,
            executiveSummary: report.executiveSummary,
            detailedAnalysis: report.detailedAnalysis,
            keyFindings: report.keyFindings,
            insights: report.insights,
            conclusion: report.conclusion,
            sources: report.sources
          },
          storySpine: storySpine,
          audience: 'general'
        }),
      })

      let data = null
      try {
        const responseText = await response.text()
        if (responseText) {
          data = JSON.parse(responseText)
        } else {
          data = { status: 'error', error: 'Empty response from server' }
        }
      } catch (parseError) {
        console.error('Failed to parse storyboard response:', parseError)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Invalid response format`)
        }
        data = { status: 'error', error: 'Invalid response format' }
      }

      console.log('Storyboard response:', data)

      // Check for rate limit errors - fail immediately (no retries)
      if (response.status === 429 || 
          (data && data !== null && (data.status === 429 || 
                   data.statusCode === 429 ||
                   (data.error && (data.error.includes('Rate limit') || 
                                 data.error.includes('rate limit') || 
                                 data.error.includes('429')))))) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again, or switch to a different model.')
      }

      if (!response.ok) {
        const errorMsg = data?.error || `HTTP ${response.status}`
        throw new Error(errorMsg)
      }

      if (data && data.status === 'success' && data.storyboard) {
        setStoryboard(data.storyboard)
        setShowStoryboard(true)
        setStoryboardError('') // Clear any previous errors
      } else if (data && data.status === 'error') {
        // Function returned an error response
        const errorMsg = data.error || 'Failed to generate storyboard'
        console.error('Storyboard function error:', errorMsg, data)
        
        // Provide more specific error messages
        if (errorMsg.includes('GEMINI_API_KEY')) {
          throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in Supabase Edge Functions → Secrets.')
        } else if (errorMsg.includes('parse') || errorMsg.includes('JSON')) {
          throw new Error('Failed to parse storyboard response. The AI may have returned invalid data. Please try again.')
        } else if (errorMsg.includes('Invalid response')) {
          throw new Error('Storyboard generation failed: Invalid response structure. Please check Supabase function logs for details.')
        } else {
          throw new Error(errorMsg)
        }
      } else if (data && data.error) {
        // Error in response but no status field
        console.error('Storyboard error (no status):', data.error, data)
        throw new Error(data.error)
      } else {
        // Unexpected response format
        console.error('Unexpected storyboard response format:', data)
        throw new Error('Unexpected response from storyboard function. Check browser console and Supabase function logs for details.')
      }
    } catch (error) {
      console.error('Storyboard generation error:', error)
      
      let errorMessage = error.message || 'Failed to generate storyboard. Please try again.'
      
      // Check for CORS or network errors
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('CORS') || 
          error.name === 'TypeError') {
        errorMessage = `Storyboard function not deployed or CORS error.\n\nTo fix:\n1. Go to Supabase Dashboard → Edge Functions\n2. Create/Deploy "generate-storyboard" function\n3. Copy code from supabase/functions/generate-storyboard/index.ts\n4. Ensure GEMINI_API_KEY is set in Supabase secrets\n5. Deploy and try again\n\nSee FIX_STORYBOARD_CORS.md for detailed instructions.`
      } else if (error.message?.includes('not deployed') || error.message?.includes('404')) {
        errorMessage = 'Storyboard function not deployed.\n\nTo fix:\n1. Go to Supabase Dashboard → Edge Functions\n2. Create/Deploy "generate-storyboard" function\n3. Copy code from supabase/functions/generate-storyboard/index.ts\n4. Ensure GEMINI_API_KEY is set in Supabase secrets\n5. Deploy and try again'
      }
      
      setStoryboardError(errorMessage)
    } finally {
      setIsGeneratingStoryboard(false)
    }
  }

  const formatSourceDate = (dateString) => {
    if (!dateString) return ''
    
    // Handle YYYY-MM-DD format
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString + 'T00:00:00')
      if (isNaN(date.getTime())) return dateString
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = months[date.getMonth()]
      const day = date.getDate()
      const year = date.getFullYear()
      
      return `${month} ${day}, ${year}`
    }
    
    // Try to parse as date
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    
    return `${month} ${day}, ${year}`
  }

  // Helper function to manually parse JSON structure
  const parseJSONManually = (jsonText) => {
    const slides = []
    try {
      // Find all slide objects
      const slideMatches = jsonText.match(/\{[^}]*"title"[^}]*"bullets"[^}]*\}/g)
      if (slideMatches) {
        slideMatches.forEach(match => {
          const titleMatch = match.match(/"title"\s*:\s*"([^"]*)"/)
          const bulletsMatch = match.match(/"bullets"\s*:\s*\[([^\]]*)\]/)
          
          if (titleMatch) {
            const title = titleMatch[1].replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()
            const bullets = []
            
            if (bulletsMatch) {
              const bulletsText = bulletsMatch[1]
              const bulletMatches = bulletsText.match(/"([^"]*)"/g)
              if (bulletMatches) {
                bulletMatches.forEach(b => {
                  const bullet = b.replace(/^"|"$/g, '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim()
                  if (bullet.length > 0) {
                    bullets.push(bullet)
                  }
                })
              }
            }
            
            if (title || bullets.length > 0) {
              slides.push({ title: title || 'Untitled Slide', bullets })
            }
          }
        })
      }
    } catch (e) {
      console.error('Manual parse error:', e)
    }
    return slides
  }

  // Helper function to extract slides from text if JSON parsing fails
  const extractSlidesFromText = (text) => {
    const slides = []
    const lines = text.split('\n')
    let currentSlide = null
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // Look for slide titles (lines that look like titles)
      if (trimmed.match(/^["']?title["']?\s*[:=]\s*["'](.+)["']/i) || 
          trimmed.match(/^Slide \d+[:.]\s*(.+)/i) ||
          (trimmed.length > 10 && trimmed.length < 100 && !trimmed.includes('[') && !trimmed.includes(']'))) {
        if (currentSlide && currentSlide.bullets.length > 0) {
          slides.push(currentSlide)
        }
        const titleMatch = trimmed.match(/["'](.+)["']/) || trimmed.match(/Slide \d+[:.]\s*(.+)/i)
        currentSlide = {
          title: titleMatch ? titleMatch[1] : trimmed,
          bullets: []
        }
      }
      // Look for bullet points
      else if (trimmed.match(/^[-•*]\s*(.+)/) || trimmed.match(/^\d+[.)]\s*(.+)/)) {
        if (currentSlide) {
          const bulletMatch = trimmed.match(/^[-•*\d+.)]\s*(.+)/)
          if (bulletMatch && bulletMatch[1].trim().length > 5) {
            currentSlide.bullets.push(bulletMatch[1].trim())
          }
        }
      }
    }
    
    if (currentSlide && currentSlide.bullets.length > 0) {
      slides.push(currentSlide)
    }
    
    return slides
  }

  // Fallback function to generate slides directly from report data
  const generateSlidesFromReport = (reportData) => {
    const generatedSlides = []
    
    // Slide 1: Executive Summary (if available)
    if (reportData.executiveSummary) {
      const summarySentences = reportData.executiveSummary
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .slice(0, 5)
      
      if (summarySentences.length > 0) {
        generatedSlides.push({
          title: 'Executive Summary',
          bullets: summarySentences.map(s => s.trim()),
          design: { layout: 'content', visualType: 'none', colorScheme: 'professional' },
          priority: 'high'
        })
      }
    }
    
    // Slides 2-4: Key Findings (split across multiple slides if needed)
    if (Array.isArray(reportData.keyFindings) && reportData.keyFindings.length > 0) {
      const findingsPerSlide = 3
      for (let i = 0; i < reportData.keyFindings.length; i += findingsPerSlide) {
        const slideFindings = reportData.keyFindings
          .slice(i, i + findingsPerSlide)
          .map(f => f.text || f)
          .filter(f => f && typeof f === 'string' && f.trim().length > 0)
        
        if (slideFindings.length > 0) {
          generatedSlides.push({
            title: i === 0 ? 'Key Findings' : `Key Findings (${Math.floor(i / findingsPerSlide) + 1})`,
            bullets: slideFindings,
            design: { layout: 'content', visualType: 'none', colorScheme: 'professional' },
            priority: 'high'
          })
        }
      }
    }
    
    // Slide: Detailed Analysis (if available)
    if (reportData.detailedAnalysis) {
      const analysisParagraphs = reportData.detailedAnalysis
        .split(/\n\n+/)
        .filter(p => p.trim().length > 30)
        .slice(0, 4)
        .map(p => {
          // Extract first sentence or truncate to 150 chars
          const firstSentence = p.split(/[.!?]+/)[0]
          return firstSentence.length > 150 
            ? firstSentence.substring(0, 147) + '...'
            : firstSentence.trim()
        })
        .filter(p => p.length > 0)
      
      if (analysisParagraphs.length > 0) {
        generatedSlides.push({
          title: 'Detailed Analysis',
          bullets: analysisParagraphs,
          design: { layout: 'content', visualType: 'none', colorScheme: 'professional' },
          priority: 'medium'
        })
      }
    }
    
    // Slide: Insights (if available)
    if (reportData.insights) {
      const insightSentences = reportData.insights
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .slice(0, 5)
      
      if (insightSentences.length > 0) {
        generatedSlides.push({
          title: 'Insights & Implications',
          bullets: insightSentences.map(s => s.trim()),
          design: { layout: 'content', visualType: 'none', colorScheme: 'professional' },
          priority: 'medium'
        })
      }
    }
    
    // Slide: Conclusion (if available)
    if (reportData.conclusion) {
      const conclusionSentences = reportData.conclusion
        .split(/[.!?]+/)
        .filter(s => s.trim().length > 20)
        .slice(0, 5)
      
      if (conclusionSentences.length > 0) {
        generatedSlides.push({
          title: 'Conclusion & Recommendations',
          bullets: conclusionSentences.map(s => s.trim()),
          design: { layout: 'content', visualType: 'none', colorScheme: 'professional' },
          priority: 'high'
        })
      }
    }
    
    return generatedSlides
  }

  // Poll Level-6 job status
  const pollLevel6Job = async (jobId) => {
    try {
      const { data, error } = await supabase
        .from('slide_jobs')
        .select('status, final_ppt_url, error_message')
        .eq('id', jobId)
        .single()

      if (error) throw error

      setLevel6JobStatus(data.status)
      
      if (data.status === 'done' && data.final_ppt_url) {
        setLevel6PptUrl(data.final_ppt_url)
        setLevel6Error(null)
        setIsGeneratingSlides(false)
        return true // Job complete
      } else if (data.status === 'failed') {
        setLevel6Error(data.error_message || 'Job failed')
        setIsGeneratingSlides(false)
        return true // Job failed
      } else if (data.status === 'processing') {
        // Continue polling
        setTimeout(() => pollLevel6Job(jobId), 2000)
        return false // Still processing
      } else {
        // Pending - continue polling
        setTimeout(() => pollLevel6Job(jobId), 2000)
        return false
      }
    } catch (err) {
      console.error('Error polling Level-6 job:', err)
      const errorMsg = err && err.message ? err.message : 'Failed to poll job status'
      setLevel6Error(errorMsg)
      setIsGeneratingSlides(false)
      return true // Stop polling on error
    }
  }

  const handleGenerateSlides = async () => {
    if (!report) return
    setIsGeneratingSlides(true)
    setSlidesError('')
    setSlides([])
    setAgentRecommendations(null)
    setLevel6Error(null)
    setLevel6JobId(null)
    setLevel6JobStatus(null)
    setLevel6PptUrl(null)

    // MATURE APPROACH: Only use storyboard if it already exists (don't auto-generate)
    // This prevents unnecessary API calls and rate limit issues
    // Users can explicitly generate storyboard via the "Generate Storyboard" button if they want it
    let storyboardData = storyboard // Use existing storyboard if available
    
    if (storyboardData) {
      console.log('✅ Using existing storyboard for PPT generation')
    } else {
      console.log('ℹ️ No storyboard found. Using report data directly for PPT (faster, no extra API calls)')
    }

    // If Level-6 is enabled, use create-ppt-job
    if (useLevel6) {
      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Please log in to use Level-6 rendering')
        }

        // First, generate slides using the agent (for preview)
        // Use storyboard data if available, otherwise use report
        const storyboardHash = storyboardData ? JSON.stringify({
          controllingInsight: storyboardData.controllingInsight?.substring(0, 50),
          frames: storyboardData.frames?.length || 0
        }).substring(0, 100).replace(/\s/g, '') : ''
        const reportHash = JSON.stringify({
          topic: research?.topic || report.topic,
          style: presentationStyle,
          keyFindings: report.keyFindings?.length || 0
        }).substring(0, 100).replace(/\s/g, '')
        const cacheKey = `ppt_slides_${id}_${storyboardHash || reportHash}`
        
        const cached = rateLimitHandler.getCache(cacheKey)
        let slidesData = cached?.slides

        if (!slidesData) {
          try {
            // Generate slides for preview (using storyboard if available)
            const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-ppt-agent`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                storyboard: storyboardData || null, // Use storyboard if available
                report: storyboardData ? null : { // Only send report if no storyboard
                  topic: research?.topic || report.topic,
                  executiveSummary: report.executiveSummary,
                  detailedAnalysis: report.detailedAnalysis,
                  ingestedContent: research?.options?.ingestedContent || null,
                  keyFindings: report.keyFindings,
                  insights: report.insights,
                  conclusion: report.conclusion,
                  sources: report.sources
                },
                presentationStyle: presentationStyle,
                slideCount: 10
              }),
            })

            if (response.ok) {
              const data = await response.json()
              if (data.status === 'success' && data.slides) {
                slidesData = data.slides
              }
            }
          } catch (fetchError) {
            console.warn('Failed to generate preview slides, continuing with empty slides:', fetchError)
            slidesData = []
          }
        }

        // Create Level-6 job
        const jobResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-ppt-job`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            research_id: id,
            slides: slidesData || [],
            template: 'default',
            presentation_style: presentationStyle
          }),
        })

        if (!jobResponse.ok) {
          const errorData = await jobResponse.json()
          throw new Error(errorData.error || 'Failed to create Level-6 job')
        }

        const jobData = await jobResponse.json()
        setLevel6JobId(jobData.job_id)
        setLevel6JobStatus('pending')
        
        // Show slides modal with preview
        if (slidesData) {
          const cleanedSlides = slidesData.map((slide) => ({
            title: slide.title || 'Untitled Slide',
            subtitle: slide.subtitle,
            bullets: Array.isArray(slide.bullets) ? slide.bullets : [],
            left_bullets: Array.isArray(slide.left_bullets) ? slide.left_bullets : undefined,
            right_bullets: Array.isArray(slide.right_bullets) ? slide.right_bullets : undefined,
            layout: slide.layout || 'title_and_bullets',
            imageData: slide.imageData
          }))
          setSlides(cleanedSlides)
        }
        
        setShowSlidesModal(true)
        
        // Start polling for job status
        pollLevel6Job(jobData.job_id)
        
        return
      } catch (error) {
        console.error('Level-6 job creation error:', error)
        const errorMessage = error?.message || 'Failed to create Level-6 job'
        setLevel6Error(errorMessage)
        setSlidesError(errorMessage)
        setIsGeneratingSlides(false)
        return
      }
    }

    // Original flow (non-Level-6) continues below...
    
    try {
      // Create cache key based on storyboard (if available) or report content and style
      const storyboardHash = storyboardData ? JSON.stringify({
        controllingInsight: storyboardData.controllingInsight?.substring(0, 50),
        frames: storyboardData.frames?.length || 0
      }).substring(0, 100).replace(/\s/g, '') : ''
      const reportHash = JSON.stringify({
        topic: research?.topic || report.topic,
        style: presentationStyle,
        keyFindings: report.keyFindings?.length || 0
      }).substring(0, 100).replace(/\s/g, '')
      const cacheKey = `ppt_slides_${id}_${storyboardHash || reportHash}`
      
      // Check cache first
      const cached = rateLimitHandler.getCache(cacheKey)
      if (cached && cached.slides && cached.slides.length > 0) {
        console.log('✅ Using cached PPT slides')
        setSlides(cached.slides)
        setAgentRecommendations(cached.recommendations)
        setShowSlidesModal(true)
        setIsGeneratingSlides(false)
        return
      }
    } catch (cacheError) {
      console.log('Cache check failed, proceeding with generation:', cacheError)
    }
    
    const maxRetries = 5
    let retryCount = 0
    let lastError = null
    
    while (retryCount <= maxRetries) {
      try {
        // Use storyboard data if available for cache key
        const storyboardHash = storyboardData ? JSON.stringify({
          controllingInsight: storyboardData.controllingInsight?.substring(0, 50),
          frames: storyboardData.frames?.length || 0
        }).substring(0, 100).replace(/\s/g, '') : ''
        const reportHash = JSON.stringify({
          topic: research?.topic || report.topic,
          style: presentationStyle,
          keyFindings: report.keyFindings?.length || 0
        }).substring(0, 100).replace(/\s/g, '')
        const cacheKey = `ppt_slides_${id}_${storyboardHash || reportHash}`
        
        // Use rateLimitHandler for throttling with timeout
        const response = await rateLimitHandler.request(
          cacheKey,
          async () => {
            // Add timeout to prevent hanging (60s for Supabase Edge Functions)
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 55000) // 55s timeout
            
            try {
              const fetchResponse = await fetch(`${SUPABASE_URL}/functions/v1/generate-ppt-agent`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  storyboard: storyboardData || null, // Use storyboard if available
                  report: storyboardData ? null : { // Only send report if no storyboard
                    topic: research?.topic || report.topic,
                    executiveSummary: report.executiveSummary,
                    detailedAnalysis: report.detailedAnalysis,
                    ingestedContent: research?.options?.ingestedContent || null, // Pass ingested content for enhanced PPT
                    keyFindings: report.keyFindings,
                    insights: report.insights,
                    conclusion: report.conclusion,
                    sources: report.sources
                  },
                  presentationStyle: presentationStyle,
                  slideCount: 10
                }),
                signal: controller.signal,
              })
              clearTimeout(timeoutId)
              return fetchResponse
            } catch (error) {
              clearTimeout(timeoutId)
              if (error.name === 'AbortError') {
                throw new Error('Request timeout. The PPT generation is taking too long. Please try again or use Level-6 rendering for faster processing.')
              }
              throw error
            }
          },
          false // Don't cache response object
        )

        let data
        try {
          const responseText = await response.text()
          if (responseText) {
            data = JSON.parse(responseText)
          }
        } catch (parseError) {
          // If response is not JSON, it might be an error page
          console.error('Non-JSON response from PPT Agent:', parseError)
          throw new Error('PPT Agent function returned invalid response. Please ensure the function is deployed correctly.')
        }
        
        console.log('PPT Agent response:', data)
        
        // Check for rate limit errors in response body (even with 200 status)
        if (response.status === 429 || 
            (data && (data.status === 429 || 
                     (data.error && (data.error.includes('Rate limit') || 
                                   data.error.includes('rate limit') || 
                                   data.error.includes('429')))))) {
          if (retryCount < maxRetries) {
            const backoffDelay = Math.min(30000 + (retryCount * 30000), 150000) // 30s, 60s, 90s, 120s, 150s
            retryCount++
            console.log(`Rate limit in PPT generation. Will retry in ${backoffDelay / 1000}s... (attempt ${retryCount}/${maxRetries})`)
            setSlidesError(`Rate limit reached. Retrying in ${Math.floor(backoffDelay / 1000)} seconds... (Attempt ${retryCount}/${maxRetries})`)
            setShowSlidesModal(true)
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay))
            continue // Retry the request
          } else {
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.')
          }
        }
        
        // Check if response indicates an error (even if HTTP status is 200)
        // Supabase may return 200 OK even when function doesn't exist
        if (!response.ok || data.status === 'error' || data.error || data.statusCode === 404) {
          const errorMessage = data.error || data.message || `Failed to generate slides (${response.status})`
          console.error('PPT generation error:', errorMessage, data)
          
          // Check for 404 in status code or response
          if (response.status === 404 || data.statusCode === 404 || 
              errorMessage.toLowerCase().includes('not found') ||
              errorMessage.toLowerCase().includes('404')) {
            throw new Error('PPT Agent function not deployed.\n\nTo fix:\n1. Go to Supabase Dashboard → Edge Functions\n2. Create/Deploy "generate-ppt-agent" function\n3. Copy code from supabase/functions/generate-ppt-agent/index.ts\n4. Ensure GEMINI_API_KEY is set in Supabase secrets\n5. Deploy and try again')
          }
          
          throw new Error(errorMessage)
        }
        
        // Check if we have slides data
        if (data.status === 'success' && data.slides && Array.isArray(data.slides)) {
          // Process slides - handle both new format (layout directly) and old format (design.layout)
          const cleanedSlides = data.slides.map((slide) => {
            // New format: layout is directly on slide
            const layout = slide.layout || slide.design?.layout || 'title_and_bullets'
            
            // Collect all bullets (bullets, left_bullets, right_bullets)
            const allBullets = [
              ...(Array.isArray(slide.bullets) ? slide.bullets : []),
              ...(Array.isArray(slide.left_bullets) ? slide.left_bullets : []),
              ...(Array.isArray(slide.right_bullets) ? slide.right_bullets : [])
            ].filter((b) => b && typeof b === 'string' && b.trim().length > 0)
            
            return {
              title: slide.title || 'Untitled Slide',
              subtitle: slide.subtitle,
              bullets: allBullets,
              left_bullets: Array.isArray(slide.left_bullets) ? slide.left_bullets.filter(b => b && typeof b === 'string') : undefined,
              right_bullets: Array.isArray(slide.right_bullets) ? slide.right_bullets.filter(b => b && typeof b === 'string') : undefined,
              timeline_items: Array.isArray(slide.timeline_items) ? slide.timeline_items : undefined,
              icons: Array.isArray(slide.icons) ? slide.icons : undefined,
              layout: layout,
              // Backward compatibility: maintain design object for old format
              design: slide.design || { layout: layout, visualType: 'none', colorScheme: 'professional' },
              speakerNotes: slide.speakerNotes || '',
              priority: slide.priority || 'medium'
            }
          }).filter((slide) => {
            // Keep slide if it has title and at least one content element
            return slide.title && (
              slide.bullets.length > 0 ||
              slide.left_bullets?.length > 0 ||
              slide.right_bullets?.length > 0 ||
              slide.timeline_items?.length > 0 ||
              slide.layout === 'title'
            )
          })
          
          if (cleanedSlides.length > 0) {
            const recommendations = {
              structure: data.presentationStructure || { totalSlides: cleanedSlides.length, estimatedDuration: Math.ceil(cleanedSlides.length * 1.5) },
              design: data.designRecommendations || {}
            }
            
            // Cache successful response
            const reportHash = JSON.stringify({
              topic: research?.topic || report.topic,
              style: presentationStyle,
              keyFindings: report.keyFindings?.length || 0
            }).substring(0, 100).replace(/\s/g, '')
            const cacheKey = `ppt_slides_${id}_${reportHash}`
            rateLimitHandler.setCache(cacheKey, {
              slides: cleanedSlides,
              recommendations: recommendations
            })
            
            setSlides(cleanedSlides)
            setAgentRecommendations(recommendations)
            setSlidesError('') // Clear any previous errors
            setShowSlidesModal(true)
            setIsGeneratingSlides(false)
            return // Success - exit function
          }
        } else if (data.slides && Array.isArray(data.slides)) {
          // Handle case where status is missing but slides exist (same processing)
          const cleanedSlides = data.slides.map((slide) => {
            const layout = slide.layout || slide.design?.layout || 'title_and_bullets'
            const allBullets = [
              ...(Array.isArray(slide.bullets) ? slide.bullets : []),
              ...(Array.isArray(slide.left_bullets) ? slide.left_bullets : []),
              ...(Array.isArray(slide.right_bullets) ? slide.right_bullets : [])
            ].filter((b) => b && typeof b === 'string' && b.trim().length > 0)
            
            return {
              title: slide.title || 'Untitled Slide',
              subtitle: slide.subtitle,
              bullets: allBullets,
              left_bullets: Array.isArray(slide.left_bullets) ? slide.left_bullets.filter(b => b && typeof b === 'string') : undefined,
              right_bullets: Array.isArray(slide.right_bullets) ? slide.right_bullets.filter(b => b && typeof b === 'string') : undefined,
              timeline_items: Array.isArray(slide.timeline_items) ? slide.timeline_items : undefined,
              icons: Array.isArray(slide.icons) ? slide.icons : undefined,
              layout: layout,
              design: slide.design || { layout: layout, visualType: 'none', colorScheme: 'professional' },
              speakerNotes: slide.speakerNotes || '',
              priority: slide.priority || 'medium'
            }
          }).filter((slide) => {
            return slide.title && (
              slide.bullets.length > 0 ||
              slide.left_bullets?.length > 0 ||
              slide.right_bullets?.length > 0 ||
              slide.timeline_items?.length > 0 ||
              slide.layout === 'title'
            )
          })
          
          if (cleanedSlides.length > 0) {
            const recommendations = {
              structure: data.presentationStructure || { totalSlides: cleanedSlides.length, estimatedDuration: Math.ceil(cleanedSlides.length * 1.5) },
              design: data.designRecommendations || {}
            }
            
            // Cache successful response
            const reportHash = JSON.stringify({
              topic: research?.topic || report.topic,
              style: presentationStyle,
              keyFindings: report.keyFindings?.length || 0
            }).substring(0, 100).replace(/\s/g, '')
            const cacheKey = `ppt_slides_${id}_${reportHash}`
            rateLimitHandler.setCache(cacheKey, {
              slides: cleanedSlides,
              recommendations: recommendations
            })
            
            setSlides(cleanedSlides)
            setAgentRecommendations(recommendations)
            setSlidesError('') // Clear any previous errors
            setShowSlidesModal(true)
            setIsGeneratingSlides(false)
            return // Success - exit function
          }
        } else {
          // Log the actual response for debugging
          console.error('Unexpected response format:', data)
          console.error('Response keys:', Object.keys(data))
          console.error('Has slides?', !!data.slides, 'Is array?', Array.isArray(data.slides))
          throw new Error(data.error || data.message || `Invalid response format from agent. Expected slides array. Got: ${JSON.stringify(data).substring(0, 200)}`)
        }
        
      } catch (error) {
        lastError = error
        
        // Check if it's a rate limit error in the catch block
        const errorMessage = error.message || ''
        if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          if (retryCount < maxRetries) {
            const backoffDelay = Math.min(30000 + (retryCount * 30000), 150000)
            retryCount++
            console.log(`Rate limit error caught. Will retry in ${backoffDelay / 1000}s... (attempt ${retryCount}/${maxRetries})`)
            setSlidesError(`Rate limit reached. Retrying in ${Math.floor(backoffDelay / 1000)} seconds... (Attempt ${retryCount}/${maxRetries})`)
            setShowSlidesModal(true)
            
            await new Promise(resolve => setTimeout(resolve, backoffDelay))
            continue // Retry the request
          } else {
            setSlidesError('Rate limit exceeded. Please wait a few minutes and try again.')
            setShowSlidesModal(true)
            setIsGeneratingSlides(false)
            return
          }
        }
        
        // For non-rate-limit errors, break out of retry loop
        console.error('Error generating slides:', error)
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        
        let finalErrorMessage = error.message || 'Failed to generate slides. Please try again.'
        
        // Error message already includes deployment instructions if it's a 404
        setSlidesError(finalErrorMessage)
        setShowSlidesModal(true)
        setIsGeneratingSlides(false)
        return
      }
    }
    
    // If we've exhausted all retries
    if (lastError) {
      setSlidesError(lastError.message || 'Failed to generate slides after multiple attempts. Please try again later.')
      setShowSlidesModal(true)
    }
    setIsGeneratingSlides(false)
  }

  // Extract clean user query only (removes all extra formatting)
  const extractCleanQuery = (topic) => {
    if (!topic) return 'Research Report'
    
    let cleanQuery = topic
    
    // Remove "Research topic:" prefix if present
    cleanQuery = cleanQuery.replace(/^Research topic:\s*/i, '').trim()
    
    // Remove "Research objective:" and everything after it
    cleanQuery = cleanQuery.split(/Research objective:/i)[0].trim()
    
    // Remove "Clarifications:" and everything after it
    cleanQuery = cleanQuery.split(/Clarifications?:/i)[0].trim()
    
    // Remove "Please conduct" instruction if present
    cleanQuery = cleanQuery.split(/Please conduct/i)[0].trim()
    
    // Get first line only (the actual user query)
    const lines = cleanQuery.split('\n').filter(line => line.trim().length > 0)
    cleanQuery = lines[0] || 'Research Report'
    
    return cleanQuery.trim()
  }

  // Extract clean title and description from research topic
  const extractTitleAndDescription = (topic, executiveSummary) => {
    let cleanTitle = extractCleanQuery(topic)
    
    // Limit length for title
    if (cleanTitle.length > 60) {
      cleanTitle = cleanTitle.substring(0, 57) + '...'
    }
    
    // Create description from executive summary (first 2 sentences, max 120 chars)
    let description = 'Comprehensive Research Analysis'
    if (executiveSummary) {
      const sentences = executiveSummary.split(/[.!?]+/).filter(s => s.trim().length > 10)
      if (sentences.length > 0) {
        description = sentences.slice(0, 2).join('. ').trim()
        if (description.length > 120) {
          description = description.substring(0, 117) + '...'
        }
        if (!description.endsWith('.') && !description.endsWith('!') && !description.endsWith('?')) {
          description += '.'
        }
      }
    }
    
    return { title: cleanTitle, description }
  }

  // Theme presets
  const themePresets = {
    professional: {
      primaryColor: '0F172A',
      secondaryColor: '1E40AF',
      accentColor: '3B82F6',
      backgroundColor: 'F8FAFC',
      fontFamily: 'Calibri'
    },
    modern: {
      primaryColor: '1A1A2E',
      secondaryColor: '16213E',
      accentColor: '0F3460',
      backgroundColor: 'FFFFFF',
      fontFamily: 'Arial'
    },
    creative: {
      primaryColor: '6B46C1',
      secondaryColor: '8B5CF6',
      accentColor: 'A78BFA',
      backgroundColor: 'FAF5FF',
      fontFamily: 'Georgia'
    },
    minimal: {
      primaryColor: '1F2937',
      secondaryColor: '4B5563',
      accentColor: '6B7280',
      backgroundColor: 'FFFFFF',
      fontFamily: 'Helvetica'
    },
    dark: {
      primaryColor: 'FFFFFF',
      secondaryColor: 'E5E7EB',
      accentColor: '60A5FA',
      backgroundColor: '111827',
      fontFamily: 'Calibri'
    },
    corporate: {
      primaryColor: '003366',
      secondaryColor: '0066CC',
      accentColor: '0099FF',
      backgroundColor: 'F0F8FF',
      fontFamily: 'Arial'
    }
  }

  const applyTheme = (themeName) => {
    const theme = themePresets[themeName]
    if (theme) {
      setPptSettings(prev => ({
        ...prev,
        theme: themeName,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily
      }))
    }
  }

  const handleDownloadPPTX = async () => {
    if (slides.length === 0) {
      alert('Please generate slides first')
      return
    }
    
    if (!report) {
      alert('Report data not available')
      return
    }
    
    setIsGeneratingSlides(true)
    try {
      const pptx = new pptxgen()
      
      // Set presentation properties
      pptx.author = 'AskDepth Research'
      pptx.company = 'AskDepth'
      const { title: cleanTitle, description: cleanDescription } = extractTitleAndDescription(
        research?.topic || report.topic,
        report.executiveSummary
      )
      pptx.title = cleanTitle
      
      // Use settings from state
      pptx.layout = pptSettings.layout
      
      // Extract colors from settings
      const primaryColor = pptSettings.primaryColor
      const secondaryColor = pptSettings.secondaryColor
      const accentColor = pptSettings.accentColor
      const backgroundColor = pptSettings.backgroundColor
      const fontFamily = pptSettings.fontFamily
      
      // Derived colors based on theme
      const textDark = pptSettings.theme === 'dark' ? 'FFFFFF' : '0F172A'
      const textGray = pptSettings.theme === 'dark' ? 'E5E7EB' : '475569'
      const textLight = pptSettings.theme === 'dark' ? 'D1D5DB' : '64748B'
      const whiteBg = 'FFFFFF'
      const lightBg = backgroundColor
      const borderColor = pptSettings.theme === 'dark' ? '374151' : 'E2E8F0'
      
      // Accent colors for highlights
      const accentYellow = pptSettings.theme === 'dark' ? 'FBBF24' : 'F59E0B'
      const accentPurple = pptSettings.theme === 'dark' ? 'A78BFA' : '8B5CF6'
      
      // Helper function to split text into chunks that fit on slide
      const splitTextForSlide = (text, maxLength = 600) => {
        if (!text) return []
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
        const chunks = []
        let currentChunk = ''
        
        sentences.forEach(sentence => {
          const trimmed = sentence.trim()
          if ((currentChunk + ' ' + trimmed).length > maxLength && currentChunk) {
            chunks.push(currentChunk.trim())
            currentChunk = trimmed
          } else {
            currentChunk += (currentChunk ? ' ' : '') + trimmed
          }
        })
        if (currentChunk) chunks.push(currentChunk.trim())
        return chunks
      }
      
      // Helper function to add image to slide with proper fitting
      const addImageToSlide = async (slideObj, imageData, slideWidth, slideHeight, headerHeight) => {
        if (!imageData || !imageData.url) return
        
        try {
          const imagePosition = imageData.position || 'right'
          // Adjust image size based on position
          let imageWidth, imageHeight
          if (imagePosition === 'center') {
            imageWidth = 6.0 // Larger for center position
            imageHeight = 3.5
          } else {
            imageWidth = 3.5 // Standard size for side positions
            imageHeight = 3.0
          }
          
          let imageX, imageY
          
          // Position image based on setting
          if (imagePosition === 'left') {
            imageX = 0.3
            imageY = headerHeight + 0.3
          } else if (imagePosition === 'center') {
            imageX = (slideWidth - imageWidth) / 2
            imageY = headerHeight + 0.5
          } else { // right (default)
            imageX = slideWidth - imageWidth - 0.3
            imageY = headerHeight + 0.3
          }
          
          // Add image with proper sizing (contain to maintain aspect ratio and fit properly)
          slideObj.addImage({
            path: imageData.url,
            x: imageX,
            y: imageY,
            w: imageWidth,
            h: imageHeight,
            sizing: {
              type: 'contain', // Maintains aspect ratio, fits within bounds without distortion
              w: imageWidth,
              h: imageHeight
            },
            hyperlink: imageData.url, // Make image clickable to source
            rounding: pptSettings.roundedCorners ? 0.15 : 0, // Rounded corners if enabled
            shadow: pptSettings.shadowEffect ? { 
              type: 'outer', 
              angle: 45, 
              blur: 8, 
              offset: 3, 
              opacity: 0.25,
              color: '000000'
            } : undefined,
            // Add border if border style is enabled
            line: pptSettings.borderStyle !== 'none' ? {
              color: accentColor,
              width: pptSettings.borderWidth === 'thick' ? 3 : pptSettings.borderWidth === 'thin' ? 1 : 2,
              dashType: pptSettings.borderStyle === 'dashed' ? 'dash' : pptSettings.borderStyle === 'dotted' ? 'dot' : 'solid'
            } : undefined
          })
          
          // Add image caption if description available
          if (imageData.description) {
            slideObj.addText(imageData.description, {
              x: imageX,
              y: imageY + imageHeight + 0.15,
              w: imageWidth,
              h: 0.25,
              fontSize: 9,
              color: textGray,
              fontFace: fontFamily,
              align: 'center',
              italic: true,
              lineSpacing: 12
            })
          }
        } catch (error) {
          console.warn('Failed to add image to slide:', error)
          // Continue without image if it fails - don't break the entire PPT generation
        }
      }
      
      // Premium content slide creator with advanced styling
      const createContentSlide = async (slideObj, slideNum, title, contentItems, imageData = null) => {
        // Ensure content fits within slide (10" x 5.625" for 16:9)
        const slideWidth = 10
        const slideHeight = 5.625
        
        // Header height based on settings
        const headerHeightMap = { small: 0.8, normal: 1.0, large: 1.2 }
        const headerHeight = headerHeightMap[pptSettings.headerHeight] || 1.0
        
        // Content padding based on settings
        const paddingMap = { tight: 0.8, normal: 1.0, spacious: 1.2 }
        const contentPadding = paddingMap[pptSettings.contentPadding] || 1.0
        
        // Background based on settings
        if (pptSettings.backgroundType === 'gradient') {
          slideObj.background = { color: lightBg }
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: slideWidth,
            h: slideHeight,
            fill: {
              type: 'solid',
              color: lightBg,
              transparency: 0
            },
            line: { color: lightBg, width: 0 },
          })
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: slideWidth,
            h: slideHeight,
            fill: {
              type: 'solid',
              color: backgroundColor,
              transparency: 50
            },
            line: { color: backgroundColor, width: 0 },
          })
        } else {
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: slideWidth,
            h: slideHeight,
            fill: { color: lightBg },
            line: { color: lightBg, width: 0 },
          })
        }
        
        // Header bar (only if accent bar position includes top)
        if (pptSettings.accentBarPosition === 'top' || pptSettings.accentBarPosition === 'both') {
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: slideWidth,
            h: headerHeight,
            fill: { color: primaryColor },
            line: { color: primaryColor, width: 0 },
          })
          
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: slideWidth * 0.4,
            h: headerHeight,
            fill: { color: accentColor },
            line: { color: accentColor, width: 0 },
            transparency: 30,
          })
        }
        
        // Slide number badge (only if enabled)
        if (pptSettings.showSlideNumbers) {
          const badgeShape = pptSettings.roundedCorners ? pptx.ShapeType.roundRect : pptx.ShapeType.ellipse
          slideObj.addShape(badgeShape, {
            x: 0.5,
            y: headerHeight * 0.25,
            w: 0.5,
            h: 0.5,
            fill: { color: accentYellow },
            line: { color: 'FFFFFF', width: pptSettings.borderWidth === 'thick' ? 3 : pptSettings.borderWidth === 'thin' ? 1 : 2 },
          })
          
          slideObj.addText(`${slideNum}`, {
            x: 0.5,
            y: headerHeight * 0.25,
            w: 0.5,
            h: 0.5,
            fontSize: 18,
            bold: true,
            color: primaryColor,
            fontFace: fontFamily,
            align: 'center',
            valign: 'middle',
          })
        }
        
        // Slide title
        const titleAlign = pptSettings.textAlignment === 'center' ? 'center' : pptSettings.textAlignment === 'right' ? 'right' : 'left'
        slideObj.addText(title, {
          x: pptSettings.showSlideNumbers ? 1.2 : 0.5,
          y: headerHeight * 0.3,
          w: pptSettings.showSlideNumbers ? 8.0 : 9.0,
          h: headerHeight * 0.4,
          fontSize: 26,
          bold: true,
          color: pptSettings.accentBarPosition === 'top' || pptSettings.accentBarPosition === 'both' ? 'FFFFFF' : primaryColor,
          fontFace: fontFamily,
          align: titleAlign,
          valign: 'middle',
        })
        
        // Adjust content area if image is present
        const hasImage = imageData && imageData.url
        const imagePosition = imageData?.position || 'right'
        
        // Content area with improved padding and spacing
        if (contentItems && contentItems.length > 0) {
          const maxItems = Math.min(contentItems.length, 5)
          const lineSpacingMap = { tight: 18, normal: 22, loose: 26 }
          const itemHeight = 0.85
          const startY = headerHeight + (contentPadding * 0.2)
          
          // Adjust content width and position based on image
          let contentWidth, contentX
          if (hasImage && (imagePosition === 'left' || imagePosition === 'right')) {
            contentWidth = 5.5 // Narrower when image is on side
            contentX = imagePosition === 'left' ? 4.0 : contentPadding // Shift right if image on left
          } else {
            contentWidth = 8.2 // Full width if no image or center image
            contentX = contentPadding
          }
          
          const bulletSize = 0.12
          
          // Create bullet points with enhanced formatting
          contentItems.slice(0, maxItems).forEach((item, idx) => {
            const cleanText = typeof item === 'string' 
              ? item.replace(/^[•\-\*\d+.)]\s*/, '').trim() 
              : (item.text || String(item)).trim()
            
            // Truncate text to fit (max 120 chars per line for better readability)
            const maxChars = 120
            const displayText = cleanText.length > maxChars 
              ? cleanText.substring(0, maxChars - 3) + '...' 
              : cleanText
            
            const yPos = startY + (idx * itemHeight)
            
            // Bullet icon based on style
            if (pptSettings.bulletStyle !== 'none') {
              let bulletShape = pptx.ShapeType.ellipse
              if (pptSettings.bulletStyle === 'square') bulletShape = pptx.ShapeType.rect
              else if (pptSettings.bulletStyle === 'arrow') bulletShape = pptx.ShapeType.triangle
              
              const bulletFill = pptSettings.iconStyle === 'outline' ? { type: 'solid', color: 'FFFFFF', transparency: 100 } : { color: accentColor }
              const bulletLine = pptSettings.iconStyle === 'outline' ? { color: accentColor, width: 2 } : { color: secondaryColor, width: 1.5 }
              
              slideObj.addShape(bulletShape, {
                x: contentX,
                y: yPos + 0.2,
                w: bulletSize,
                h: bulletSize,
                fill: bulletFill,
                line: bulletLine,
              })
              
              // Inner highlight for filled style
              if (pptSettings.iconStyle === 'filled' && pptSettings.bulletStyle !== 'arrow') {
                slideObj.addShape(pptx.ShapeType.ellipse, {
                  x: contentX + 0.02,
                  y: yPos + 0.22,
                  w: bulletSize * 0.6,
                  h: bulletSize * 0.6,
                  fill: { color: 'FFFFFF' },
                  line: { color: 'FFFFFF', width: 0 },
                  transparency: 40,
                })
              }
            }
            
            // Bullet text (enhanced typography)
            const fontSizeMap = { small: 13, normal: 15, large: 17 }
            const textAlign = pptSettings.textAlignment === 'center' ? 'center' : pptSettings.textAlignment === 'right' ? 'right' : 'left'
            slideObj.addText(displayText, {
              x: contentX + (pptSettings.bulletStyle !== 'none' ? 0.35 : 0),
              y: yPos,
              w: contentWidth - (pptSettings.bulletStyle !== 'none' ? 0.35 : 0),
              h: itemHeight - 0.1,
              fontSize: fontSizeMap[pptSettings.fontSize] || 15,
              fontFace: fontFamily,
              color: textDark,
              align: textAlign,
              valign: 'top',
              lineSpacing: lineSpacingMap[pptSettings.lineSpacing] || 22,
              bullet: false,
            })
          })
        }
        
        // Bottom accent bar (only if enabled)
        if (pptSettings.accentBarPosition === 'bottom' || pptSettings.accentBarPosition === 'both') {
          const bottomBarHeight = 0.15
          const bottomBarY = slideHeight - bottomBarHeight
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: bottomBarY,
            w: slideWidth,
            h: bottomBarHeight,
            fill: { color: secondaryColor },
            line: { color: secondaryColor, width: 0 },
          })
        }
        
        // Left accent border
        if (pptSettings.borderStyle !== 'none') {
          const leftBorderWidth = pptSettings.borderWidth === 'thick' ? 0.15 : pptSettings.borderWidth === 'thin' ? 0.08 : 0.12
          const leftBorderStartY = headerHeight
          const bottomBarY = (pptSettings.accentBarPosition === 'bottom' || pptSettings.accentBarPosition === 'both') ? slideHeight - 0.15 : slideHeight
          const leftBorderHeight = bottomBarY - leftBorderStartY
          
          const borderLineStyle = pptSettings.borderStyle === 'dashed' ? 'dash' : pptSettings.borderStyle === 'dotted' ? 'dot' : 'solid'
          
          slideObj.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: leftBorderStartY,
            w: leftBorderWidth,
            h: leftBorderHeight,
            fill: { color: accentPurple },
            line: { color: accentPurple, width: 0 },
          })
          
          // Shadow effect
          if (pptSettings.shadowEffect) {
            slideObj.addShape(pptx.ShapeType.rect, {
              x: leftBorderWidth,
              y: leftBorderStartY,
              w: 0.05,
              h: leftBorderHeight,
              fill: { color: borderColor },
              line: { color: borderColor, width: 0 },
            })
          }
        }
        
        // Footer (if enabled)
        if (pptSettings.showFooter) {
          slideObj.addText(pptSettings.footerText, {
            x: 0.5,
            y: slideHeight - 0.3,
            w: slideWidth - 1,
            h: 0.2,
            fontSize: 10,
            color: textGray,
            fontFace: fontFamily,
            align: 'left',
          })
        }
        
        // Add image if provided (after all other content)
        if (hasImage) {
          await addImageToSlide(slideObj, imageData, slideWidth, slideHeight, headerHeight)
        }
      }
      
      let slideNumber = 1
      
      // Slide 1: Premium Title Slide with advanced styling
      const titleSlide = pptx.addSlide()
      
      // Background based on settings
      if (pptSettings.backgroundType === 'gradient') {
        titleSlide.background = { color: lightBg }
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 10,
          h: 5.625,
          fill: {
            type: 'solid',
            color: lightBg,
            transparency: 0
          },
          line: { color: lightBg, width: 0 },
        })
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 10,
          h: 5.625,
          fill: {
            type: 'solid',
            color: backgroundColor,
            transparency: 50
          },
          line: { color: backgroundColor, width: 0 },
        })
      } else {
        titleSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 10,
          h: 5.625,
          fill: { color: lightBg },
          line: { color: lightBg, width: 0 },
        })
      }
      
      // Top gradient header bar (no gaps - seamless)
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 0.6,
        fill: { color: primaryColor },
        line: { color: primaryColor, width: 0 },
      })
      
      // Gradient overlay on header (seamless connection)
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 10,
        h: 0.6,
        fill: { color: accentColor },
        line: { color: accentColor, width: 0 },
        transparency: 25,
      })
      
      // Bottom accent bar (seamless - connects to slide bottom edge)
      const titleBottomBarHeight = 0.6
      const titleBottomBarY = 5.625 - titleBottomBarHeight
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: titleBottomBarY,
        w: 10,
        h: titleBottomBarHeight,
        fill: { color: accentYellow },
        line: { color: accentYellow, width: 0 },
      })
      
      // Decorative accent on bottom bar (seamless - same Y position)
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: titleBottomBarY,
        w: 3,
        h: titleBottomBarHeight,
        fill: { color: accentPurple },
        line: { color: accentPurple, width: 0 },
        transparency: 30,
      })
      
      // Title slide style based on settings
      const titleAlign = pptSettings.titleSlideStyle === 'left' ? 'left' : pptSettings.titleSlideStyle === 'minimal' ? 'left' : 'center'
      const titleX = pptSettings.titleSlideStyle === 'left' ? 1.2 : 1.2
      const titleW = pptSettings.titleSlideStyle === 'left' ? 7.6 : 7.6
      
      // Main title (Line 1)
      titleSlide.addText(cleanTitle, {
        x: titleX,
        y: pptSettings.titleSlideStyle === 'minimal' ? 2.5 : 2.0,
        w: titleW,
        h: 1.0,
        fontSize: 48,
        bold: true,
        color: primaryColor,
        fontFace: fontFamily,
        align: titleAlign,
        valign: 'middle',
        lineSpacing: 28,
      })
      
      // Description (Line 2)
      if (pptSettings.titleSlideStyle !== 'minimal') {
        titleSlide.addText(cleanDescription, {
          x: 1.5,
          y: 3.2,
          w: 7.0,
          h: 0.8,
          fontSize: 22,
          color: textGray,
          fontFace: fontFamily,
          align: titleAlign,
          valign: 'middle',
          italic: true,
          lineSpacing: 24,
        })
      }
      
      // Decorative left border (seamless - connects to header)
      titleSlide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0.6,
        w: 0.15,
        h: 4.425,
        fill: { color: accentPurple },
        line: { color: accentPurple, width: 0 },
      })
      
      slideNumber++
      
      // Slide 2: Executive Summary (if available)
      if (report.executiveSummary) {
        const execSummarySlide = pptx.addSlide()
        const summaryChunks = splitTextForSlide(report.executiveSummary, 500)
        const summaryBullets = summaryChunks.slice(0, 5) // Max 5 bullets per slide
        await createContentSlide(execSummarySlide, slideNumber, 'Executive Summary', summaryBullets)
        slideNumber++
      }
      
      // Slides 3+: Premium content slides with consistent design
      for (const slide of slides) {
        const slideTitle = slide.title || `Key Insight ${slides.indexOf(slide) + 1}`
        const contentItems = slide.bullets ? slide.bullets.slice(0, 6) : []
        
        if (contentItems.length === 0) continue
        
        // Use standard premium layout for all slides (ensures consistency and editability)
        const slideObj = pptx.addSlide()
        await createContentSlide(slideObj, slideNumber, slideTitle, contentItems, slide.image)
        slideNumber++
      }
      
      // Last slide: Sources (if available)
      if (Array.isArray(report.sources) && report.sources.length > 0) {
        const sourcesSlide = pptx.addSlide()
        const sourceItems = report.sources.slice(0, 8).map((s, idx) =>
          `${s.title || s.domain || 'Source'} - ${s.date || 'N/A'}`
        )
        await createContentSlide(sourcesSlide, slideNumber, 'Sources & References', sourceItems)
      }
      
      // Generate and download the file
      const filename = `${(research?.topic || report.topic || 'Research').replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_Presentation.pptx`
      await pptx.writeFile({ fileName: filename })
      
    } catch (error) {
      console.error('Error generating PowerPoint:', error)
      alert(error.message || 'Failed to generate PowerPoint. Please try again.')
    } finally {
      setIsGeneratingSlides(false)
    }
  }

  const handleDownloadSlides = () => {
    if (slides.length === 0) return
    
    // Create premium HTML presentation with only slide content
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium Slide Presentation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
            line-height: 1.7;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            background-attachment: fixed;
            padding: 50px 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 30px 80px rgba(0, 31, 63, 0.25), 0 10px 30px rgba(0, 0, 0, 0.1);
            padding: 50px;
            position: relative;
            overflow: hidden;
        }
        .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #001F3F 0%, #0052A3 50%, #001F3F 100%);
        }
        .slide {
            margin-bottom: 50px;
            padding: 35px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0, 31, 63, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid #e8ecf0;
            position: relative;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .slide:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 31, 63, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .slide::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 6px;
            background: linear-gradient(180deg, #0052A3 0%, #001F3F 100%);
            border-radius: 16px 0 0 16px;
        }
        .slide-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e8ecf0;
        }
        .slide-number {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #0052A3 0%, #001F3F 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0, 82, 163, 0.3);
            flex-shrink: 0;
        }
        .slide-title {
            font-size: 28px;
            font-weight: 700;
            color: #001F3F;
            letter-spacing: -0.5px;
            line-height: 1.3;
        }
        .slide-content {
            margin-left: 70px;
            padding-top: 8px;
        }
        .slide-content ul {
            list-style: none;
            padding-left: 0;
        }
        .slide-content li {
            padding: 14px 0;
            padding-left: 32px;
            position: relative;
            color: #2c3e50;
            font-size: 17px;
            line-height: 1.6;
            transition: color 0.2s ease;
        }
        .slide-content li:hover {
            color: #001F3F;
        }
        .slide-content li::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 20px;
            width: 8px;
            height: 8px;
            background: linear-gradient(135deg, #0052A3 0%, #001F3F 100%);
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 82, 163, 0.3);
        }
        .slide-content li::after {
            content: '';
            position: absolute;
            left: 11px;
            top: 23px;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
        }
        @media print {
            body {
                background: white;
                padding: 20px;
            }
            .container {
                box-shadow: none;
                border: 1px solid #ddd;
            }
            .slide {
                page-break-inside: avoid;
                margin-bottom: 30px;
            }
            .slide:hover {
                transform: none;
            }
        }
        @media (max-width: 768px) {
            body {
                padding: 20px 10px;
            }
            .container {
                padding: 30px 20px;
                border-radius: 16px;
            }
            .slide {
                padding: 25px;
                margin-bottom: 30px;
            }
            .slide-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
            .slide-number {
                width: 45px;
                height: 45px;
                font-size: 18px;
            }
            .slide-title {
                font-size: 24px;
            }
            .slide-content {
                margin-left: 0;
                margin-top: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${slides.map((slide, index) => `
        <div class="slide">
            <div class="slide-header">
                <div class="slide-number">${index + 1}</div>
                <div class="slide-title">${slide.title || `Slide ${index + 1}`}</div>
            </div>
            <div class="slide-content">
                <ul>
                    ${(slide.bullets || []).map(bullet => `<li>${bullet}</li>`).join('')}
                </ul>
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = `Slide_Outline_${new Date().toISOString().split('T')[0]}.html`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <>
    <div className="pt-16 min-h-screen bg-white transition-all duration-300">
      <div className="max-w-[98%] mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#666666] hover:text-[#000000] mb-6 transition-all duration-200 group text-sm font-normal"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Home
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 lg:gap-4">
          <div className="xl:col-span-2 space-y-4">
            <div className="animate-fadeIn">
              {/* Research Query Header - Progress Indicator */}
              <div className="bg-[#000000] rounded-lg shadow-md mb-6 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-white" />
                    <span className="text-white text-base font-medium">{getResearchDuration() || '0m'}</span>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-[#000000] border border-white/20">
                    <span className="text-white text-sm font-medium">{research?.status === 'Done' ? 'Completed' : 'Active'}</span>
                  </div>
                </div>
              </div>
              
              {/* Universal Research Framework Output */}
              {(report.universalResearchOutput || report.universal_research_output) && (
                <div className="bg-[#000000] rounded-3xl shadow-xl p-4 mb-4 hover:shadow-2xl hover-lift transition-all duration-300 animate-fadeIn" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-10 bg-white rounded-full"></div>
                    <h2 className="text-3xl font-bold text-white">🔬 Universal Research Framework</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-white leading-relaxed whitespace-pre-line markdown-content text-justify">
                    {(report.universalResearchOutput || report.universal_research_output).split('\n').map((line, idx) => {
                      // Render markdown-style headings
                      if (line.match(/^#\s/)) {
                        return <h1 key={idx} className="text-2xl font-bold text-white mt-3 mb-2">{line.replace(/^#\s/, '')}</h1>
                      }
                      if (line.match(/^##\s/)) {
                        return <h2 key={idx} className="text-xl font-semibold text-white mt-3 mb-2">{line.replace(/^##\s/, '')}</h2>
                      }
                      if (line.match(/^###\s/)) {
                        return <h3 key={idx} className="text-lg font-semibold text-white mt-2 mb-2">{line.replace(/^###\s/, '')}</h3>
                      }
                      if (line.match(/^####\s/)) {
                        return <h4 key={idx} className="text-base font-semibold text-white mt-2 mb-2">{line.replace(/^####\s/, '')}</h4>
                      }
                      // Render bullet points
                      if (line.match(/^[-*]\s/)) {
                        return <div key={idx} className="ml-4 mb-2 text-white">• {line.replace(/^[-*]\s/, '')}</div>
                      }
                      // Render bold text
                      if (line.match(/\*\*.*?\*\*/)) {
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return <p key={idx} className="mb-2 text-white">{parts.map((part, i) => 
                          part.match(/\*\*(.*?)\*\*/) ? <strong key={i} className="font-semibold text-white">{part.replace(/\*\*/g, '')}</strong> : part
                        )}</p>
                      }
                      // Regular paragraph
                      if (line.trim()) {
                        return <p key={idx} className="mb-2 text-white">{line}</p>
                      }
                      return <br key={idx} />
                    })}
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {report.executiveSummary ? (
                <div className="bg-white rounded-lg shadow-sm border border-[#dddddd]/50 py-6 px-6 mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#000000] flex items-center gap-2">
                      <span className="text-[#000000]">|</span>
                      Executive Summary
                    </h2>
                    <button
                      onClick={() => toggleSection('executiveSummary')}
                      className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#f0f0f0] transition-colors"
                    >
                      {expandedSections.executiveSummary ? (
                        <ChevronUp className="w-5 h-5 text-[#666666]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#666666]" />
                      )}
                    </button>
                  </div>
                  {expandedSections.executiveSummary && (
                    <div className="prose prose-lg max-w-none">
                      <p className="text-[#000000] leading-relaxed text-base break-words whitespace-normal text-justify" style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        lineHeight: '1.6',
                        maxWidth: '100%',
                        whiteSpace: 'normal',
                        textAlign: 'justify',
                        textJustify: 'inter-word'
                      }}>
                        {report.executiveSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-[#dddddd] rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#666666]" />
                    <div>
                      <p className="text-[#000000] font-medium">Executive Summary is being generated...</p>
                      <p className="text-[#666666] text-sm mt-1">If this persists, the report may need to be regenerated.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Analysis */}
              {report.detailedAnalysis && (
                <div className="bg-white rounded-lg shadow-sm border border-[#dddddd]/50 p-6 mb-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#000000] flex items-center gap-2">
                      <span className="text-[#000000]">|</span>
                      Detailed Analysis
                    </h2>
                    <button
                      onClick={() => toggleSection('detailedAnalysis')}
                      className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#f0f0f0] transition-colors"
                    >
                      {expandedSections.detailedAnalysis ? (
                        <ChevronUp className="w-5 h-5 text-[#666666]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#666666]" />
                      )}
                    </button>
                  </div>
                  {expandedSections.detailedAnalysis ? (
                    <div className="prose prose-lg max-w-none text-[#000000] leading-relaxed whitespace-normal text-justify" style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '1.6',
                      whiteSpace: 'normal',
                      textAlign: 'justify',
                      textJustify: 'inter-word'
                    }}>
                    {report.detailedAnalysis.split('\n').map((line, idx) => {
                      // Render markdown-style headings with bold styling
                      if (line.match(/^#\s/)) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <h1 className="text-xl font-bold text-[#000000] mb-2">{line.replace(/^#\s/, '')}</h1>
                          </div>
                        )
                      }
                      if (line.match(/^##\s/)) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <h2 className="text-lg font-bold text-[#000000] mb-2">{line.replace(/^##\s/, '')}</h2>
                          </div>
                        )
                      }
                      if (line.match(/^###\s/)) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <h3 className="text-base font-bold text-[#000000] mb-2">{line.replace(/^###\s/, '')}</h3>
                          </div>
                        )
                      }
                      if (line.match(/^####\s/)) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <h4 className="text-base font-bold text-[#000000] mb-2">{line.replace(/^####\s/, '')}</h4>
                          </div>
                        )
                      }
                      // Render bold text in paragraphs
                      if (line.match(/\*\*.*?\*\*/)) {
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <p key={idx} className="mb-3 text-base leading-relaxed text-[#000000] text-justify" style={{
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                          }}>
                            {parts.map((part, i) => 
                              part.match(/\*\*(.*?)\*\*/) ? (
                                <strong key={i} className="font-bold text-[#000000]">{part.replace(/\*\*/g, '')}</strong>
                              ) : part
                            )}
                          </p>
                        )
                      }
                      // Render bullet points
                      if (line.match(/^[-*]\s/)) {
                        return (
                          <div key={idx} className="ml-4 mb-2 flex items-start gap-2">
                            <span className="text-[#000000] mt-1">•</span>
                            <p className="text-base leading-relaxed text-[#000000] flex-1 text-justify" style={{
                              textAlign: 'justify',
                              textJustify: 'inter-word'
                            }}>{line.replace(/^[-*]\s/, '')}</p>
                          </div>
                        )
                      }
                      // Render numbered lists
                      if (line.match(/^\d+\.\s/)) {
                        const match = line.match(/^(\d+)\.\s(.+)/)
                        if (match) {
                          return (
                            <div key={idx} className="ml-4 mb-2 flex items-start gap-3">
                              <span className="text-[#000000] font-medium">{match[1]}.</span>
                              <p className="text-base leading-relaxed text-[#000000] flex-1 text-justify" style={{
                                textAlign: 'justify',
                                textJustify: 'inter-word'
                              }}>{match[2]}</p>
                            </div>
                          )
                        }
                        return <div key={idx} className="ml-4 mb-2 text-base leading-relaxed text-[#000000] text-justify" style={{
                          textAlign: 'justify',
                          textJustify: 'inter-word'
                        }}>{line}</div>
                      }
                      // Regular paragraph
                      if (line.trim()) {
                        return (
                          <p key={idx} className="mb-3 text-base leading-relaxed text-[#000000] break-words whitespace-normal text-justify" style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                          }}>
                            {line}
                          </p>
                        )
                      }
                      return <br key={idx} />
                    })}
                    </div>
                ) : (
                  <div className="bg-white p-4">
                    <p className="text-[#000000] leading-relaxed text-base text-justify">{getPreview(report.detailedAnalysis, 300)}</p>
                  </div>
                )}
                </div>
              )}

              {/* Key Findings */}
              <div className="bg-white rounded-lg shadow-sm border border-[#dddddd]/50 p-6 mb-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-[#000000] flex items-center gap-2">
                        <span className="text-[#000000]">|</span>
                        Key Findings
                      </h2>
                      <button
                        onClick={() => toggleSection('keyFindings')}
                        className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#f0f0f0] transition-colors"
                      >
                        {expandedSections.keyFindings ? (
                          <ChevronUp className="w-5 h-5 text-[#666666]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#666666]" />
                        )}
                      </button>
                    </div>
                {expandedSections.keyFindings ? (
                <div className="space-y-4">
                  {Array.isArray(report.keyFindings) && report.keyFindings.length > 0 ? report.keyFindings.map((finding, index) => (
                    <div 
                      key={index} 
                      className="flex gap-4 items-start"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base leading-relaxed text-[#000000] break-words text-justify" style={{
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          maxWidth: '100%',
                          textAlign: 'justify',
                          textJustify: 'inter-word'
                        }}>{finding.text}</p>
                        {Array.isArray(finding.citations) && finding.citations.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {finding.citations.map((cite, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center justify-center px-2 py-1 rounded text-[#666666] text-xs"
                              >
                                {cite}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="bg-white p-4">
                      <p className="text-[#666666] italic text-base">No key findings available</p>
                    </div>
                  )}
                </div>
                ) : (
                  <div className="bg-white p-4">
                    <p className="text-[#000000] leading-relaxed text-base text-justify">{getPreview(report.keyFindings?.map(f => f.text).join(' ') || '', 300)}</p>
                  </div>
                )}
              </div>

              {/* Insights and Implications */}
              {report.insights && (
                <div className="bg-white rounded-lg shadow-sm border border-[#dddddd]/50 p-6 mb-6">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#000000] flex items-center gap-2">
                          <span className="text-[#000000]">|</span>
                          Insights and Implications
                        </h2>
                        <button
                          onClick={() => toggleSection('insights')}
                          className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#f0f0f0] transition-colors"
                        >
                          {expandedSections.insights ? (
                            <ChevronUp className="w-5 h-5 text-[#666666]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#666666]" />
                          )}
                        </button>
                      </div>
                  {expandedSections.insights ? (
                    <div className="prose prose-lg max-w-none text-[#000000] leading-relaxed whitespace-normal text-justify" style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '1.6',
                      whiteSpace: 'normal',
                      textAlign: 'justify',
                      textJustify: 'inter-word'
                    }}>
                    {report.insights.split('\n').map((line, idx) => {
                      if (line.match(/^#\s/)) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <h1 className="text-xl font-bold text-[#000000] mb-2">{line.replace(/^#\s/, '')}</h1>
                          </div>
                        )
                      }
                      if (line.match(/^##\s/)) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <h2 className="text-lg font-bold text-[#000000] mb-2">{line.replace(/^##\s/, '')}</h2>
                          </div>
                        )
                      }
                      if (line.match(/^###\s/)) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <h3 className="text-base font-bold text-[#000000] mb-2">{line.replace(/^###\s/, '')}</h3>
                          </div>
                        )
                      }
                      if (line.match(/^####\s/)) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <h4 className="text-base font-bold text-[#000000] mb-2">{line.replace(/^####\s/, '')}</h4>
                          </div>
                        )
                      }
                      if (line.match(/\*\*.*?\*\*/)) {
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <p key={idx} className="mb-3 text-base leading-relaxed text-[#000000]">
                            {parts.map((part, i) => 
                              part.match(/\*\*(.*?)\*\*/) ? (
                                <strong key={i} className="font-bold text-[#000000]">{part.replace(/\*\*/g, '')}</strong>
                              ) : part
                            )}
                          </p>
                        )
                      }
                      if (line.match(/^[-*]\s/)) {
                        return (
                          <div key={idx} className="ml-4 mb-2 flex items-start gap-2">
                            <span className="text-[#000000] mt-1">•</span>
                            <p className="text-base leading-relaxed text-[#000000] flex-1">{line.replace(/^[-*]\s/, '')}</p>
                          </div>
                        )
                      }
                      if (line.match(/^\d+\.\s/)) {
                        const match = line.match(/^(\d+)\.\s(.+)/)
                        if (match) {
                          return (
                            <div key={idx} className="ml-4 mb-2 flex items-start gap-3">
                              <span className="text-[#000000] font-medium">{match[1]}.</span>
                              <p className="text-base leading-relaxed text-[#000000] flex-1">{match[2]}</p>
                            </div>
                          )
                        }
                        return <div key={idx} className="ml-4 mb-2 text-base leading-relaxed text-[#000000]">{line}</div>
                      }
                      if (line.trim()) {
                        return (
                          <p key={idx} className="mb-3 text-base leading-relaxed text-[#000000] break-words whitespace-normal text-justify" style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                          }}>
                            {line}
                          </p>
                        )
                      }
                      return <br key={idx} />
                    })}
                    </div>
                  ) : (
                    <div className="bg-white p-4">
                      <p className="text-[#000000] leading-relaxed text-base text-justify">{getPreview(report.insights, 300)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Conclusion */}
              {report.conclusion && (
                <div className="bg-white rounded-lg shadow-sm border border-[#dddddd]/50 p-6 mb-6">
                      <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#000000] flex items-center gap-2">
                          <span className="text-[#000000]">|</span>
                          Conclusion
                        </h2>
                        <button
                          onClick={() => toggleSection('conclusion')}
                          className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#f0f0f0] transition-colors"
                        >
                          {expandedSections.conclusion ? (
                            <ChevronUp className="w-5 h-5 text-[#666666]" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-[#666666]" />
                          )}
                        </button>
                      </div>
                  {expandedSections.conclusion ? (
                    <div className="prose prose-lg max-w-none text-[#000000] leading-relaxed whitespace-normal text-justify" style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      lineHeight: '1.6',
                      whiteSpace: 'normal',
                      textAlign: 'justify',
                      textJustify: 'inter-word'
                    }}>
                    {report.conclusion.split('\n').map((line, idx) => {
                      if (line.match(/^#\s/)) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <h1 className="text-xl font-bold text-[#000000] mb-2">{line.replace(/^#\s/, '')}</h1>
                          </div>
                        )
                      }
                      if (line.match(/^##\s/)) {
                        return (
                          <div key={idx} className="mt-4 mb-3 first:mt-0">
                            <h2 className="text-lg font-bold text-[#000000] mb-2">{line.replace(/^##\s/, '')}</h2>
                          </div>
                        )
                      }
                      if (line.match(/^###\s/)) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <h3 className="text-base font-bold text-[#000000] mb-2">{line.replace(/^###\s/, '')}</h3>
                          </div>
                        )
                      }
                      if (line.match(/^####\s/)) {
                        return (
                          <div key={idx} className="mt-3 mb-2 first:mt-0">
                            <h4 className="text-base font-bold text-[#000000] mb-2">{line.replace(/^####\s/, '')}</h4>
                          </div>
                        )
                      }
                      if (line.match(/\*\*.*?\*\*/)) {
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <p key={idx} className="mb-3 text-base leading-relaxed text-[#000000]">
                            {parts.map((part, i) => 
                              part.match(/\*\*(.*?)\*\*/) ? (
                                <strong key={i} className="font-bold text-[#000000]">{part.replace(/\*\*/g, '')}</strong>
                              ) : part
                            )}
                          </p>
                        )
                      }
                      if (line.match(/^[-*]\s/)) {
                        return (
                          <div key={idx} className="ml-4 mb-2 flex items-start gap-2">
                            <span className="text-[#000000] mt-1">•</span>
                            <p className="text-base leading-relaxed text-[#000000] flex-1 text-justify" style={{
                              textAlign: 'justify',
                              textJustify: 'inter-word'
                            }}>{line.replace(/^[-*]\s/, '')}</p>
                          </div>
                        )
                      }
                      if (line.match(/^\d+\.\s/)) {
                        const match = line.match(/^(\d+)\.\s(.+)/)
                        if (match) {
                          return (
                            <div key={idx} className="ml-4 mb-2 flex items-start gap-3">
                              <span className="text-[#000000] font-medium">{match[1]}.</span>
                              <p className="text-base leading-relaxed text-[#000000] flex-1 text-justify" style={{
                                textAlign: 'justify',
                                textJustify: 'inter-word'
                              }}>{match[2]}</p>
                            </div>
                          )
                        }
                        return <div key={idx} className="ml-4 mb-2 text-base leading-relaxed text-[#000000] text-justify" style={{
                          textAlign: 'justify',
                          textJustify: 'inter-word'
                        }}>{line}</div>
                      }
                      if (line.trim()) {
                        return (
                          <p key={idx} className="mb-3 text-base leading-relaxed text-[#000000] break-words whitespace-normal text-justify" style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '100%',
                            whiteSpace: 'normal',
                            textAlign: 'justify',
                            textJustify: 'inter-word'
                          }}>
                            {line}
                          </p>
                        )
                      }
                      return <br key={idx} />
                    })}
                    </div>
                  ) : (
                    <div className="bg-white p-4">
                      <p className="text-[#000000] leading-relaxed text-base text-justify">{getPreview(report.conclusion, 300)}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Universal Research Framework Section */}
            {(() => {
              const generateUniversalFramework = async () => {
                if (!report || !research) {
                  console.error('Missing report or research data')
                  alert('Missing report or research data. Please ensure the report is loaded.')
                  return
                }
                
                setIsGeneratingUniversal(true)
                setUniversalRateLimitCountdown(null)
                
                try {
                  // Combine all report content for Universal Framework generation
                  const reportContent = `
Research Topic: ${research.topic}

Executive Summary:
${report.executiveSummary || ''}

Key Findings:
${report.keyFindings?.map(f => typeof f === 'object' ? f.text : f).join('\n') || ''}

Detailed Analysis:
${report.detailedAnalysis || ''}

Insights:
${report.insights || ''}

Conclusion:
${report.conclusion || ''}
                  `.trim()

                  // Create cache key based on research ID and content hash
                  const contentHash = reportContent.substring(0, 100).replace(/\s/g, '')
                  const cacheKey = `universal_framework_${id}_${contentHash}`

                  // Check cache first
                  const cached = rateLimitHandler.getCache(cacheKey)
                  if (cached) {
                    console.log('✅ Using cached Universal Framework')
                    setUniversalFramework(cached)
                    setIsGeneratingUniversal(false)
                    return
                  }

                  const requestBody = {
                    originalQuery: research.topic,
                    clarifyingAnswers: '',
                    researchId: id,
                    model: research.model || 'gemini-2.5-flash',
                    mode: 'universal',
                    documentContext: reportContent
                  }

                  const maxRetries = 5
                  let retryCount = 0
                  let lastRateLimitTime = 0

                  while (retryCount <= maxRetries) {
                    try {
                      // Use rateLimitHandler for throttling and caching
                      const response = await rateLimitHandler.request(
                        cacheKey,
                        async () => {
                          return await fetch(`${SUPABASE_URL}/functions/v1/deep-Research-gemini`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            },
                            body: JSON.stringify(requestBody)
                          })
                        },
                        false // Don't cache the response object, we'll cache the parsed data
                      )

                      const data = await response.json()
                      
                      // Check for rate limit errors
                      const isRateLimit = response.status === 429 || 
                                         (data.error && (data.error.toLowerCase().includes('rate limit') || 
                                                         data.error.toLowerCase().includes('quota') ||
                                                         data.error.toLowerCase().includes('429')))
                      
                      if (isRateLimit && retryCount < maxRetries) {
                        const now = Date.now()
                        const timeSinceLastRateLimit = now - lastRateLimitTime
                        lastRateLimitTime = now
                        
                        // Progressive delays: 60s, 120s, 180s, 240s, 300s
                        const baseDelay = 60000 + (retryCount * 60000)
                        const extraDelay = timeSinceLastRateLimit < 120000 ? 30000 : 0 // +30s if rate limit hit within last 2 minutes
                        const backoffDelay = baseDelay + extraDelay
                        const initialSeconds = Math.floor(backoffDelay / 1000)
                        
                        retryCount++
                        console.log(`Rate limit in Universal Framework generation. Will retry in ${initialSeconds}s... (attempt ${retryCount}/${maxRetries})`)
                        
                        setUniversalRateLimitCountdown({ seconds: initialSeconds, initialSeconds, attempt: retryCount, total: maxRetries })
                        
                        // Countdown timer
                        for (let remaining = initialSeconds; remaining > 0; remaining--) {
                          await new Promise(resolve => setTimeout(resolve, 1000))
                          setUniversalRateLimitCountdown({ seconds: remaining - 1, initialSeconds, attempt: retryCount, total: maxRetries })
                        }
                        
                        setUniversalRateLimitCountdown(null)
                        continue // Retry the request
                      }
                      
                      if (!response.ok) {
                        const errorMessage = data.error || data.message || `HTTP ${response.status}: Failed to generate Universal Framework`
                        console.error('Universal Framework API Error:', {
                          status: response.status,
                          error: errorMessage,
                          details: data.details
                        })
                        throw new Error(errorMessage)
                      }

                      if (data.error) {
                        console.error('Universal Framework Error in Response:', data.error)
                        throw new Error(data.error)
                      }

                      if (data.report) {
                        console.log('✅ Universal Framework generated successfully')
                        // Cache the successful response
                        rateLimitHandler.setCache(cacheKey, data.report)
                        setUniversalFramework(data.report)
                        setUniversalRateLimitCountdown(null)
                        return // Success!
                      } else {
                        console.error('No report in response:', data)
                        throw new Error('Invalid response format: missing report data')
                      }
                    } catch (fetchError) {
                      // Check if it's a rate limit error in the catch block
                      const errorMessage = fetchError.message || ''
                      const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') || 
                                             errorMessage.toLowerCase().includes('quota') ||
                                             errorMessage.toLowerCase().includes('429')
                      
                      if (isRateLimitError && retryCount < maxRetries) {
                        const now = Date.now()
                        const timeSinceLastRateLimit = now - lastRateLimitTime
                        lastRateLimitTime = now
                        
                        const baseDelay = 60000 + (retryCount * 60000)
                        const extraDelay = timeSinceLastRateLimit < 120000 ? 30000 : 0
                        const backoffDelay = baseDelay + extraDelay
                        const initialSeconds = Math.floor(backoffDelay / 1000)
                        
                        retryCount++
                        console.log(`Rate limit error caught. Will retry in ${initialSeconds}s... (attempt ${retryCount}/${maxRetries})`)
                        
                        setUniversalRateLimitCountdown({ seconds: initialSeconds, initialSeconds, attempt: retryCount, total: maxRetries })
                        
                        for (let remaining = initialSeconds; remaining > 0; remaining--) {
                          await new Promise(resolve => setTimeout(resolve, 1000))
                          setUniversalRateLimitCountdown({ seconds: remaining - 1, initialSeconds, attempt: retryCount, total: maxRetries })
                        }
                        
                        setUniversalRateLimitCountdown(null)
                        continue
                      }
                      
                      // Max retries reached or other error
                      if (retryCount >= maxRetries) {
                        setUniversalRateLimitCountdown(null)
                        throw new Error('Rate limit exceeded after multiple retries. Please wait 5-10 minutes and try again.')
                      }
                      
                      throw fetchError
                    }
                  }
                } catch (error) {
                  console.error('Error generating Universal Framework:', error)
                  setUniversalRateLimitCountdown(null)
                  const errorMessage = error.message || 'Failed to generate Universal Framework. Please try again.'
                  alert(`Error: ${errorMessage}`)
                } finally {
                  setIsGeneratingUniversal(false)
                }
              }

              // Show button if Universal Framework not generated yet
              if (!universalFramework) {
                return (
                  <>
                    {universalRateLimitCountdown && (
                      <div className="mb-3 bg-white/10 border border-white/20 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                            <div>
                              <h3 className="font-bold text-white text-sm">Rate Limit Reached</h3>
                              <p className="text-white/80 text-xs">
                                Automatically retrying in <span className="font-bold">{universalRateLimitCountdown.seconds}</span> seconds
                                <span className="ml-2">(Attempt {universalRateLimitCountdown.attempt}/{universalRateLimitCountdown.total})</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">{universalRateLimitCountdown.seconds}s</div>
                            <div className="text-xs text-white/60 mt-1">Please wait...</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={generateUniversalFramework}
                      disabled={isGeneratingUniversal || universalRateLimitCountdown}
                      className="flex items-center gap-2 px-6 py-3 bg-[#000000] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full"
                    >
                      {isGeneratingUniversal ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Universal Framework
                        </>
                      )}
                    </button>
                  </>
                )
              }

              // Display Universal Framework if generated
              const parseUniversalSections = () => {
                const sections = {}
                const execSummary = universalFramework.executiveSummary || ''
                const detailed = universalFramework.detailedAnalysis || ''
                const insights = universalFramework.insights || ''
                const conclusion = universalFramework.conclusion || ''
                const keyFindings = universalFramework.keyFindings || []

                // Backend combines sections 1-3 into executiveSummary with \n\n separators
                // Split by double newlines and assign to sections
                const execParts = execSummary.split(/\n\n+/).filter(p => p.trim())
                
                // Section 1: Research Question Precision (first part)
                sections.questionPrecision = execParts[0] ? execParts[0].trim() : null
                
                // Section 2: Context and Background (second part)
                sections.context = execParts[1] ? execParts[1].trim() : null
                
                // Section 3: One-Sentence Answer (third part)
                sections.oneSentenceAnswer = execParts[2] ? execParts[2].trim() : null

                // If splitting didn't work, try regex fallback
                if (!sections.questionPrecision) {
                  const questionMatch = execSummary.match(/Research Question Precision[:\s]*([\s\S]*?)(?=Context and Background|One-Sentence Answer|$)/i)
                  sections.questionPrecision = questionMatch ? questionMatch[1].trim() : execSummary.split('\n')[0] || null
                }
                if (!sections.context) {
                  const contextMatch = execSummary.match(/Context and Background[:\s]*([\s\S]*?)(?=One-Sentence Answer|$)/i)
                  sections.context = contextMatch ? contextMatch[1].trim() : execParts[1] || null
                }
                if (!sections.oneSentenceAnswer) {
                  const answerMatch = execSummary.match(/One-Sentence Answer[:\s]*([\s\S]*?)$/i)
                  sections.oneSentenceAnswer = answerMatch ? answerMatch[1].trim() : execParts[2] || execParts[execParts.length - 1] || null
                }

                // Extract Stakeholders, Evidence, Confidence, Limitations from detailedAnalysis
                // Backend formats as: "Stakeholders:\n...\n\nEvidence:\n...\n\nConfidence: ...\n\nLimitations:\n..."
                const stakeholdersMatch = detailed.match(/Stakeholders[:\s]*\n?([\s\S]*?)(?=\n\s*Evidence|$)/i)
                const evidenceMatch = detailed.match(/Evidence[:\s]*\n?([\s\S]*?)(?=\n\s*Confidence|$)/i)
                const confidenceMatch = detailed.match(/Confidence[:\s]*([\s\S]*?)(?=\n\s*Limitations|$)/i)
                const limitationsMatch = detailed.match(/Limitations[:\s]*\n?([\s\S]*?)$/i)

                sections.stakeholders = stakeholdersMatch ? stakeholdersMatch[1].trim() : null
                sections.evidence = evidenceMatch ? evidenceMatch[1].trim() : null
                sections.confidence = confidenceMatch ? confidenceMatch[1].trim() : null
                sections.limitations = limitationsMatch ? limitationsMatch[1].trim() : null

                // Section 4: Key Insights from keyFindings
                sections.keyInsights = keyFindings.length > 0 ? keyFindings : null

                // Section 8: Implications from insights
                sections.implications = insights || null

                // Section 10: Key Takeaways from conclusion
                sections.keyTakeaways = conclusion || null

                return sections
              }

              const universalSections = parseUniversalSections()

              const toggleUniversalSection = (section) => {
                setExpandedUniversalSections(prev => ({
                  ...prev,
                  [section]: !prev[section]
                }))
              }

              return (
                <div className="bg-[#000000] rounded-lg shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-5 h-5 text-white" />
                    <div>
                      <h3 className="text-2xl font-bold text-white leading-tight">Universal Research</h3>
                      <h3 className="text-2xl font-bold text-white leading-tight">Framework</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                    {/* 1. Research Question Precision */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('questionPrecision')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">1. Research Question Precision</h4>
                        {expandedUniversalSections.questionPrecision ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.questionPrecision && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed">
                            {universalSections.questionPrecision || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 2. Context and Background */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('context')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">2. Context and Background</h4>
                        {expandedUniversalSections.context ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.context && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed">
                            {universalSections.context || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 3. One-Sentence Answer */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('oneSentenceAnswer')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">3. One-Sentence Answer</h4>
                        {expandedUniversalSections.oneSentenceAnswer ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.oneSentenceAnswer && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed font-medium">
                            {universalSections.oneSentenceAnswer || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 4. Key Insights */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('keyInsights')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">4. Key Insights</h4>
                        {expandedUniversalSections.keyInsights ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.keyInsights && (
                        <div className="p-4 bg-white/5">
                          {universalSections.keyInsights && universalSections.keyInsights.length > 0 ? (
                            <ul className="space-y-2">
                              {universalSections.keyInsights.map((insight, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-white mt-1">•</span>
                                  <span className="text-sm text-white leading-relaxed">
                                    {typeof insight === 'object' ? insight.text : insight}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-white/70 italic">No insights available for this section.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 5. Stakeholders */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('stakeholders')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">5. Stakeholders and Key Players</h4>
                        {expandedUniversalSections.stakeholders ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.stakeholders && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed">
                            {universalSections.stakeholders || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 6. Evidence Summary */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('evidence')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">6. Evidence Summary</h4>
                        {expandedUniversalSections.evidence ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.evidence && (
                        <div className="p-4 bg-white/5">
                          <div className="text-sm text-white leading-relaxed whitespace-pre-line">
                            {universalSections.evidence || 'No content available for this section.'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 7. Confidence Level */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('confidence')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">7. Confidence Level</h4>
                        {expandedUniversalSections.confidence ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.confidence && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed">
                            {universalSections.confidence || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 8. Implications and Impact */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('implications')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">8. Implications and Impact</h4>
                        {expandedUniversalSections.implications ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.implications && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed">
                            {universalSections.implications || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 9. Limitations */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('limitations')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">9. Limitations</h4>
                        {expandedUniversalSections.limitations ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.limitations && (
                        <div className="p-4 bg-white/5">
                          <div className="text-sm text-white leading-relaxed whitespace-pre-line">
                            {universalSections.limitations || 'No content available for this section.'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 10. Key Takeaways */}
                    <div className="border border-white/30 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleUniversalSection('keyTakeaways')}
                        className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-between"
                      >
                        <h4 className="text-sm font-bold text-white">10. Key Takeaways</h4>
                        {expandedUniversalSections.keyTakeaways ? (
                          <ChevronUp className="w-4 h-4 text-white" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-white" />
                        )}
                      </button>
                      {expandedUniversalSections.keyTakeaways && (
                        <div className="p-4 bg-white/5">
                          <p className="text-sm text-white leading-relaxed font-medium">
                            {universalSections.keyTakeaways || 'No content available for this section.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Action Buttons - Between Universal Research Framework and Sources */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/map/${id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#000000] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity w-full"
                >
                  <Network className="w-5 h-5" />
                  View Intelligence Map
                </button>
                <button
                  onClick={() => navigate(`/chat/${id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#000000] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity w-full"
                >
                  <MessageCircle className="w-5 h-5" />
                  Ask Follow-up
                </button>
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={isGeneratingStoryboard}
                  className="flex items-center gap-2 px-6 py-3 bg-[#000000] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isGeneratingStoryboard ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Film className="w-5 h-5" />
                      Generate Storyboard
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyMarkdown}
                  className={`flex items-center gap-2 px-6 py-3 bg-[#f0f0f0] text-[#000000] border border-[#dddddd] rounded-lg font-medium hover:bg-[#e0e0e0] transition-colors w-full ${copied ? 'bg-[#f0f0f0]' : ''}`}
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Markdown'}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-6 py-3 bg-[#f0f0f0] text-[#000000] border border-[#dddddd] rounded-lg font-medium hover:bg-[#e0e0e0] transition-colors w-full"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>

            {/* Sources Section */}
            <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm p-8 flex flex-col">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-[#333333]">Sources</h3>
                {Array.isArray(report.sources) && report.sources.length > 0 && (
                  <span className="px-2 py-0.5 bg-[#f5f5f5] border border-[#e0e0e0] text-[#888888] rounded text-xs font-medium">
                    {report.sources.length}
                  </span>
                )}
              </div>
              <div className="space-y-4 overflow-y-auto flex-1" style={{ maxHeight: '600px' }}>
                {(() => {
                  // Enhanced debug logging
                  const sourcesDebug = {
                    hasReport: !!report,
                    hasSources: !!report?.sources,
                    isArray: Array.isArray(report?.sources),
                    length: report?.sources?.length || 0,
                    sourcesType: typeof report?.sources,
                    sourcesValue: report?.sources,
                    firstSource: report?.sources?.[0],
                    rawSources: JSON.stringify(report?.sources || null, null, 2)
                  }
                  console.log('🔍 Sources display check:', sourcesDebug)
                  
                  // Normalize sources - handle various formats
                  let normalizedSources = []
                  
                  if (report && report.sources) {
                    if (Array.isArray(report.sources)) {
                      normalizedSources = report.sources
                    } else if (typeof report.sources === 'string') {
                      // Try to parse as JSON string
                      try {
                        const parsed = JSON.parse(report.sources)
                        normalizedSources = Array.isArray(parsed) ? parsed : [parsed]
                      } catch {
                        // If not JSON, treat as single source
                        normalizedSources = [{ url: report.sources, domain: 'Unknown', date: new Date().toISOString().split('T')[0], title: 'Source' }]
                      }
                    } else if (typeof report.sources === 'object') {
                      // Single source object
                      normalizedSources = [report.sources]
                    }
                  }
                  
                  // Filter out invalid sources
                  normalizedSources = normalizedSources.filter(s => {
                    if (!s) return false
                    // Must have either url or domain
                    return s.url || s.domain || (typeof s === 'string' && s.length > 0)
                  })
                  
                  console.log('✅ Normalized sources:', {
                    count: normalizedSources.length,
                    sources: normalizedSources.slice(0, 3)
                  })
                  
                  if (normalizedSources.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="mb-3">
                          <ExternalLink className="w-10 h-10 text-[#666666] mx-auto mb-2" />
                        </div>
                        <p className="text-sm font-medium text-[#333333]">No sources found</p>
                        <p className="text-xs mt-1.5 text-[#666666]">
                          {!report ? 'Report data not loaded yet' : 'Sources will appear here once research completes'}
                        </p>
                        {process.env.NODE_ENV === 'development' && (
                          <details className="mt-3 text-left text-xs text-[#666666]">
                            <summary className="cursor-pointer">Debug Info</summary>
                            <pre className="mt-2 p-2 bg-[#f5f5f5] border border-[#e0e0e0] rounded overflow-auto max-h-40 text-[#333333]">
                              {JSON.stringify(sourcesDebug, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )
                  }
                  
                  return (
                    <>
                      {normalizedSources.map((source, index) => {
                      // Handle different source formats
                      let sourceObj = source
                      if (typeof source === 'string') {
                        sourceObj = {
                          url: source,
                          domain: source.replace(/https?:\/\//, '').split('/')[0].replace('www.', ''),
                          date: new Date().toISOString().split('T')[0],
                          title: source.replace(/https?:\/\//, '').split('/')[0]
                        }
                      }
                      
                      // Ensure URL is valid and properly formatted
                      let sourceUrl = sourceObj.url || sourceObj.link || ''
                      if (sourceUrl && !sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://')) {
                        sourceUrl = 'https://' + sourceUrl
                      }
                      
                      const sourceTitle = sourceObj.title || sourceObj.name || sourceObj.domain || 'Source'
                      const sourceDomain = sourceObj.domain || (sourceUrl ? new URL(sourceUrl).hostname.replace('www.', '') : 'Unknown')
                      const sourceDate = sourceObj.date || sourceObj.publishedDate || new Date().toISOString().split('T')[0]
                      
                      return (
                  <a
                    key={index}
                    href={sourceUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border border-[#e0e0e0] rounded-lg p-4 transition-colors duration-200 group cursor-pointer hover:border-[#d0d0d0]"
                    onClick={(e) => {
                      // Allow navigation to all URLs - real sources should work now
                      if (!sourceUrl || sourceUrl === '#') {
                        e.preventDefault()
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <span className="text-sm font-bold text-[#333333]">
                            #{index + 1} {sourceTitle}
                          </span>
                        </div>
                        {sourceTitle !== sourceDomain && (
                          <div className="text-xs text-[#666666] break-words">
                            {sourceDomain} • {formatSourceDate(sourceDate)}
                          </div>
                        )}
                        {sourceTitle === sourceDomain && (
                          <div className="text-xs text-[#666666] break-words">
                            {formatSourceDate(sourceDate)}
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#666666] group-hover:text-[#333333] flex-shrink-0 mt-0.5 transition-colors duration-200" />
                    </div>
                  </a>
                    )
                    })}
                  </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    {showSlidesModal && (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-effect max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-black p-6 scrollbar-light">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-black">Slide Outline</h3>
              {agentRecommendations && (
                <p className="text-sm text-gray-600 mt-1">
                  {agentRecommendations.structure?.totalSlides} slides • ~{agentRecommendations.structure?.estimatedDuration} min
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {slides.length > 0 && !(useLevel6 && level6JobStatus === 'done') && (
                <>
                  <button
                    onClick={() => setShowPPTSettings(true)}
                    disabled={isGeneratingSlides || (useLevel6 && level6JobStatus !== 'done')}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {useLevel6 ? 'Preview & Customize' : 'Customize & Download'}
                  </button>
                </>
              )}
              {useLevel6 && level6JobStatus === 'done' && level6PptUrl && (
                <a
                  href={level6PptUrl}
                  download
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download Level-6 PPTX
                </a>
              )}
              <button
                onClick={() => setShowSlidesModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close slides modal"
                title="Close slides modal"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Level-6 Job Status */}
          {useLevel6 && level6JobId && (
            <div className={`mb-6 rounded-xl p-4 border-2 ${
              level6JobStatus === 'done' ? 'bg-green-50 border-green-300' :
              level6JobStatus === 'failed' ? 'bg-red-50 border-red-300' :
              level6JobStatus === 'processing' ? 'bg-gray-50 border-black' :
              'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center gap-3">
                {level6JobStatus === 'done' ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : level6JobStatus === 'failed' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Loader2 className="w-5 h-5 text-black animate-spin" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {level6JobStatus === 'done' ? 'Level-6 PPT Ready!' :
                     level6JobStatus === 'failed' ? 'Level-6 Processing Failed' :
                     level6JobStatus === 'processing' ? 'Processing with Level-6...' :
                     'Level-6 Job Created'}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {level6JobStatus === 'done' ? 'Your high-quality PPTX is ready for download' :
                     level6JobStatus === 'failed' ? (level6Error || 'An error occurred during processing') :
                     level6JobStatus === 'processing' ? 'Rendering with Google Slides API...' :
                     'Job queued, waiting for processing...'}
                  </p>
                </div>
                {level6JobStatus === 'done' && level6PptUrl && (
                  <a
                    href={level6PptUrl}
                    download
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PPTX
                  </a>
                )}
              </div>
            </div>
          )}

          {level6Error && !useLevel6 && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
              Level-6 Error: {level6Error}
            </div>
          )}

          {slidesError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
              {slidesError}
            </div>
          ) : slides.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No slide content generated.
            </div>
          ) : (
            <div className="space-y-6">
              {agentRecommendations?.design && (
                <div className="bg-blue-50 border border-black rounded-xl p-5 mb-6">
                  <h4 className="font-semibold text-black mb-3">Design Recommendations</h4>
                  <div className="text-sm text-black space-y-2">
                    <p><strong>Color Scheme:</strong> {agentRecommendations.design.colorScheme}</p>
                    <p><strong>Font Style:</strong> {agentRecommendations.design.fontStyle}</p>
                    {agentRecommendations.design.visualElements && agentRecommendations.design.visualElements.length > 0 && (
                      <p><strong>Visual Elements:</strong> {agentRecommendations.design.visualElements.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
              {slides.map((slide, index) => (
                <div key={`${slide.title}-${index}`} className="border-2 border-blue-100 rounded-2xl p-8 bg-white hover:shadow-lg hover:border-blue-300 transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br bg-black text-white flex items-center justify-center font-bold text-lg shadow-md flex-shrink-0">
                        {index + 1}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 pr-4">{slide.title || `Slide ${index + 1}`}</h4>
                    </div>
                    {slide.design && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                        <span className="px-2 py-1 bg-gray-100 rounded">{slide.design.layout}</span>
                        {slide.design.visualType !== 'none' && (
                          <span className="px-2 py-1 bg-gray-100 rounded">{slide.design.visualType}</span>
                        )}
                      </div>
                    )}
                  </div>
                  {(slide.bullets && slide.bullets.length > 0) && (
                    <ul className="list-disc pl-10 pr-4 space-y-3 text-gray-700 mb-4">
                      {slide.bullets.map((bullet, idx) => (
                        <li key={idx} className="leading-relaxed text-base">{bullet}</li>
                      ))}
                    </ul>
                  )}
                  {(slide.left_bullets || slide.right_bullets) && (
                    <div className="grid grid-cols-2 gap-6 mb-4">
                      {slide.left_bullets && slide.left_bullets.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-3">Left Column</h5>
                          <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            {slide.left_bullets.map((bullet, idx) => (
                              <li key={idx} className="leading-relaxed text-sm">{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {slide.right_bullets && slide.right_bullets.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-3">Right Column</h5>
                          <ul className="list-disc pl-6 space-y-2 text-gray-700">
                            {slide.right_bullets.map((bullet, idx) => (
                              <li key={idx} className="leading-relaxed text-sm">{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {slide.timeline_items && slide.timeline_items.length > 0 && (
                    <div className="mb-4 pl-10">
                      <ul className="space-y-4">
                        {slide.timeline_items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-4">
                            <span className="font-bold text-black text-lg flex-shrink-0">{item.year}</span>
                            <span className="text-gray-700 leading-relaxed">{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {slide.speakerNotes && (
                    <div className="mt-5 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        <strong className="text-gray-700">Speaker Notes:</strong> {slide.speakerNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}

    {/* PPT Customization Settings Modal */}
    {showPPTSettings && (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-effect max-w-7xl w-full max-h-[95vh] rounded-3xl shadow-2xl border border-black overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-xl shadow-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 bg-clip-text text-transparent">
                  Customize Presentation
                </h3>
                <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Edit theme, colors, fonts, and background with live preview
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPPTSettings(false)}
              className="p-2 rounded-xl hover:bg-white/80 transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Main Content: Side by Side */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel: Settings */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6 scrollbar-light bg-white">
              <div className="space-y-6">
            {/* Theme Presets */}
            <div className="bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 rounded-2xl p-5 border border-rose-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-rose-600" />
                <label className="text-base font-bold text-gray-800">Theme Presets</label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(themePresets).map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => applyTheme(themeName)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden group ${
                      pptSettings.theme === themeName
                        ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg ring-2 ring-rose-300'
                        : 'border-gray-200 bg-white hover:border-rose-300 hover:bg-rose-50/50'
                    }`}
                  >
                    {pptSettings.theme === themeName && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                    <div className={`text-sm font-semibold capitalize mb-3 ${
                      pptSettings.theme === themeName ? 'text-rose-700' : 'text-gray-700'
                    }`}>
                      {themeName}
                    </div>
                    <div className="flex gap-1.5">
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm border-2 border-white"
                        style={{ backgroundColor: `#${themePresets[themeName].primaryColor}` }}
                      />
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm border-2 border-white"
                        style={{ backgroundColor: `#${themePresets[themeName].secondaryColor}` }}
                      />
                      <div
                        className="w-7 h-7 rounded-lg shadow-sm border-2 border-white"
                        style={{ backgroundColor: `#${themePresets[themeName].accentColor}` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Customization */}
            <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 rounded-2xl p-5 border border-teal-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Paintbrush className="w-5 h-5 text-teal-600" />
                <label className="text-base font-bold text-gray-800">Color Customization</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br bg-black"></div>
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={`#${pptSettings.primaryColor}`}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '')
                      setPptSettings(prev => ({ ...prev, primaryColor: hex }))
                    }}
                    className="w-20 h-20 rounded-xl border-3 border-gray-300 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                    style={{ borderWidth: '3px' }}
                  />
                  <input
                    type="text"
                    value={pptSettings.primaryColor}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
                      setPptSettings(prev => ({ ...prev, primaryColor: hex }))
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
                    placeholder="0F172A"
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br bg-black"></div>
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={`#${pptSettings.secondaryColor}`}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '')
                      setPptSettings(prev => ({ ...prev, secondaryColor: hex }))
                    }}
                    className="w-20 h-20 rounded-xl border-3 border-gray-300 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                    style={{ borderWidth: '3px' }}
                  />
                  <input
                    type="text"
                    value={pptSettings.secondaryColor}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
                      setPptSettings(prev => ({ ...prev, secondaryColor: hex }))
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
                    placeholder="1E40AF"
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700"></div>
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={`#${pptSettings.accentColor}`}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '')
                      setPptSettings(prev => ({ ...prev, accentColor: hex }))
                    }}
                    className="w-20 h-20 rounded-xl border-3 border-gray-300 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                    style={{ borderWidth: '3px' }}
                  />
                  <input
                    type="text"
                    value={pptSettings.accentColor}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
                      setPptSettings(prev => ({ ...prev, accentColor: hex }))
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
                    placeholder="3B82F6"
                  />
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={`#${pptSettings.backgroundColor}`}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '')
                      setPptSettings(prev => ({ ...prev, backgroundColor: hex }))
                    }}
                    className="w-20 h-20 rounded-xl border-3 border-gray-300 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                    style={{ borderWidth: '3px' }}
                  />
                  <input
                    type="text"
                    value={pptSettings.backgroundColor}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '').replace(/[^0-9A-Fa-f]/g, '').substring(0, 6)
                      setPptSettings(prev => ({ ...prev, backgroundColor: hex }))
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono text-sm focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
                    placeholder="F8FAFC"
                  />
                </div>
              </div>
            </div>
            </div>

            {/* Font Settings */}
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Type className="w-5 h-5 text-amber-600" />
                <label className="text-base font-bold text-gray-800">Font Settings</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Font Family</label>
                <select
                  value={pptSettings.fontFamily}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all bg-white shadow-sm"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Font Size</label>
                <select
                  value={pptSettings.fontSize}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, fontSize: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all bg-white shadow-sm"
                >
                  <option value="small">Small</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </select>
              </div>
              </div>
            </div>

            {/* Layout Settings */}
            <div className="bg-gradient-to-br bg-gray-50 rounded-2xl p-5 border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-indigo-600" />
                <label className="text-base font-bold text-gray-800">Layout & Background</label>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Slide Layout</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'LAYOUT_WIDE', label: 'Widescreen', desc: '16:9', icon: '📺' },
                      { value: 'LAYOUT_4x3', label: 'Standard', desc: '4:3', icon: '📱' },
                      { value: 'LAYOUT_16x10', label: 'Wide', desc: '16:10', icon: '💻' }
                    ].map((layout) => (
                      <button
                        key={layout.value}
                        onClick={() => setPptSettings(prev => ({ ...prev, layout: layout.value }))}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                          pptSettings.layout === layout.value
                            ? 'border-indigo-500 bg-gradient-to-br bg-gray-50 shadow-md ring-2 ring-black'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        <div className="text-2xl mb-2">{layout.icon}</div>
                        <div className="font-semibold text-gray-700 text-sm">{layout.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{layout.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Background Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['solid', 'gradient'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPptSettings(prev => ({ ...prev, backgroundType: type }))}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 capitalize font-medium hover:scale-105 hover:shadow-lg ${
                          pptSettings.backgroundType === type
                            ? 'border-indigo-500 bg-gradient-to-br bg-gray-50 shadow-md ring-2 ring-black'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
                        }`}
                      >
                        {type === 'gradient' ? '🌈 Gradient' : '🎨 Solid'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Styling Options */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-bold text-gray-800">Advanced Styling</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Bullet Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bullet Style</label>
                <select
                  value={pptSettings.bulletStyle}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, bulletStyle: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="arrow">Arrow</option>
                    <option value="dash">Dash</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {/* Header Height */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Header Height</label>
                <select
                  value={pptSettings.headerHeight}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, headerHeight: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="small">Small</option>
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Text Alignment</label>
                <select
                  value={pptSettings.textAlignment}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, textAlignment: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                {/* Line Spacing */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Line Spacing</label>
                <select
                  value={pptSettings.lineSpacing}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, lineSpacing: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="tight">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="loose">Loose</option>
                  </select>
                </div>

                {/* Content Padding */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content Padding</label>
                <select
                  value={pptSettings.contentPadding}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, contentPadding: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="tight">Tight</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>

                {/* Title Slide Style */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title Slide Style</label>
                <select
                  value={pptSettings.titleSlideStyle}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, titleSlideStyle: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="centered">Centered</option>
                    <option value="left">Left Aligned</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>

              {/* Border & Shadow Options */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Border Style</label>
                <select
                  value={pptSettings.borderStyle}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, borderStyle: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Border Width</label>
                <select
                  value={pptSettings.borderWidth}
                  onChange={(e) => setPptSettings(prev => ({ ...prev, borderWidth: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all bg-white shadow-sm"
                >
                    <option value="thin">Thin</option>
                    <option value="normal">Normal</option>
                    <option value="thick">Thick</option>
                  </select>
                </div>
              </div>

              {/* Toggle Options */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-all duration-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={pptSettings.shadowEffect}
                    onChange={(e) => setPptSettings(prev => ({ ...prev, shadowEffect: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Shadow Effect</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-all duration-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={pptSettings.roundedCorners}
                    onChange={(e) => setPptSettings(prev => ({ ...prev, roundedCorners: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-600 rounded-lg"></div>
                    <span className="text-sm font-semibold text-gray-700">Rounded Corners</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-all duration-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={pptSettings.showSlideNumbers}
                    onChange={(e) => setPptSettings(prev => ({ ...prev, showSlideNumbers: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-base">#</span>
                    <span className="text-sm font-semibold text-gray-700">Show Slide Numbers</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition-all duration-200 shadow-sm">
                  <input
                    type="checkbox"
                    checked={pptSettings.showFooter}
                    onChange={(e) => setPptSettings(prev => ({ ...prev, showFooter: e.target.checked }))}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-300 cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-gray-600"></div>
                    <span className="text-sm font-semibold text-gray-700">Show Footer</span>
                  </div>
                </label>
              </div>

              {/* Footer Text */}
              {pptSettings.showFooter && (
                <div className="mb-4 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Text</label>
                  <input
                    type="text"
                    value={pptSettings.footerText}
                    onChange={(e) => setPptSettings(prev => ({ ...prev, footerText: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 transition-all"
                    placeholder="AskDepth Research"
                  />
                </div>
              )}

              {/* Accent Bar Position */}
              <div className="mb-4 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Square className="w-4 h-4 text-emerald-600" />
                  Accent Bar Position
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['top', 'bottom', 'both', 'none'].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPptSettings(prev => ({ ...prev, accentBarPosition: pos }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 capitalize text-sm font-medium hover:scale-105 hover:shadow-md ${
                        pptSettings.accentBarPosition === pos
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md ring-2 ring-emerald-200'
                          : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gradient Direction */}
              {pptSettings.backgroundType === 'gradient' && (
                <div className="mb-4 bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Image className="w-4 h-4 text-emerald-600" />
                    Gradient Direction
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['horizontal', 'vertical', 'diagonal'].map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setPptSettings(prev => ({ ...prev, gradientDirection: dir }))}
                        className={`p-3 rounded-xl border-2 transition-all duration-300 capitalize text-sm font-medium hover:scale-105 hover:shadow-md ${
                          pptSettings.gradientDirection === dir
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md ring-2 ring-emerald-200'
                            : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Icon Style */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Icon Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['filled', 'outline', 'minimal'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setPptSettings(prev => ({ ...prev, iconStyle: style }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 capitalize text-sm font-medium hover:scale-105 hover:shadow-md ${
                        pptSettings.iconStyle === style
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md ring-2 ring-emerald-200'
                          : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

              </div>
            </div>

            {/* Right Panel: Live Preview */}
            <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto scrollbar-light">
              <div className="sticky top-0 bg-gray-50 pb-4 mb-4 border-b border-gray-200 z-10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">Live Preview</h4>
                    <p className="text-xs text-gray-600">See your actual content with real-time styling</p>
                  </div>
                  {slides.length > 0 && previewType === 'content' && (
                    <div className="text-xs text-gray-500">
                      Slide {previewSlideIndex + 1} of {slides.length}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewType('title')}
                      className={`px-3 py-1 text-xs rounded font-medium ${
                        previewType === 'title'
                          ? 'bg-black text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      Title Slide
                    </button>
                    {slides.length > 0 && (
                      <button
                        onClick={() => setPreviewType('content')}
                        className={`px-3 py-1 text-xs rounded font-medium ${
                          previewType === 'content'
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        Content Slides
                      </button>
                    )}
                  </div>
                  {slides.length > 1 && previewType === 'content' && (
                    <div className="flex gap-1 ml-auto">
                      {slides.slice(0, Math.min(5, slides.length)).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewSlideIndex(idx)}
                          className={`px-2 py-1 text-xs rounded ${
                            previewSlideIndex === idx
                              ? 'bg-black text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Preview Slide with Actual Content */}
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* Preview Background - Calculate colors */}
                {(() => {
                  const previewTextDark = pptSettings.theme === 'dark' ? 'FFFFFF' : '0F172A'
                  const previewTextGray = pptSettings.theme === 'dark' ? 'E5E7EB' : '475569'
                  const previewLightBg = pptSettings.backgroundColor
                  const previewAccentYellow = pptSettings.theme === 'dark' ? 'FBBF24' : 'F59E0B'
                  const previewAccentPurple = pptSettings.theme === 'dark' ? 'A78BFA' : '8B5CF6'
                  
                  // Get actual content based on preview type
                  const isTitleSlide = previewType === 'title'
                  const previewSlide = !isTitleSlide && slides.length > 0 ? slides[previewSlideIndex] : null
                  
                  // Title slide content
                  const titleSlideTitle = research?.topic || report?.topic || 'Research Presentation'
                  const titleSlideSubtitle = report?.executiveSummary 
                    ? (report.executiveSummary.length > 100 ? report.executiveSummary.substring(0, 100) + '...' : report.executiveSummary)
                    : 'Generated by AskDepth Research'
                  
                  // Content slide content
                  const slideTitle = previewSlide?.title || titleSlideTitle
                  const slideBullets = previewSlide?.bullets || (previewSlide?.left_bullets || [])
                  const displayBullets = slideBullets.length > 0 
                    ? slideBullets.slice(0, 5)
                    : ['First key point with your settings', 'Second important bullet point', 'Third item showing spacing']
                  
                  return (
                    <div 
                      className="w-full h-full relative"
                      style={{
                        background: pptSettings.backgroundType === 'gradient' 
                          ? `linear-gradient(${pptSettings.gradientDirection === 'vertical' ? '180deg' : pptSettings.gradientDirection === 'diagonal' ? '135deg' : '90deg'}, #${pptSettings.backgroundColor}, #F8FAFC)`
                          : `#${pptSettings.backgroundColor}`
                      }}
                    >
                  {/* Title Slide Preview */}
                  {isTitleSlide ? (
                    <>
                      {/* Title Slide Header Bar */}
                      {(pptSettings.accentBarPosition === 'top' || pptSettings.accentBarPosition === 'both') && (
                        <div 
                          className="w-full absolute top-0"
                          style={{
                            height: '10%',
                            background: `linear-gradient(90deg, #${pptSettings.primaryColor} 0%, #${pptSettings.accentColor} 40%)`
                          }}
                        />
                      )}
                      
                      {/* Title Slide Content */}
                      <div 
                        className="flex flex-col items-center justify-center h-full"
                        style={{
                          paddingTop: (pptSettings.accentBarPosition === 'top' || pptSettings.accentBarPosition === 'both') ? '12%' : '0',
                          paddingBottom: (pptSettings.accentBarPosition === 'bottom' || pptSettings.accentBarPosition === 'both') ? '10%' : '0',
                          paddingLeft: pptSettings.titleSlideStyle === 'left' ? '10%' : '5%',
                          paddingRight: pptSettings.titleSlideStyle === 'left' ? '10%' : '5%'
                        }}
                      >
                        <h1
                          style={{
                            fontSize: '36px',
                            fontFamily: pptSettings.fontFamily,
                            fontWeight: 'bold',
                            color: `#${pptSettings.primaryColor}`,
                            textAlign: pptSettings.titleSlideStyle === 'left' ? 'left' : 'center',
                            marginBottom: pptSettings.titleSlideStyle === 'minimal' ? '0' : '20px',
                            lineHeight: '1.2'
                          }}
                        >
                          {titleSlideTitle.length > 60 ? titleSlideTitle.substring(0, 60) + '...' : titleSlideTitle}
                        </h1>
                        {pptSettings.titleSlideStyle !== 'minimal' && (
                          <p
                            style={{
                              fontSize: '18px',
                              fontFamily: pptSettings.fontFamily,
                              color: `#${previewTextGray}`,
                              textAlign: pptSettings.titleSlideStyle === 'left' ? 'left' : 'center',
                              fontStyle: 'italic',
                              maxWidth: '80%'
                            }}
                          >
                            {titleSlideSubtitle}
                          </p>
                        )}
                      </div>
                      
                      {/* Title Slide Bottom Bar */}
                      {(pptSettings.accentBarPosition === 'bottom' || pptSettings.accentBarPosition === 'both') && (
                        <div 
                          className="absolute bottom-0 left-0 w-full"
                          style={{
                            height: '10%',
                            background: `linear-gradient(90deg, #${previewAccentYellow} 0%, #${previewAccentPurple} 30%)`
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                  {/* Content Slide Header Bar */}
                  {(pptSettings.accentBarPosition === 'top' || pptSettings.accentBarPosition === 'both') && (
                    <div 
                      className="w-full relative"
                      style={{
                        height: pptSettings.headerHeight === 'small' ? '12%' : pptSettings.headerHeight === 'large' ? '20%' : '16%',
                        background: `linear-gradient(90deg, #${pptSettings.primaryColor} 0%, #${pptSettings.accentColor} 40%)`
                      }}
                    >
                      {/* Slide Number */}
                      {pptSettings.showSlideNumbers && (
                        <div 
                          className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: pptSettings.roundedCorners ? '8px' : '50%',
                            backgroundColor: `#${previewAccentYellow}`,
                            border: `2px solid white`,
                            boxShadow: pptSettings.shadowEffect ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                          }}
                        >
                          {previewSlideIndex + 1}
                        </div>
                      )}
                      
                      {/* Title - Using Actual Content */}
                      <div 
                        className="absolute left-16 top-1/2 -translate-y-1/2 text-white font-bold"
                        style={{
                          fontSize: '20px',
                          fontFamily: pptSettings.fontFamily,
                          textAlign: pptSettings.textAlignment === 'center' ? 'center' : pptSettings.textAlignment === 'right' ? 'right' : 'left',
                          width: 'calc(100% - 80px)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={slideTitle}
                      >
                        {slideTitle.length > 50 ? slideTitle.substring(0, 50) + '...' : slideTitle}
                      </div>
                    </div>
                  )}
                  
                  {/* Content Area */}
                  <div 
                    className="p-6"
                    style={{
                      paddingTop: (pptSettings.accentBarPosition === 'top' || pptSettings.accentBarPosition === 'both') 
                        ? (pptSettings.headerHeight === 'small' ? '16%' : pptSettings.headerHeight === 'large' ? '24%' : '20%')
                        : (pptSettings.contentPadding === 'tight' ? '12px' : pptSettings.contentPadding === 'spacious' ? '32px' : '24px'),
                      paddingLeft: pptSettings.contentPadding === 'tight' ? '12px' : pptSettings.contentPadding === 'spacious' ? '32px' : '24px',
                      paddingRight: pptSettings.contentPadding === 'tight' ? '12px' : pptSettings.contentPadding === 'spacious' ? '32px' : '24px',
                      paddingBottom: (pptSettings.accentBarPosition === 'bottom' || pptSettings.accentBarPosition === 'both') ? '60px' : '24px'
                    }}
                  >
                    {/* Actual Bullet Points from Slides */}
                    {displayBullets.map((text, idx) => {
                      const bulletText = typeof text === 'string' ? text : (text?.text || String(text))
                      const displayText = bulletText.length > 100 ? bulletText.substring(0, 100) + '...' : bulletText
                      
                      return (
                        <div key={idx} className="flex items-start gap-3 mb-3" style={{ marginBottom: pptSettings.lineSpacing === 'tight' ? '8px' : pptSettings.lineSpacing === 'loose' ? '16px' : '12px' }}>
                          {/* Bullet */}
                          {pptSettings.bulletStyle !== 'none' && (
                            <div
                              style={{
                                width: '12px',
                                height: '12px',
                                marginTop: '4px',
                                borderRadius: pptSettings.bulletStyle === 'circle' ? '50%' : pptSettings.bulletStyle === 'square' ? '2px' : '0',
                                backgroundColor: pptSettings.iconStyle === 'outline' ? 'transparent' : `#${pptSettings.accentColor}`,
                                border: `2px solid #${pptSettings.accentColor}`,
                                clipPath: pptSettings.bulletStyle === 'arrow' ? 'polygon(0 50%, 100% 0, 100% 100%)' : 'none'
                              }}
                            />
                          )}
                          
                          {/* Text */}
                          <div
                            style={{
                              color: `#${previewTextDark}`,
                              fontSize: pptSettings.fontSize === 'small' ? '13px' : pptSettings.fontSize === 'large' ? '17px' : '15px',
                              fontFamily: pptSettings.fontFamily,
                              textAlign: pptSettings.textAlignment === 'center' ? 'center' : pptSettings.textAlignment === 'right' ? 'right' : 'left',
                              lineHeight: pptSettings.lineSpacing === 'tight' ? '1.4' : pptSettings.lineSpacing === 'loose' ? '1.8' : '1.6',
                              flex: 1
                            }}
                            title={bulletText}
                          >
                            {displayText}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                    </>
                  )}
                  
                  {/* Bottom Accent Bar */}
                  {(pptSettings.accentBarPosition === 'bottom' || pptSettings.accentBarPosition === 'both') && (
                    <div 
                      className="absolute bottom-0 left-0 w-full"
                      style={{
                        height: '8px',
                        backgroundColor: `#${pptSettings.secondaryColor}`
                      }}
                    />
                  )}
                  
                  {/* Left Border */}
                  {pptSettings.borderStyle !== 'none' && (
                    <div 
                      className="absolute left-0 top-0 bottom-0"
                      style={{
                        width: pptSettings.borderWidth === 'thin' ? '3px' : pptSettings.borderWidth === 'thick' ? '6px' : '4px',
                        backgroundColor: `#${previewAccentPurple}`,
                        borderLeft: pptSettings.borderStyle === 'dashed' ? `3px dashed #${previewAccentPurple}` : 
                                   pptSettings.borderStyle === 'dotted' ? `3px dotted #${previewAccentPurple}` : 
                                   `3px solid #${previewAccentPurple}`,
                        boxShadow: pptSettings.shadowEffect ? '2px 0 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    />
                  )}
                  
                  {/* Footer */}
                  {pptSettings.showFooter && (
                    <div 
                      className="absolute bottom-2 left-4 text-xs"
                      style={{
                        color: `#${previewTextGray}`,
                        fontFamily: pptSettings.fontFamily
                      }}
                    >
                      {pptSettings.footerText}
                    </div>
                  )}
                    </div>
                  )
                })()}
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-black">
                <p className="text-xs text-black">
                  <strong>Live Preview:</strong> Showing actual content from your slides. All styling changes update in real-time. The generated PPTX will match this preview exactly.
                </p>
              </div>
            </div>
          </div>

          {/* Footer: Action Buttons */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
            <button
              onClick={() => setShowPPTSettings(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowPPTSettings(false)
                handleDownloadPPTX()
              }}
              disabled={isGeneratingSlides}
              className="px-6 py-2 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-lg font-semibold hover:from-violet-700 hover:via-purple-700 hover:to-fuchsia-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingSlides ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 inline mr-2" />
                  Generate & Download PPTX
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Storyboard View Modal */}
    {showStoryboard && (
      <StoryboardView
        storyboard={storyboard}
        researchId={id}
        onClose={() => {
          setShowStoryboard(false)
          setStoryboard(null)
        }}
      />
    )}

    {/* Storyboard Error Display */}
    {storyboardError && !showStoryboard && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-600">Storyboard Generation Error</h3>
            <button
              onClick={() => setStoryboardError('')}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="text-gray-700 whitespace-pre-line">{storyboardError}</div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setStoryboardError('')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

