import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DollarSign, TrendingUp, Activity, Zap } from 'lucide-react'

export default function CostDisplay({ researchId }) {
  const [costs, setCosts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!researchId) {
      setLoading(false)
      return
    }

    async function fetchCosts() {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('token_usage')
          .select('*')
          .eq('research_id', researchId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        if (!data || data.length === 0) {
          setCosts({
            totalCost: 0,
            totalTokens: 0,
            breakdown: [],
            callCount: 0
          })
          setLoading(false)
          return
        }

        const totalCost = data.reduce((sum, usage) => sum + parseFloat(usage.total_cost_usd || 0), 0)
        const totalTokens = data.reduce((sum, usage) => sum + (usage.total_tokens || 0), 0)
        const totalInputTokens = data.reduce((sum, usage) => sum + (usage.input_tokens || 0), 0)
        const totalOutputTokens = data.reduce((sum, usage) => sum + (usage.output_tokens || 0), 0)

        // Group by function
        const byFunction = data.reduce((acc, usage) => {
          const funcName = usage.function_name || 'unknown'
          if (!acc[funcName]) {
            acc[funcName] = {
              function_name: funcName,
              cost: 0,
              tokens: 0,
              calls: 0,
              models: new Set()
            }
          }
          acc[funcName].cost += parseFloat(usage.total_cost_usd || 0)
          acc[funcName].tokens += usage.total_tokens || 0
          acc[funcName].calls += 1
          if (usage.model) acc[funcName].models.add(usage.model)
          return acc
        }, {})

        setCosts({
          totalCost,
          totalTokens,
          totalInputTokens,
          totalOutputTokens,
          breakdown: Object.values(byFunction).map(f => ({
            ...f,
            models: Array.from(f.models)
          })),
          callCount: data.length,
          allUsage: data
        })
      } catch (err) {
        console.error('Error fetching costs:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCosts()
  }, [researchId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">Error loading costs: {error}</p>
      </div>
    )
  }

  if (!costs || costs.callCount === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          Cost Summary
        </h3>
        <p className="text-sm text-gray-500">No API calls recorded yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-600" />
        Cost Summary
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-700 font-medium">Total Cost</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            ${costs.totalCost.toFixed(4)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {costs.callCount} API call{costs.callCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700 font-medium">Total Tokens</p>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {costs.totalTokens.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {costs.totalInputTokens.toLocaleString()} in / {costs.totalOutputTokens.toLocaleString()} out
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-purple-700 font-medium">Avg Cost/Call</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            ${(costs.totalCost / costs.callCount).toFixed(4)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            per API call
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-orange-700 font-medium">Cost/1K Tokens</p>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            ${costs.totalTokens > 0 ? ((costs.totalCost / costs.totalTokens) * 1000).toFixed(4) : '0.0000'}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            efficiency metric
          </p>
        </div>
      </div>

      {/* Breakdown by Function */}
      {costs.breakdown.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3 text-gray-700">Breakdown by Function</h4>
          <div className="space-y-2">
            {costs.breakdown
              .sort((a, b) => b.cost - a.cost)
              .map((usage, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {usage.function_name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({usage.calls} call{usage.calls !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-600">
                        {usage.tokens.toLocaleString()} tokens
                      </span>
                      {usage.models.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {usage.models.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${usage.cost.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {((usage.cost / costs.totalCost) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cost Estimate Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Costs are calculated based on current API pricing. 
          Small queries (~1K tokens) cost ~$0.0002, large reports (~10K tokens) cost ~$0.04.
        </p>
      </div>
    </div>
  )
}

