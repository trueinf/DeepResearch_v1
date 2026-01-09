import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { 
  ArrowLeft, 
  X, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Palette,
  Type,
  Layout,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  List,
  Save,
  RotateCcw,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import pptxgen from 'pptxgenjs'

const SLIDE_WIDTH = 10
const SLIDE_HEIGHT = 7.5
const DEFAULT_FONT_SIZE = 24
const DEFAULT_TITLE_SIZE = 44

export default function PPTSlideEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResearch, getResearchReport } = useResearch()
  const [storyboard, setStoryboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slides, setSlides] = useState([])
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  
  // Slide customization state
  const [slideSettings, setSlideSettings] = useState({
    backgroundColor: '#FFFFFF',
    titleColor: '#000000',
    textColor: '#333333',
    fontFamily: 'Arial',
    titleSize: DEFAULT_TITLE_SIZE,
    bodySize: DEFAULT_FONT_SIZE,
    titleAlign: 'left',
    bodyAlign: 'left',
    layout: 'titleContent'
  })

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
          generateSlidesFromStoryboard(report.storyboard)
        }
      } catch (error) {
        console.error('Error loading storyboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStoryboard()
  }, [id, getResearch, getResearchReport, navigate])

  const generateSlidesFromStoryboard = (storyboard) => {
    const generatedSlides = []

    // Title slide
    generatedSlides.push({
      id: 'title',
      type: 'title',
      title: storyboard.controllingInsight || 'Research Presentation',
      subtitle: getStorySpineLabel(storyboard.storySpine),
      content: '',
      backgroundColor: slideSettings.backgroundColor,
      titleColor: slideSettings.titleColor,
      textColor: slideSettings.textColor
    })

    // Insight buckets slides
    storyboard.insightBuckets?.forEach((bucket, idx) => {
      generatedSlides.push({
        id: `bucket-${bucket.id}`,
        type: 'content',
        title: bucket.name,
        subtitle: '',
        content: `${bucket.description}\n\n${bucket.findings?.map((f, i) => `• ${f}`).join('\n') || ''}`,
        backgroundColor: slideSettings.backgroundColor,
        titleColor: slideSettings.titleColor,
        textColor: slideSettings.textColor
      })

      // Add story claims for this bucket
      const claims = storyboard.storyClaims?.filter(c => c.insightBucketId === bucket.id) || []
      claims.forEach(claim => {
        generatedSlides.push({
          id: `claim-${claim.id}`,
          type: 'content',
          title: claim.claim,
          subtitle: '',
          content: claim.narrativeLanguage,
          backgroundColor: slideSettings.backgroundColor,
          titleColor: slideSettings.titleColor,
          textColor: slideSettings.textColor
        })

        // Add scenes for this claim
        const scenes = storyboard.sceneGroups?.filter(s => s.storyClaimId === claim.id) || []
        scenes.forEach(scene => {
          const frames = storyboard.frames?.filter(f => f.sceneGroupId === scene.id) || []
          frames.forEach(frame => {
            generatedSlides.push({
              id: `frame-${frame.id}`,
              type: 'content',
              title: frame.idea,
              subtitle: `${scene.type.charAt(0).toUpperCase() + scene.type.slice(1)} - Frame ${frame.frameNumber}`,
              content: `Visual: ${frame.visualAction}\n\nEmotional: ${frame.emotionalBeat}\n\nPurpose: ${frame.logicalPurpose}${frame.supportingEvidence?.length > 0 ? `\n\nEvidence:\n${frame.supportingEvidence.map(e => `• ${e}`).join('\n')}` : ''}`,
              backgroundColor: slideSettings.backgroundColor,
              titleColor: slideSettings.titleColor,
              textColor: slideSettings.textColor
            })
          })
        })
      })
    })

    // Summary slide
    if (storyboard.remainingResearch?.unusedFindings?.length > 0) {
      generatedSlides.push({
        id: 'summary',
        type: 'content',
        title: 'Additional Research Findings',
        subtitle: '',
        content: storyboard.remainingResearch.unusedFindings.map(f => `• ${f}`).join('\n'),
        backgroundColor: slideSettings.backgroundColor,
        titleColor: slideSettings.titleColor,
        textColor: slideSettings.textColor
      })
    }

    setSlides(generatedSlides)
    setSelectedSlideIndex(0)
  }

  const getStorySpineLabel = (spine) => {
    switch (spine) {
      case 'problem-insight-resolution': return 'Problem → Insight → Resolution'
      case 'before-during-after': return 'Before → During → After'
      case 'question-discovery-answer': return 'Question → Discovery → Answer'
      default: return spine
    }
  }

  const updateSlide = (index, updates) => {
    setSlides(prev => prev.map((slide, i) => 
      i === index ? { ...slide, ...updates } : slide
    ))
  }

  const addSlide = () => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      type: 'content',
      title: 'New Slide',
      subtitle: '',
      content: 'Add your content here',
      backgroundColor: slideSettings.backgroundColor,
      titleColor: slideSettings.titleColor,
      textColor: slideSettings.textColor
    }
    setSlides(prev => [...prev, newSlide])
    setSelectedSlideIndex(slides.length)
  }

  const deleteSlide = (index) => {
    if (slides.length <= 1) return
    setSlides(prev => prev.filter((_, i) => i !== index))
    if (selectedSlideIndex >= slides.length - 1) {
      setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1))
    }
  }

  const duplicateSlide = (index) => {
    const slide = slides[index]
    const newSlide = {
      ...slide,
      id: `slide-${Date.now()}`
    }
    setSlides(prev => [...prev.slice(0, index + 1), newSlide, ...prev.slice(index + 1)])
  }

  const moveSlide = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === slides.length - 1)) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newSlides = [...slides]
    ;[newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]]
    setSlides(newSlides)
    setSelectedSlideIndex(newIndex)
  }

  const applySettingsToAll = () => {
    setSlides(prev => prev.map(slide => ({
      ...slide,
      backgroundColor: slideSettings.backgroundColor,
      titleColor: slideSettings.titleColor,
      textColor: slideSettings.textColor
    })))
  }

  const handleDownload = async () => {
    const pptx = new pptxgen()
    pptx.layout = 'LAYOUT_WIDE'
    pptx.defineLayout({ name: 'CUSTOM', width: SLIDE_WIDTH, height: SLIDE_HEIGHT })
    pptx.layout = 'CUSTOM'

    slides.forEach((slide, index) => {
      const pptSlide = pptx.addSlide()
      
      // Set background color
      pptSlide.background = { color: hexToRgb(slide.backgroundColor) }
      
      // Title slide
      if (slide.type === 'title') {
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 2,
          w: 9,
          h: 2,
          fontSize: slideSettings.titleSize,
          fontFace: slideSettings.fontFamily,
          color: hexToRgb(slide.titleColor),
          align: slideSettings.titleAlign,
          bold: true
        })
        if (slide.subtitle) {
          pptSlide.addText(slide.subtitle, {
            x: 0.5,
            y: 4.5,
            w: 9,
            h: 1,
            fontSize: slideSettings.bodySize,
            fontFace: slideSettings.fontFamily,
            color: hexToRgb(slide.textColor),
            align: slideSettings.titleAlign
          })
        }
      } else {
        // Content slide
        pptSlide.addText(slide.title, {
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 1,
          fontSize: slideSettings.titleSize,
          fontFace: slideSettings.fontFamily,
          color: hexToRgb(slide.titleColor),
          align: slideSettings.titleAlign,
          bold: true
        })
        if (slide.subtitle) {
          pptSlide.addText(slide.subtitle, {
            x: 0.5,
            y: 1.6,
            w: 9,
            h: 0.6,
            fontSize: slideSettings.bodySize - 4,
            fontFace: slideSettings.fontFamily,
            color: hexToRgb(slide.textColor),
            align: slideSettings.titleAlign,
            italic: true
          })
        }
        pptSlide.addText(slide.content, {
          x: 0.5,
          y: 2.5,
          w: 9,
          h: 4.5,
          fontSize: slideSettings.bodySize,
          fontFace: slideSettings.fontFamily,
          color: hexToRgb(slide.textColor),
          align: slideSettings.bodyAlign,
          valign: 'top',
          bullet: slide.content.includes('•')
        })
      }
    })

    const fileName = `presentation-${Date.now()}.pptx`
    await pptx.writeFile({ fileName })
  }

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 }
  }

  const selectedSlide = slides[selectedSlideIndex]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5]">
        <div className="text-[#666666] text-base">Loading presentation editor...</div>
      </div>
    )
  }

  if (!storyboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f5f5]">
        <h2 className="text-2xl font-bold text-[#000000] mb-2">No Storyboard Found</h2>
        <button
          onClick={() => navigate(`/storyboard/${id}`)}
          className="px-6 py-3 bg-[#000000] text-white rounded-lg hover:opacity-90 transition-opacity font-medium mt-4"
        >
          Go to Storyboard
        </button>
      </div>
    )
  }

  if (isPreviewMode) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8">
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <span className="text-white text-sm">
            {previewIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => setIsPreviewMode(false)}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div 
          className="bg-white rounded-lg shadow-2xl max-w-full max-h-[85vh]"
          style={{ 
            width: 'min(800px, 90vw)', 
            aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}`
          }}
        >
          <div 
            className="w-full h-full p-12 flex flex-col"
            style={{ backgroundColor: slides[previewIndex]?.backgroundColor || '#FFFFFF' }}
          >
            {slides[previewIndex]?.type === 'title' ? (
              <>
                <h1 
                  className="text-5xl font-bold mb-4"
                  style={{ 
                    color: slides[previewIndex].titleColor,
                    fontFamily: slideSettings.fontFamily,
                    textAlign: slideSettings.titleAlign
                  }}
                >
                  {slides[previewIndex].title}
                </h1>
                {slides[previewIndex].subtitle && (
                  <p 
                    className="text-2xl mt-4"
                    style={{ 
                      color: slides[previewIndex].textColor,
                      fontFamily: slideSettings.fontFamily,
                      textAlign: slideSettings.titleAlign
                    }}
                  >
                    {slides[previewIndex].subtitle}
                  </p>
                )}
              </>
            ) : (
              <>
                <h2 
                  className="text-4xl font-bold mb-6"
                  style={{ 
                    color: slides[previewIndex].titleColor,
                    fontFamily: slideSettings.fontFamily,
                    textAlign: slideSettings.titleAlign
                  }}
                >
                  {slides[previewIndex].title}
                </h2>
                {slides[previewIndex].subtitle && (
                  <p 
                    className="text-xl mb-6 italic"
                    style={{ 
                      color: slides[previewIndex].textColor,
                      fontFamily: slideSettings.fontFamily,
                      textAlign: slideSettings.titleAlign
                    }}
                  >
                    {slides[previewIndex].subtitle}
                  </p>
                )}
                <div 
                  className="flex-1 text-lg whitespace-pre-line"
                  style={{ 
                    color: slides[previewIndex].textColor,
                    fontFamily: slideSettings.fontFamily,
                    textAlign: slideSettings.bodyAlign
                  }}
                >
                  {slides[previewIndex].content}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
            disabled={previewIndex === 0}
            className="px-6 py-3 bg-white text-[#000000] rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={() => setPreviewIndex(Math.min(slides.length - 1, previewIndex + 1))}
            disabled={previewIndex === slides.length - 1}
            className="px-6 py-3 bg-white text-[#000000] rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Header */}
      <div className="bg-[#000000] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/storyboard/${id}`)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">PPT Slide Editor</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPreviewMode(true)
              setPreviewIndex(0)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#000000] rounded-lg hover:bg-white/90 transition-all duration-200 font-medium text-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#000000] rounded-lg hover:bg-white/90 transition-all duration-200 font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Download PPT
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Editing Panel */}
        <div className="w-80 bg-white border-r border-[#e0e0e0] overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Slide List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#333333]">Slides ({slides.length})</h3>
                <button
                  onClick={addSlide}
                  className="p-1.5 hover:bg-[#f0f0f0] rounded transition-colors"
                  title="Add Slide"
                >
                  <Plus className="w-4 h-4 text-[#333333]" />
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSlideIndex === index
                        ? 'border-[#000000] bg-[#f5f5f5]'
                        : 'border-[#e0e0e0] hover:border-[#cccccc]'
                    }`}
                    onClick={() => setSelectedSlideIndex(index)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[#666666] mb-1">
                          Slide {index + 1}
                        </div>
                        <div className="text-sm font-semibold text-[#333333] truncate">
                          {slide.title || 'Untitled'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveSlide(index, 'up')
                            }}
                            className="p-1 hover:bg-[#e0e0e0] rounded"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3 text-[#666666]" />
                          </button>
                        )}
                        {index < slides.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              moveSlide(index, 'down')
                            }}
                            className="p-1 hover:bg-[#e0e0e0] rounded"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3 text-[#666666]" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateSlide(index)
                        }}
                        className="p-1 hover:bg-[#e0e0e0] rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3 text-[#666666]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSlide(index)
                        }}
                        disabled={slides.length <= 1}
                        className="p-1 hover:bg-[#e0e0e0] rounded disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 text-[#666666]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Content Editor */}
            {selectedSlide && (
              <div className="space-y-4 border-t border-[#e0e0e0] pt-4">
                <h3 className="font-semibold text-[#333333]">Slide Content</h3>
                
                <div>
                  <label className="block text-sm font-medium text-[#666666] mb-1">Title</label>
                  <input
                    type="text"
                    value={selectedSlide.title}
                    onChange={(e) => updateSlide(selectedSlideIndex, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#666666] mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={selectedSlide.subtitle}
                    onChange={(e) => updateSlide(selectedSlideIndex, { subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#666666] mb-1">Content</label>
                  <textarea
                    value={selectedSlide.content}
                    onChange={(e) => updateSlide(selectedSlideIndex, { content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm resize-none"
                  />
                </div>
              </div>
            )}

            {/* Design Settings */}
            <div className="space-y-4 border-t border-[#e0e0e0] pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#333333] flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Design
                </h3>
                <button
                  onClick={applySettingsToAll}
                  className="text-xs text-[#666666] hover:text-[#000000] transition-colors"
                >
                  Apply to All
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedSlide?.backgroundColor || slideSettings.backgroundColor}
                    onChange={(e) => {
                      const color = e.target.value
                      setSlideSettings({ ...slideSettings, backgroundColor: color })
                      if (selectedSlide) {
                        updateSlide(selectedSlideIndex, { backgroundColor: color })
                      }
                    }}
                    className="w-12 h-10 border border-[#e0e0e0] rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedSlide?.backgroundColor || slideSettings.backgroundColor}
                    onChange={(e) => {
                      const color = e.target.value
                      setSlideSettings({ ...slideSettings, backgroundColor: color })
                      if (selectedSlide) {
                        updateSlide(selectedSlideIndex, { backgroundColor: color })
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Title Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedSlide?.titleColor || slideSettings.titleColor}
                    onChange={(e) => {
                      const color = e.target.value
                      setSlideSettings({ ...slideSettings, titleColor: color })
                      if (selectedSlide) {
                        updateSlide(selectedSlideIndex, { titleColor: color })
                      }
                    }}
                    className="w-12 h-10 border border-[#e0e0e0] rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedSlide?.titleColor || slideSettings.titleColor}
                    onChange={(e) => {
                      const color = e.target.value
                      setSlideSettings({ ...slideSettings, titleColor: color })
                      if (selectedSlide) {
                        updateSlide(selectedSlideIndex, { titleColor: color })
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedSlide?.textColor || slideSettings.textColor}
                    onChange={(e) => {
                      const color = e.target.value
                      setSlideSettings({ ...slideSettings, textColor: color })
                      if (selectedSlide) {
                        updateSlide(selectedSlideIndex, { textColor: color })
                      }
                    }}
                    className="w-12 h-10 border border-[#e0e0e0] rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedSlide?.textColor || slideSettings.textColor}
                    onChange={(e) => {
                      const color = e.target.value
                      setSlideSettings({ ...slideSettings, textColor: color })
                      if (selectedSlide) {
                        updateSlide(selectedSlideIndex, { textColor: color })
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Typography Settings */}
            <div className="space-y-4 border-t border-[#e0e0e0] pt-4">
              <h3 className="font-semibold text-[#333333] flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </h3>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Font Family</label>
                <select
                  value={slideSettings.fontFamily}
                  onChange={(e) => setSlideSettings({ ...slideSettings, fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e0e0e0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000000] text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Calibri">Calibri</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Helvetica">Helvetica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Title Size: {slideSettings.titleSize}px</label>
                <input
                  type="range"
                  min={24}
                  max={72}
                  value={slideSettings.titleSize}
                  onChange={(e) => setSlideSettings({ ...slideSettings, titleSize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Body Size: {slideSettings.bodySize}px</label>
                <input
                  type="range"
                  min={12}
                  max={36}
                  value={slideSettings.bodySize}
                  onChange={(e) => setSlideSettings({ ...slideSettings, bodySize: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Title Alignment</label>
                <div className="flex items-center gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => setSlideSettings({ ...slideSettings, titleAlign: align })}
                      className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                        slideSettings.titleAlign === align
                          ? 'border-[#000000] bg-[#000000] text-white'
                          : 'border-[#e0e0e0] text-[#333333] hover:border-[#cccccc]'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#666666] mb-1">Body Alignment</label>
                <div className="flex items-center gap-2">
                  {['left', 'center', 'right'].map(align => (
                    <button
                      key={align}
                      onClick={() => setSlideSettings({ ...slideSettings, bodyAlign: align })}
                      className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                        slideSettings.bodyAlign === align
                          ? 'border-[#000000] bg-[#000000] text-white'
                          : 'border-[#e0e0e0] text-[#333333] hover:border-[#cccccc]'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Slide Preview */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-[#e5e5e5] relative">
          <div className="flex items-center gap-4 w-full max-w-7xl">
            <button
              onClick={() => setSelectedSlideIndex(Math.max(0, selectedSlideIndex - 1))}
              disabled={selectedSlideIndex === 0}
              className="p-3 bg-white rounded-lg shadow-md hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6 text-[#333333]" />
            </button>

            <div className="flex-1 flex justify-center">
              {selectedSlide && (
                <div 
                  className="bg-white rounded-lg shadow-2xl overflow-hidden"
                  style={{ 
                    width: `${SLIDE_WIDTH * 96}px`, 
                    height: `${SLIDE_HEIGHT * 96}px`,
                    aspectRatio: `${SLIDE_WIDTH}/${SLIDE_HEIGHT}`,
                    backgroundColor: selectedSlide.backgroundColor
                  }}
                >
                  <div className="w-full h-full p-12 flex flex-col">
                    {selectedSlide.type === 'title' ? (
                      <>
                        <h1 
                          className="text-5xl font-bold mb-4"
                          style={{ 
                            color: selectedSlide.titleColor,
                            fontFamily: slideSettings.fontFamily,
                            textAlign: slideSettings.titleAlign,
                            fontSize: `${slideSettings.titleSize * 1.5}px`
                          }}
                        >
                          {selectedSlide.title}
                        </h1>
                        {selectedSlide.subtitle && (
                          <p 
                            className="text-2xl mt-4"
                            style={{ 
                              color: selectedSlide.textColor,
                              fontFamily: slideSettings.fontFamily,
                              textAlign: slideSettings.titleAlign,
                              fontSize: `${slideSettings.bodySize * 1.2}px`
                            }}
                          >
                            {selectedSlide.subtitle}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <h2 
                          className="text-4xl font-bold mb-6"
                          style={{ 
                            color: selectedSlide.titleColor,
                            fontFamily: slideSettings.fontFamily,
                            textAlign: slideSettings.titleAlign,
                            fontSize: `${slideSettings.titleSize * 1.2}px`
                          }}
                        >
                          {selectedSlide.title}
                        </h2>
                        {selectedSlide.subtitle && (
                          <p 
                            className="text-xl mb-6 italic"
                            style={{ 
                              color: selectedSlide.textColor,
                              fontFamily: slideSettings.fontFamily,
                              textAlign: slideSettings.titleAlign,
                              fontSize: `${slideSettings.bodySize}px`
                            }}
                          >
                            {selectedSlide.subtitle}
                          </p>
                        )}
                        <div 
                          className="flex-1 text-lg whitespace-pre-line overflow-y-auto"
                          style={{ 
                            color: selectedSlide.textColor,
                            fontFamily: slideSettings.fontFamily,
                            textAlign: slideSettings.bodyAlign,
                            fontSize: `${slideSettings.bodySize}px`
                          }}
                        >
                          {selectedSlide.content}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedSlideIndex(Math.min(slides.length - 1, selectedSlideIndex + 1))}
              disabled={selectedSlideIndex === slides.length - 1}
              className="p-3 bg-white rounded-lg shadow-md hover:bg-[#f5f5f5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6 text-[#333333]" />
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-[#666666] bg-white/90 px-4 py-2 rounded-lg shadow-sm">
            Slide {selectedSlideIndex + 1} of {slides.length}
          </div>
        </div>
      </div>
    </div>
  )
}
