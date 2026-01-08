import { CheckCircle, Circle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useSidebar } from '../context/SidebarContext'

export default function ProgressIndicator() {
  const location = useLocation()
  const { isCollapsed } = useSidebar()

  const getCurrentStage = () => {
    if (location.pathname.startsWith('/report/')) return 'research'
    if (location.pathname.startsWith('/storyboard')) return 'storyboard'
    if (location.pathname.startsWith('/generation')) return 'generation'
    if (location.pathname === '/') return 'research'
    return null
  }

  const stages = [
    { id: 'research', label: 'Deep Dive', path: '/' },
    { id: 'storyboard', label: 'Narrative', path: '/storyboard' },
    { id: 'generation', label: 'Deck Output', path: '/generation' },
  ]

  const currentStage = getCurrentStage()
  const currentIndex = stages.findIndex(s => s.id === currentStage)

  return (
    <div className={`w-full bg-white border-b border-[#dddddd] py-4 px-6 fixed top-16 right-0 z-30 transition-all duration-300 ${isCollapsed ? 'left-16' : 'left-64'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between relative gap-16">
          {/* Progress Lines */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#dddddd] -z-10">
            <div
              className="h-full bg-[#000000] transition-all duration-500"
              style={{
                width: currentIndex >= 0 ? `${(currentIndex / (stages.length - 1)) * 100}%` : '0%'
              }}
            />
          </div>

          {/* Stage Indicators */}
          {stages.map((stage, index) => {
            const isActive = stage.id === currentStage
            const isCompleted = currentIndex > index
            const isPending = currentIndex < index

            return (
              <div key={stage.id} className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#000000] border-[#000000] text-white'
                      : isActive
                      ? 'bg-[#000000] border-[#000000] text-white'
                      : 'bg-white border-[#dddddd] text-[#aaaaaa]'
                  }`}
                >
                  {isCompleted || isActive ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                    isActive || isCompleted
                      ? 'text-[#333333]'
                      : 'text-[#aaaaaa]'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
