import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  Film, 
  Lightbulb, 
  Layers, 
  MessageSquare, 
  Image as ImageIcon, 
  Heart, 
  Target,
  ChevronRight,
  ChevronDown,
  Eye,
  FileText,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Info,
  Presentation
} from 'lucide-react'

export default function StoryboardView({ storyboard, onClose, researchId }) {
  const navigate = useNavigate()
  const params = useParams()
  const id = researchId || params?.id
  const [expandedBuckets, setExpandedBuckets] = useState({})
  const [expandedClaims, setExpandedClaims] = useState({})
  const [expandedScenes, setExpandedScenes] = useState({})
  const [expandedFrames, setExpandedFrames] = useState({})
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [showEvidence, setShowEvidence] = useState({})

  if (!storyboard) return null

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

  const getSceneTypeColor = (type) => {
    switch (type) {
      case 'context': return 'bg-[#f0f0f0] text-[#333333] border-[#000000]'
      case 'tension': return 'bg-[#f0f0f0] text-[#333333] border-[#000000]'
      case 'intervention': return 'bg-[#f0f0f0] text-[#333333] border-[#000000]'
      case 'proof': return 'bg-[#f0f0f0] text-[#333333] border-[#000000]'
      case 'outcome': return 'bg-[#f0f0f0] text-[#333333] border-[#000000]'
      default: return 'bg-[#f0f0f0] text-[#333333] border-[#000000]'
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
  storyboard.frames?.forEach(frame => {
    if (!framesByScene[frame.sceneGroupId]) {
      framesByScene[frame.sceneGroupId] = []
    }
    framesByScene[frame.sceneGroupId].push(frame)
  })

  // Group scene groups by story claim
  const scenesByClaim = {}
  storyboard.sceneGroups?.forEach(scene => {
    if (!scenesByClaim[scene.storyClaimId]) {
      scenesByClaim[scene.storyClaimId] = []
    }
    scenesByClaim[scene.storyClaimId].push(scene)
  })

  // Group claims by bucket
  const claimsByBucket = {}
  storyboard.storyClaims?.forEach(claim => {
    if (!claimsByBucket[claim.insightBucketId]) {
      claimsByBucket[claim.insightBucketId] = []
    }
    claimsByBucket[claim.insightBucketId].push(claim)
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#000000] text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Storyboard</h2>
                <p className="text-white/70 text-sm mt-1">
                  {getStorySpineLabel(storyboard.storySpine)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {id && (
                <button
                  onClick={() => {
                    onClose()
                    navigate(`/ppt/${id}`)
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#000000] rounded-lg hover:bg-white/90 transition-all duration-200 font-semibold text-sm shadow-sm"
                >
                  <Presentation className="w-5 h-5" />
                  Generate PPT
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Controlling Insight */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-5 rounded-lg">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Controlling Insight</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {storyboard.controllingInsight}
                </p>
              </div>
            </div>
          </div>

          {/* Insight Buckets */}
          {storyboard.insightBuckets?.map((bucket) => (
            <div key={bucket.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleBucket(bucket.id)}
                className="w-full bg-gray-50 hover:bg-gray-100 p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-[#333333]" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">{bucket.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{bucket.description}</p>
                  </div>
                </div>
                {expandedBuckets[bucket.id] ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {expandedBuckets[bucket.id] && (
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Supporting Findings:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                      {bucket.findings?.map((finding, idx) => (
                        <li key={idx}>{finding}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Story Claims for this bucket */}
                  {claimsByBucket[bucket.id]?.map((claim) => (
                    <div key={claim.id} className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleClaim(claim.id)}
                        className="w-full bg-[#f5f5f5] hover:bg-[#f0f0f0] p-3 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#333333]" />
                          <span className="font-medium text-gray-800 text-sm">{claim.claim}</span>
                        </div>
                        {expandedClaims[claim.id] ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {expandedClaims[claim.id] && (
                        <div className="p-3 bg-white border-t border-gray-200">
                          <p className="text-sm text-gray-600 italic mb-3">{claim.narrativeLanguage}</p>

                          {/* Scene Groups for this claim */}
                          {scenesByClaim[claim.id]?.map((scene) => (
                            <div key={scene.id} className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleScene(scene.id)}
                                className={`w-full p-3 flex items-center justify-between transition-colors border-l-4 ${getSceneTypeColor(scene.type)}`}
                              >
                                <div className="flex items-center gap-2">
                                  {getSceneTypeIcon(scene.type)}
                                  <div className="text-left">
                                    <span className="font-medium text-sm capitalize">{scene.type}</span>
                                    <p className="text-xs text-gray-600 mt-0.5">{scene.description}</p>
                                  </div>
                                </div>
                                {expandedScenes[scene.id] ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>

                              {expandedScenes[scene.id] && (
                                <div className="p-3 bg-gray-50 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 mb-3">{scene.situation}</p>

                                  {/* Frames for this scene */}
                                  {framesByScene[scene.id]?.map((frame) => (
                                    <div
                                      key={frame.id}
                                      className="mt-2 bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                                      onClick={() => setSelectedFrame(frame)}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-[#000000] bg-[#f0f0f0] border border-[#e0e0e0] px-2 py-1 rounded">
                                              Frame {frame.frameNumber}
                                            </span>
                                          </div>
                                          <h5 className="font-medium text-gray-800 text-sm mb-1">{frame.idea}</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                            <div className="flex items-start gap-1.5">
                                              <ImageIcon className="w-3.5 h-3.5 text-[#333333] mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-gray-600">{frame.visualAction}</p>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                              <Heart className="w-3.5 h-3.5 text-[#333333] mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-gray-600">{frame.emotionalBeat}</p>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                              <Target className="w-3.5 h-3.5 text-[#333333] mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-gray-600">{frame.logicalPurpose}</p>
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
                                          className="text-xs text-[#666666] hover:text-[#000000] flex items-center gap-1"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          Evidence
                                        </button>
                                      </div>

                                      {showEvidence[frame.id] && frame.supportingEvidence && frame.supportingEvidence.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <h6 className="text-xs font-medium text-gray-700 mb-2">Supporting Evidence:</h6>
                                          <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 ml-2">
                                            {frame.supportingEvidence.map((evidence, idx) => (
                                              <li key={idx}>{evidence}</li>
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

          {/* Remaining Research */}
          {storyboard.remainingResearch && (
            storyboard.remainingResearch.unusedFindings?.length > 0 ||
            storyboard.remainingResearch.supportingEvidence?.length > 0
          ) && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Additional Research Evidence
              </h3>
              {storyboard.remainingResearch.unusedFindings?.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Unused Findings:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                    {storyboard.remainingResearch.unusedFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Frame Detail Modal */}
      {selectedFrame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Frame {selectedFrame.frameNumber}
              </h3>
              <button
                onClick={() => setSelectedFrame(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Idea</h4>
                <p className="text-gray-600">{selectedFrame.idea}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#333333]" />
                  Visual Action
                </h4>
                <p className="text-gray-600">{selectedFrame.visualAction}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#333333]" />
                  Emotional Beat
                </h4>
                <p className="text-gray-600">{selectedFrame.emotionalBeat}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#333333]" />
                  Logical Purpose
                </h4>
                <p className="text-gray-600">{selectedFrame.logicalPurpose}</p>
              </div>
              {selectedFrame.supportingEvidence && selectedFrame.supportingEvidence.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Supporting Evidence</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {selectedFrame.supportingEvidence.map((evidence, idx) => (
                      <li key={idx}>{evidence}</li>
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
