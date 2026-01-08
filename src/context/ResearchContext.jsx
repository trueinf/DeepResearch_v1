import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ResearchContext = createContext()

export const useResearch = () => {
  const context = useContext(ResearchContext)
  if (!context) {
    throw new Error('useResearch must be used within ResearchProvider')
  }
  return context
}

export const ResearchProvider = ({ children }) => {
  const [researches, setResearches] = useState([])
  const [researchData, setResearchData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResearches()
  }, [])

  const loadResearches = async () => {
    try {
      const { data, error } = await supabase
        .from('researches')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setResearches(data)
        await loadReports(data.map(r => r.id), data)
      }
    } catch (error) {
      console.error('Error loading researches:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReports = async (researchIds, researchesList) => {
    if (researchIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('research_reports')
        .select('*')
        .in('research_id', researchIds)

      if (error) throw error

          if (data) {
            // Normalize arrays - ensure they're always arrays, not 0 or other values
            const normalizeArray = (value) => {
              if (Array.isArray(value)) return value
              if (value === 0 || value === null || value === undefined) return []
              return [value]
            }
            
            const reportsMap = {}
            data.forEach(report => {
              reportsMap[report.research_id] = {
                topic: researchesList.find(r => r.id === report.research_id)?.topic || '',
                keyFindings: normalizeArray(report.key_findings).map(finding => ({
                  ...finding,
                  citations: normalizeArray(finding?.citations)
                })),
                sources: normalizeArray(report.sources),
                executiveSummary: report.executive_summary || null,
                detailedAnalysis: report.detailed_analysis || null,
                insights: report.insights || null,
                conclusion: report.conclusion || null,
                metadata: report.metadata || null,
                universalResearchOutput: report.universal_research_output || null,
                universalReport: report.universal_research_output ? (() => {
                  try {
                    if (typeof report.universal_research_output === 'string') {
                      // Check if it's markdown (starts with # or other markdown indicators)
                      const trimmed = report.universal_research_output.trim()
                      if (trimmed.startsWith('#') || trimmed.startsWith('##') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
                        // It's markdown text, not JSON - return null for parsed version
                        return null
                      }
                      // Try to parse as JSON
                      return JSON.parse(report.universal_research_output)
                    }
                    return report.universal_research_output
                  } catch (e) {
                    // If parsing fails, it's likely markdown text, return null silently
                    return null
                  }
                })() : null
              }
            })
            setResearchData(reportsMap)
          }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const createResearch = useCallback(async (topic, options) => {
    try {
      const { data, error } = await supabase
        .from('researches')
        .insert({
          topic,
          status: 'In Progress',
          model: options?.model || 'claude-sonnet-4-5-20250929',
          options: {
            ...options,
            clarifyingAnswers: options?.clarifyingAnswers || null
          }
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setResearches(prev => [data, ...prev])
        return data.id
      }
    } catch (error) {
      console.error('Error creating research:', error)
      throw error
    }
  }, [])

  const updateResearchStatus = useCallback(async (id, status, data = {}) => {
    try {
      const updateData = { status, ...data }
      const { data: updatedResearch, error } = await supabase
        .from('researches')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      if (updatedResearch) {
        setResearches(prev => prev.map(r => 
          r.id === id ? { ...r, ...updatedResearch } : r
        ))
      }
    } catch (error) {
      console.error('Error updating research status:', error)
    }
  }, [])

  const setResearchReport = useCallback(async (id, report) => {
    try {
      console.log('Saving research report for ID:', id)
      console.log('Report data:', {
        hasExecutiveSummary: !!report.executiveSummary,
        keyFindingsCount: report.keyFindings?.length || 0,
        sourcesCount: report.sources?.length || 0,
        hasDetailedAnalysis: !!report.detailedAnalysis,
        hasInsights: !!report.insights,
        hasConclusion: !!report.conclusion
      })

      // Check if report exists
      const { data: existingReport, error: checkError } = await supabase
        .from('research_reports')
        .select('id')
        .eq('research_id', id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing report:', checkError)
        throw checkError
      }

      // Don't include metadata in database save until column is added
      // To add the column, run in Supabase SQL Editor:
      // ALTER TABLE research_reports ADD COLUMN IF NOT EXISTS metadata TEXT;
      const reportData = {
        research_id: id,
        executive_summary: report.executiveSummary || null,
        key_findings: report.keyFindings || report.key_findings || [],
        sources: report.sources || [],
        detailed_analysis: report.detailedAnalysis || null,
        insights: report.insights || null,
        conclusion: report.conclusion || null,
        universal_research_output: report.universalReport ? JSON.stringify(report.universalReport) : (report.universalResearchOutput || null)
        // metadata: report.metadata || null  // Uncomment after adding column
      }

      let result
      if (existingReport) {
        // Report exists, update it
        console.log('Updating existing report:', existingReport.id)
        result = await supabase
          .from('research_reports')
          .update(reportData)
          .eq('id', existingReport.id)
      } else {
        // No report exists yet, create new one
        console.log('Creating new report')
        result = await supabase
          .from('research_reports')
          .insert(reportData)
      }

      if (result.error) {
        console.error('Supabase error details:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint
        })
        throw result.error
      }

      console.log('Research report saved successfully')

      setResearchData(prev => ({
        ...prev,
        [id]: report
      }))

      await updateResearchStatus(id, 'Done')
    } catch (error) {
      console.error('Error saving research report:', error)
      // Don't throw - allow the UI to continue even if save fails
      // The user can retry later
    }
  }, [updateResearchStatus])

  const getResearch = useCallback((id) => {
    return researches.find(r => r.id === id) || null
  }, [researches])

  const getResearchReport = useCallback(async (id) => {
    if (researchData[id]) {
      return researchData[id]
    }

    try {
      const { data, error } = await supabase
        .from('research_reports')
        .select('*')
        .eq('research_id', id)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully

      // maybeSingle() returns null for 0 rows, error only for multiple rows or other issues
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading research report:', error)
        return null
      }

      if (data) {
        const research = researches.find(r => r.id === id)
        
        // Normalize arrays - ensure they're always arrays, not 0 or other values
        const normalizeArray = (value) => {
          if (Array.isArray(value)) return value
          if (value === 0 || value === null || value === undefined) return []
          return [value]
        }
        
        const report = {
          topic: research?.topic || '',
          keyFindings: normalizeArray(data.key_findings).map(finding => ({
            ...finding,
            citations: normalizeArray(finding?.citations)
          })),
          sources: normalizeArray(data.sources),
          executiveSummary: data.executive_summary || null,
          detailedAnalysis: data.detailed_analysis || null,
          insights: data.insights || null,
          conclusion: data.conclusion || null,
          metadata: data.metadata || null,
          universalResearchOutput: data.universal_research_output || null,
          universalReport: data.universal_research_output ? (() => {
            try {
              if (typeof data.universal_research_output === 'string') {
                // Check if it's markdown (starts with # or other markdown indicators)
                const trimmed = data.universal_research_output.trim()
                if (trimmed.startsWith('#') || trimmed.startsWith('##') || trimmed.startsWith('*') || trimmed.startsWith('-')) {
                  // It's markdown text, not JSON - return null for parsed version
                  return null
                }
                // Try to parse as JSON
                return JSON.parse(data.universal_research_output)
              }
              return data.universal_research_output
            } catch (e) {
              // If parsing fails, it's likely markdown text, return null silently
              return null
            }
          })() : null
        }
        setResearchData(prev => ({ ...prev, [id]: report }))
        return report
      }
      
      // No report found yet (research still in progress)
      return null
    } catch (error) {
      console.error('Error loading research report:', error)
      return null
    }
  }, [researchData, researches])

  const saveChatMessage = useCallback(async (researchId, role, content) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          research_id: researchId,
          role,
          content
        })

      if (error) throw error
    } catch (error) {
      console.error('Error saving chat message:', error)
    }
  }, [])

  const getChatMessages = useCallback(async (researchId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('research_id', researchId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error loading chat messages:', error)
      return []
    }
  }, [])

  const deleteResearch = useCallback(async (researchId) => {
    try {
      // Delete related data first (reports and chat messages)
      // Note: If foreign keys are set up with CASCADE, this might not be necessary
      await supabase
        .from('research_reports')
        .delete()
        .eq('research_id', researchId)
      
      await supabase
        .from('chat_messages')
        .delete()
        .eq('research_id', researchId)
      
      // Delete the research itself
      const { error } = await supabase
        .from('researches')
        .delete()
        .eq('id', researchId)
      
      if (error) throw error
      
      // Update local state
      setResearches(prev => prev.filter(r => r.id !== researchId))
      setResearchData(prev => {
        const newData = { ...prev }
        delete newData[researchId]
        return newData
      })
    } catch (error) {
      console.error('Error deleting research:', error)
      throw error
    }
  }, [])

  return (
    <ResearchContext.Provider value={{
      researches,
      loading,
      createResearch,
      updateResearchStatus,
      setResearchReport,
      getResearch,
      getResearchReport,
      saveChatMessage,
      getChatMessages,
      deleteResearch
    }}>
      {children}
    </ResearchContext.Provider>
  )
}
