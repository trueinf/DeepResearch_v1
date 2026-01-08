import { useState } from 'react'
import { X, Check, Search } from 'lucide-react'

export default function ClarifyQuestions({ questions, summary, onConfirm, onSkip }) {
  const [answers, setAnswers] = useState({})
  const [showSkip, setShowSkip] = useState(false)
  const [additionalQueries, setAdditionalQueries] = useState('')

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }))
  }

  const handleConfirm = () => {
    // Handle both cases: questions from API or default questions
    const questionsToUse = questions && questions.length > 0 
      ? questions 
      : [
          'What specific aspect would you like to focus on?',
          'What time period or timeframe should this cover?',
          'Any specific regions, companies, or industries to include?',
          'What level of detail or depth is required for this research?',
          'Are there any specific comparisons or benchmarks you want included?'
        ]
    
    const refinedAnswers = questionsToUse.map((q, idx) => ({
      question: q,
      answer: answers[idx] || 'No specific preference provided'
    }))
    onConfirm(refinedAnswers, summary, additionalQueries.trim())
  }

  const handleClose = () => {
    if (window.confirm('Are you sure you want to close? Your answers will not be saved.')) {
      onSkip()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-8 bg-gradient-to-r from-[#000000] via-[#1a1a1a] to-[#000000] rounded-t-lg flex items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl">
              <Search className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Clarify Your Research</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl p-2.5 transition-all duration-200 relative z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#333333] mb-6">
              {questions && questions.length > 0 
                ? 'Please answer these questions to refine your research:'
                : 'Refine your research objective:'}
            </h3>
            <div className="space-y-5">
              {questions && questions.length > 0 ? (
                questions.map((question, index) => (
                  <div key={index} className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#555555] uppercase tracking-wide">
                      {question}
                    </label>
                    <input
                      type="text"
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswer(index, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full h-10 px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal text-base"
                    />
                  </div>
                ))
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#555555] uppercase tracking-wide">
                      What specific aspect would you like to focus on?
                    </label>
                    <input
                      type="text"
                      value={answers[0] || ''}
                      onChange={(e) => handleAnswer(0, e.target.value)}
                      placeholder="e.g., Market trends, Technology analysis, Competitive landscape..."
                      className="w-full h-10 px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#555555] uppercase tracking-wide">
                      What time period or timeframe should this cover?
                    </label>
                    <input
                      type="text"
                      value={answers[1] || ''}
                      onChange={(e) => handleAnswer(1, e.target.value)}
                      placeholder="e.g., Past 5 years, Recent trends, Future projections..."
                      className="w-full h-10 px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#555555] uppercase tracking-wide">
                      Any specific regions, companies, or industries to include?
                    </label>
                    <input
                      type="text"
                      value={answers[2] || ''}
                      onChange={(e) => handleAnswer(2, e.target.value)}
                      placeholder="e.g., North America, Tech companies, Automotive sector..."
                      className="w-full h-10 px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#555555] uppercase tracking-wide">
                      What level of detail or depth is required for this research?
                    </label>
                    <input
                      type="text"
                      value={answers[3] || ''}
                      onChange={(e) => handleAnswer(3, e.target.value)}
                      placeholder="e.g., High-level overview, Detailed analysis, Technical deep-dive..."
                      className="w-full h-10 px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-[#555555] uppercase tracking-wide">
                      Are there any specific comparisons or benchmarks you want included?
                    </label>
                    <input
                      type="text"
                      value={answers[4] || ''}
                      onChange={(e) => handleAnswer(4, e.target.value)}
                      placeholder="e.g., Compare with competitors, Industry benchmarks, Historical data..."
                      className="w-full h-10 px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal text-base"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Queries Section */}
          <div className="mt-6 pt-6 border-t-2 border-[#e0e0e0]">
            <label className="block text-sm font-semibold text-[#555555] mb-2 uppercase tracking-wide">
              Additional Research Queries (Optional)
            </label>
            <p className="text-xs text-[#888888] mb-3 font-normal">
              Enter any other questions or topics you'd like to explore in this research
            </p>
            <textarea
              value={additionalQueries}
              onChange={(e) => setAdditionalQueries(e.target.value)}
              placeholder="e.g., What are the latest trends? How does this compare to other solutions? What are the potential risks?"
              rows={4}
              className="w-full px-3 py-2 border-2 border-[#e0e0e0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 focus:border-[#333333] text-[#333333] placeholder-[#aaaaaa] bg-white hover:border-[#cccccc] transition-all duration-200 font-normal resize-y text-base"
            />
          </div>
        </div>

        <div className="px-8 py-6 border-t-2 border-[#e0e0e0] flex gap-3 justify-end">
          <button
            onClick={onSkip}
            className="px-6 py-3 text-[#666666] border-2 border-[#e0e0e0] rounded-md hover:bg-[#f0f0f0] hover:border-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-0 transition-all duration-200 font-medium"
          >
            Skip Questions
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-3 bg-[#000000] text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#333333] focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 font-semibold"
          >
            <Check className="w-5 h-5" />
            Continue Research
          </button>
        </div>
      </div>
    </div>
  )
}

