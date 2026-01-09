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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[#000000] via-[#1a1a1a] to-[#000000] flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)]"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Clarify Your Research</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200 relative z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 sm:px-8 py-6">
          <div className="space-y-6">
            {/* Introduction */}
            <div className="pb-4">
              <h3 className="text-base font-semibold text-gray-800 mb-1.5">
                {questions && questions.length > 0 
                  ? 'Please answer these questions to refine your research:'
                  : 'Refine your research objective:'}
              </h3>
              <p className="text-sm text-gray-500">
                Your answers will help us provide more targeted and relevant results
              </p>
            </div>

            {/* Questions */}
            <div className="space-y-5">
              {questions && questions.length > 0 ? (
                questions.map((question, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 leading-relaxed">
                      {question}
                    </label>
                    <input
                      type="text"
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswer(index, e.target.value)}
                      placeholder="Your answer..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"
                    />
                  </div>
                ))
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 leading-relaxed">
                      What specific aspect would you like to focus on?
                    </label>
                    <input
                      type="text"
                      value={answers[0] || ''}
                      onChange={(e) => handleAnswer(0, e.target.value)}
                      placeholder="e.g., Market trends, Technology analysis, Competitive landscape..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 leading-relaxed">
                      What time period or timeframe should this cover?
                    </label>
                    <input
                      type="text"
                      value={answers[1] || ''}
                      onChange={(e) => handleAnswer(1, e.target.value)}
                      placeholder="e.g., Past 5 years, Recent trends, Future projections..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 leading-relaxed">
                      Any specific regions, companies, or industries to include?
                    </label>
                    <input
                      type="text"
                      value={answers[2] || ''}
                      onChange={(e) => handleAnswer(2, e.target.value)}
                      placeholder="e.g., North America, Tech companies, Automotive sector..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 leading-relaxed">
                      What level of detail or depth is required for this research?
                    </label>
                    <input
                      type="text"
                      value={answers[3] || ''}
                      onChange={(e) => handleAnswer(3, e.target.value)}
                      placeholder="e.g., High-level overview, Detailed analysis, Technical deep-dive..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 leading-relaxed">
                      Are there any specific comparisons or benchmarks you want included?
                    </label>
                    <input
                      type="text"
                      value={answers[4] || ''}
                      onChange={(e) => handleAnswer(4, e.target.value)}
                      placeholder="e.g., Compare with competitors, Industry benchmarks, Historical data..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Queries Section */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Research Queries <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Enter any other questions or topics you'd like to explore in this research
              </p>
              <textarea
                value={additionalQueries}
                onChange={(e) => setAdditionalQueries(e.target.value)}
                placeholder="e.g., What are the latest trends? How does this compare to other solutions? What are the potential risks?"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 transition-all duration-200 resize-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onSkip}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all duration-200 font-medium text-sm"
          >
            Skip Questions
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black/40 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 font-medium text-sm shadow-sm"
          >
            <Check className="w-4 h-4" />
            Continue Research
          </button>
        </div>
      </div>
    </div>
  )
}

