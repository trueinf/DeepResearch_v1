import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { 
  ArrowLeft, 
  X, 
  AlertCircle, 
  Lightbulb, 
  Layers, 
  ChevronRight,
  ChevronDown,
  FileText,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Info,
  Image as ImageIcon,
  Heart,
  Eye,
  Presentation
} from 'lucide-react'

export default function StoryboardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResearch, getResearchReport } = useResearch()
  const [storyboard, setStoryboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedBuckets, setExpandedBuckets] = useState({})
  const [expandedClaims, setExpandedClaims] = useState({})
  const [expandedScenes, setExpandedScenes] = useState({})
  const [expandedFrames, setExpandedFrames] = useState({})
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [showEvidence, setShowEvidence] = useState({})

  useEffect(() => {
    const loadStoryboard = async () => {
      try {
        const research = getResearch(id)
        if (!research) {
          navigate('/')
          return
        }

        const report = await getResearchReport(id)
        if (report?.storyboard) {
          setStoryboard(report.storyboard)
        }
      } catch (error) {
        console.error('Error loading storyboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStoryboard()
  }, [id, getResearch, getResearchReport, navigate])

  const toggleBucket = (bucketId) => {
    setExpandedBuckets(prev => ({
      ...prev,
      [bucketId]: !prev[bucketId]
    }))
  }

  const toggleClaim = (claimId) => {
    setExpandedClaims(prev => ({
      ...prev,
      [claimId]: !prev[claimId]
    }))
  }

  const toggleScene = (sceneId) => {
    setExpandedScenes(prev => ({
      ...prev,
      [sceneId]: !prev[sceneId]
    }))
  }

  const toggleFrame = (frameId) => {
    setExpandedFrames(prev => ({
      ...prev,
      [frameId]: !prev[frameId]
    }))
  }

  const getSceneTypeIcon = (type) => {
    switch (type) {
      case 'context': return <Layers className="w-4 h-4 text-[#333333]" />
      case 'tension': return <Target className="w-4 h-4 text-[#333333]" />
      case 'intervention': return <Sparkles className="w-4 h-4 text-[#333333]" />
      case 'proof': return <FileText className="w-4 h-4 text-[#333333]" />
      case 'outcome': return <ArrowRight className="w-4 h-4 text-[#333333]" />
      default: return <Info className="w-4 h-4 text-[#333333]" />
    }
  }

  const getStorySpineLabel = (spine) => {
    switch (spine) {
      case 'problem-insight-resolution': return 'Problem → Insight → Resolution'
      case 'before-during-after': return 'Before → During → After'
      case 'question-discovery-answer': return 'Question → Discovery → Answer'
      default: return spine
    }
  }

  // Group frames by scene group
  const framesByScene = {}
  storyboard?.frames?.forEach(frame => {
    if (!framesByScene[frame.sceneGroupId]) {
      framesByScene[frame.sceneGroupId] = []
    }
    framesByScene[frame.sceneGroupId].push(frame)
  })

  // Group scene groups by story claim
  const scenesByClaim = {}
  storyboard?.sceneGroups?.forEach(scene => {
    if (!scenesByClaim[scene.storyClaimId]) {
      scenesByClaim[scene.storyClaimId] = []
    }
    scenesByClaim[scene.storyClaimId].push(scene)
  })

  // Group claims by bucket
  const claimsByBucket = {}
  storyboard?.storyClaims?.forEach(claim => {
    if (!claimsByBucket[claim.insightBucketId]) {
      claimsByBucket[claim.insightBucketId] = []
    }
    claimsByBucket[claim.insightBucketId].push(claim)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="text-[#666666] text-base">Loading storyboard...</div>
      </div>
    )
  }

  if (!storyboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5]">
        <AlertCircle className="w-12 h-12 text-[#666666] mb-4" />
        <h2 className="text-2xl font-bold text-[#000000] mb-2">No Storyboard Found</h2>
        <p className="text-[#666666] mb-6">Generate a storyboard from a research report first.</p>
        <button
          onClick={() => navigate(`/report/${id}`)}
          className="px-6 py-3 bg-[#000000] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Go to Report
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <div className="bg-[#000000] rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/report/${id}`)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Storyboard</h1>
              <p className="text-white/70 text-sm mt-1">
                {getStorySpineLabel(storyboard.storySpine)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/ppt/${id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#000000] rounded-lg hover:bg-white/90 transition-all duration-200 font-medium text-sm"
            >
              <Presentation className="w-4 h-4" />
              Generate PPT
            </button>
            <button
              onClick={() => navigate(`/report/${id}`)}
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Controlling Insight Card */}
        {storyboard.controllingInsight && (
          <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm p-6 border-l-4 border-l-[#000000]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#000000] rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#333333] mb-2 text-lg">Controlling Insight</h3>
                <p className="text-[#555555] text-base leading-relaxed">
                  {storyboard.controllingInsight}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Insight Buckets */}
        {storyboard.insightBuckets?.map((bucket) => (
          <div key={bucket.id} className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm overflow-hidden">
            <button
              onClick={() => toggleBucket(bucket.id)}
              className="w-full p-6 flex items-center justify-between transition-colors hover:bg-[#f5f5f5]"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#f0f0f0] rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-[#333333]" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-[#333333] text-lg">{bucket.name}</h3>
                  <p className="text-sm text-[#666666] mt-1">{bucket.description}</p>
                </div>
              </div>
              {expandedBuckets[bucket.id] ? (
                <ChevronDown className="w-5 h-5 text-[#666666]" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[#666666]" />
              )}
            </button>

            {expandedBuckets[bucket.id] && (
              <div className="px-6 pb-6 border-t border-[#e0e0e0] bg-white">
                <div className="pt-6 mb-6">
                  <h4 className="font-semibold text-[#333333] mb-3 text-base">Supporting Findings:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-[#555555] ml-2">
                    {bucket.findings?.map((finding, idx) => (
                      <li key={idx} className="leading-relaxed">{finding}</li>
                    ))}
                  </ul>
                </div>

                {/* Story Claims for this bucket */}
                {claimsByBucket[bucket.id]?.map((claim) => (
                  <div key={claim.id} className="mt-4 border border-[#e0e0e0] rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => toggleClaim(claim.id)}
                      className="w-full bg-[#f5f5f5] hover:bg-[#f0f0f0] p-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#333333]" />
                        <span className="font-semibold text-[#333333] text-sm">{claim.claim}</span>
                      </div>
                      {expandedClaims[claim.id] ? (
                        <ChevronDown className="w-4 h-4 text-[#666666]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#666666]" />
                      )}
                    </button>

                    {expandedClaims[claim.id] && (
                      <div className="p-4 bg-white border-t border-[#e0e0e0]">
                        <p className="text-sm text-[#666666] italic mb-4 leading-relaxed">{claim.narrativeLanguage}</p>

                        {/* Scene Groups for this claim */}
                        {scenesByClaim[claim.id]?.map((scene) => (
                          <div key={scene.id} className="mt-3 border border-[#e0e0e0] rounded-lg overflow-hidden bg-white">
                            <button
                              onClick={() => toggleScene(scene.id)}
                              className="w-full p-4 flex items-center justify-between transition-colors hover:bg-[#f5f5f5] border-l-4 border-l-[#000000]"
                            >
                              <div className="flex items-center gap-3">
                                {getSceneTypeIcon(scene.type)}
                                <div className="text-left">
                                  <span className="font-semibold text-sm capitalize text-[#333333]">{scene.type}</span>
                                  <p className="text-xs text-[#666666] mt-0.5">{scene.description}</p>
                                </div>
                              </div>
                              {expandedScenes[scene.id] ? (
                                <ChevronDown className="w-4 h-4 text-[#666666]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-[#666666]" />
                              )}
                            </button>

                            {expandedScenes[scene.id] && (
                              <div className="p-4 bg-white border-t border-[#e0e0e0]">
                                <p className="text-xs text-[#666666] mb-4 leading-relaxed">{scene.situation}</p>

                                {/* Frames for this scene */}
                                {framesByScene[scene.id]?.map((frame) => (
                                  <div
                                    key={frame.id}
                                    className="mt-3 bg-white border border-[#e0e0e0] rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                                    onClick={() => setSelectedFrame(frame)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-xs font-bold text-[#000000] bg-[#f0f0f0] border border-[#e0e0e0] px-2 py-1 rounded">
                                            Frame {frame.frameNumber}
                                          </span>
                                        </div>
                                        <h5 className="font-semibold text-[#333333] text-sm mb-3">{frame.idea}</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                          <div className="flex items-start gap-2">
                                            <ImageIcon className="w-4 h-4 text-[#333333] mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-[#666666] leading-relaxed">{frame.visualAction}</p>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <Heart className="w-4 h-4 text-[#333333] mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-[#666666] leading-relaxed">{frame.emotionalBeat}</p>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <Target className="w-4 h-4 text-[#333333] mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-[#666666] leading-relaxed">{frame.logicalPurpose}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowEvidence(prev => ({
                                            ...prev,
                                            [frame.id]: !prev[frame.id]
                                          }))
                                        }}
                                        className="text-xs text-[#666666] hover:text-[#000000] flex items-center gap-1 transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        Evidence
                                      </button>
                                    </div>

                                    {showEvidence[frame.id] && frame.supportingEvidence && frame.supportingEvidence.length > 0 && (
                                      <div className="mt-4 pt-4 border-t border-[#e0e0e0]">
                                        <h6 className="text-xs font-semibold text-[#333333] mb-2">Supporting Evidence:</h6>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-[#666666] ml-2">
                                          {frame.supportingEvidence.map((evidence, idx) => (
                                            <li key={idx} className="leading-relaxed">{evidence}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Additional Research Evidence */}
        {storyboard.remainingResearch && (
          (storyboard.remainingResearch.unusedFindings?.length > 0 ||
            storyboard.remainingResearch.supportingEvidence?.length > 0) && (
            <div className="bg-white rounded-lg border border-[#e0e0e0] shadow-sm p-6">
              <h3 className="font-bold text-[#333333] mb-4 flex items-center gap-3 text-lg">
                <FileText className="w-5 h-5 text-[#333333]" />
                Additional Research Evidence
              </h3>
              {storyboard.remainingResearch.unusedFindings?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[#333333] mb-3">Unused Findings:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-[#555555] ml-2">
                    {storyboard.remainingResearch.unusedFindings.map((finding, idx) => (
                      <li key={idx} className="leading-relaxed">{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Frame Detail Modal */}
      {selectedFrame && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedFrame(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#000000]">
                Frame {selectedFrame.frameNumber}
              </h3>
              <button
                onClick={() => setSelectedFrame(null)}
                className="text-[#666666] hover:text-[#000000] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 text-base">Idea</h4>
                <p className="text-[#555555] leading-relaxed">{selectedFrame.idea}</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 flex items-center gap-2 text-base">
                  <ImageIcon className="w-4 h-4 text-[#333333]" />
                  Visual Action
                </h4>
                <p className="text-[#555555] leading-relaxed">{selectedFrame.visualAction}</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 flex items-center gap-2 text-base">
                  <Heart className="w-4 h-4 text-[#333333]" />
                  Emotional Beat
                </h4>
                <p className="text-[#555555] leading-relaxed">{selectedFrame.emotionalBeat}</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#333333] mb-2 flex items-center gap-2 text-base">
                  <Target className="w-4 h-4 text-[#333333]" />
                  Logical Purpose
                </h4>
                <p className="text-[#555555] leading-relaxed">{selectedFrame.logicalPurpose}</p>
              </div>
              {selectedFrame.supportingEvidence && selectedFrame.supportingEvidence.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[#333333] mb-3 text-base">Supporting Evidence</h4>
                  <ul className="list-disc list-inside space-y-2 text-[#555555]">
                    {selectedFrame.supportingEvidence.map((evidence, idx) => (
                      <li key={idx} className="leading-relaxed">{evidence}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
