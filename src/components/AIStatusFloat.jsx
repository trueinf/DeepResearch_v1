import { Loader2 } from 'lucide-react'

export default function AIStatusFloat({ isActive = true }) {
  if (!isActive) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-[#000000] rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
        <div className="relative">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow"></div>
          <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping opacity-75"></div>
        </div>
        <span className="text-sm font-medium text-white uppercase tracking-wider">AI Synthesizer Active</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="w-1 h-4 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-4 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
