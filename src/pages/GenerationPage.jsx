import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { FileDown, Share2, Download, FileText, Presentation, FileCheck, ExternalLink, ArrowRight } from 'lucide-react'

export default function GenerationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResearch } = useResearch()
  const [research, setResearch] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const researchData = getResearch(id)
    setResearch(researchData)
    setLoading(false)
  }, [id, getResearch])

  const handleDownloadPPTX = () => {
    // Navigate to report view and trigger PPT download
    navigate(`/report/${id}`)
    // The download will be triggered from ReportView
  }

  const handleShare = () => {
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: research?.query || 'Research Presentation',
        text: 'Check out this research presentation',
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-card flex items-center justify-center py-16">
      <div className="max-w-2xl w-full text-center px-8">
        {/* Icon with Glow Effect */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
          <div className="relative w-24 h-24 bg-primary rounded-full flex items-center justify-center">
            <Presentation className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-4">
          Your Presentation is Ready
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed">
          Your research has been transformed into a compelling presentation deck. Download it now or share with your team.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <button
            onClick={handleDownloadPPTX}
            className="px-6 py-4 bg-foreground text-white rounded-lg hover:opacity-90 transition-opacity shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            <Download className="w-5 h-5" />
            Download .PPTX
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-4 border-2 border-border text-foreground rounded-lg hover:bg-secondary transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            <Share2 className="w-5 h-5" />
            Share Secure Link
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-12"></div>

        {/* Export Options */}
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            PDF Document
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <Presentation className="w-4 h-4" />
            Google Slides
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Speaker Notes
          </button>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Appendix Docs
          </button>
        </div>
      </div>
    </div>
  )
}
