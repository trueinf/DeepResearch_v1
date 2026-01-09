import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { ArrowLeft, Send, User, Bot, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export default function FollowUpChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResearch, getResearchReport, saveChatMessage, getChatMessages } = useResearch()
  
  const research = getResearch(id)
  const [report, setReport] = useState(null)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [clarifyingAnswers, setClarifyingAnswers] = useState(null)
  const [isExecutiveSummaryCollapsed, setIsExecutiveSummaryCollapsed] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!research) return
      
      const reportData = await getResearchReport(id)
      setReport(reportData)
      
      // Load clarifying answers from research options
      if (research.options && research.options.clarifyingAnswers) {
        setClarifyingAnswers(research.options.clarifyingAnswers)
      }
      
      const chatMessages = await getChatMessages(id)
      if (chatMessages) {
        setMessages(chatMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content
        })))
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [id, research, getResearchReport, getChatMessages])

  if (!research || loading) {
    return (
      <div className="ml-64 pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{loading ? 'Loading...' : 'Report not found'}</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="ml-64 pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Report not found</p>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return
    
    if (!report || !report.topic) {
      console.error('Report not loaded:', report)
      alert('Report data is not available. Please refresh the page.')
      return
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query
    }

    setMessages(prev => [...prev, userMessage])
    await saveChatMessage(id, 'user', query)
    const userQuery = query
    setQuery('')
    setIsLoading(true)

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration missing. Check your .env file.')
      }

      const requestBody = {
        question: userQuery,
        report: {
          topic: report.topic || '',
          executiveSummary: report.executiveSummary || null,
          detailedAnalysis: report.detailedAnalysis || null,
          keyFindings: report.keyFindings || [],
          insights: report.insights || null,
          conclusion: report.conclusion || null,
          metadata: report.metadata || null
        },
        clarifyingAnswers: clarifyingAnswers || null
      }

      console.log('Sending chat request:', {
        url: `${SUPABASE_URL}/functions/v1/chat-Research`,
        hasQuestion: !!requestBody.question,
        hasReport: !!requestBody.report,
        reportTopic: requestBody.report.topic,
        reportKeys: Object.keys(requestBody.report)
      })

      const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-Research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || 'Unknown error' }
        }
        console.error('Chat API error:', response.status, errorData)
        throw new Error(errorData.error || errorData.message || `Failed to get answer (${response.status})`)
      }

      const data = await response.json()
      console.log('Chat API response:', data)
      const answer = data.answer || "I couldn't generate an answer. Please try rephrasing your question."

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: answer
      }
      setMessages(prev => [...prev, botMessage])
      await saveChatMessage(id, 'bot', botMessage.content)
    } catch (error) {
      console.error('Error getting chat answer:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: `Sorry, I encountered an error: ${error?.message || 'Unknown error'}. Please check the browser console for details or try again.`
      }
      setMessages(prev => [...prev, errorMessage])
      await saveChatMessage(id, 'bot', errorMessage.content)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-16 py-12">
        <button
          onClick={() => navigate(`/report/${id}`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 transition-all duration-200 hover:gap-3 group font-semibold hover-lift"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Report
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-140px)] items-start">
          <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
            {clarifyingAnswers && clarifyingAnswers.length > 0 && (
              <div className="glass-effect rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden hover-lift animate-fadeIn max-h-[55vh] flex flex-col">
                <div className="px-6 py-4 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900">Research Context</h2>
                  <p className="text-xs text-gray-600 mt-1">Your original clarifications</p>
                </div>
                <div className="px-6 py-4 overflow-y-auto flex-1">
                  {clarifyingAnswers.map((qa, idx) => (
                    <div key={idx} className="mb-4 last:mb-0">
                      <p className="text-sm font-semibold text-purple-700 mb-1">Q{idx + 1}: {qa.question}</p>
                      <p className="text-sm text-gray-700 bg-purple-50 rounded-lg p-2">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="glass-effect rounded-2xl shadow-xl border-2 border-blue-200 overflow-hidden hover-lift animate-fadeIn max-h-[35vh] flex flex-col">
              <div className="px-6 py-4 border-b border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Executive Summary</h2>
              </div>

              <div className="px-6 py-4 overflow-y-auto flex-1">
                {report.executiveSummary ? (
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{report.executiveSummary}</div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>Executive summary not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 animate-fadeIn h-full" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div className="glass-effect rounded-2xl shadow-xl border-2 border-blue-200 h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Follow-up Questions</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12 text-gray-500 animate-fadeIn">
                    <p>Ask questions about the research</p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 animate-fadeIn ${
                      message.role === 'user' 
                        ? 'justify-end animate-slideInRight' 
                        : 'justify-start animate-slideIn'
                    }`}
                    style={{ animationDelay: `${0.05 * index}s`, animationFillMode: 'both' }}
                  >
                    {message.role === 'bot' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-scaleIn">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 transition-all duration-200 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 hover:from-gray-100 hover:to-gray-200 hover:shadow-md border border-gray-200'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center animate-scaleIn">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 outline-none text-gray-900 placeholder-gray-400 hover:border-blue-300 transition-all duration-200 font-medium disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

