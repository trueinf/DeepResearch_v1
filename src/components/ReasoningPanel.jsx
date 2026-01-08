import { useResearchStream } from '../hooks/useResearchStream'
import { Loader2 } from 'lucide-react'

export function ReasoningStream({ prompt, model }) {
  const { output, isStreaming, error } = useResearchStream(prompt, model)

  if (!prompt || !model) {
    return null
  }

  return (
    <div className="bg-gray-900 text-green-300 font-mono text-xs p-4 h-64 overflow-y-auto rounded-lg shadow-inner">
      <div className="flex items-center gap-2 text-green-400 mb-2">
        {isStreaming && <Loader2 className="w-3 h-3 animate-spin" />}
        <span>{isStreaming ? '🤖 Thinking...' : 'Reasoning Complete'}</span>
      </div>
      
      {error && (
        <div className="text-red-400 mb-2">Error: {error}</div>
      )}
      
      <pre className="whitespace-pre-wrap text-green-300 leading-relaxed">
        {output.length === 0 ? '🤖 Thinking...' : output}
      </pre>
    </div>
  )
}

// Keep the old component name for backward compatibility
export function ReasoningPanel({ researchId, prompt, model }) {
  return <ReasoningStream prompt={prompt} model={model} />
}

