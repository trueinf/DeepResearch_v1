import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useResearch } from '../context/ResearchContext'
import { ArrowLeft, Network, Loader2, Filter, ZoomIn, ZoomOut, Download, RefreshCw, Layers, Search, X } from 'lucide-react'
import { Network as VisNetwork } from 'vis-network/standalone'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function ResearchMap() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getResearch, getResearchReport } = useResearch()
  
  const research = getResearch(id)
  const [report, setReport] = useState(null)
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedCluster, setSelectedCluster] = useState(null)
  const [filterType, setFilterType] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedNodes, setHighlightedNodes] = useState(new Set())
  const [zoom, setZoom] = useState(1)
  const [clusters, setClusters] = useState([])
  const [viewMode, setViewMode] = useState('force') // 'force' or 'causal'
  const [loadingClusters, setLoadingClusters] = useState(false)
  const [trends, setTrends] = useState([])
  const [trendColors, setTrendColors] = useState(new Map())
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [showTrendView, setShowTrendView] = useState(false)
  
  const graphRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      if (!research) return
      
      const reportData = await getResearchReport(id)
      setReport(reportData)
      
      await loadGraph()
    }
    
    loadData()
  }, [id, research, getResearchReport])

  const loadGraph = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Try to get existing graph from Neo4j
      const getResponse = await fetch(`${SUPABASE_URL}/functions/v1/get-research-graph`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ researchId: id })
      })

      if (getResponse.ok) {
        const getData = await getResponse.json()
        if (getData.graph && getData.graph.nodes.length > 0) {
          setGraphData(getData.graph)
        if (getData.graph.clusters) {
          setClusters(getData.graph.clusters)
        } else {
          await loadClusters()
        }
        await loadTrends()
        setLoading(false)
        return
        }
      }

      // If no graph exists, build it
      if (report) {
        await buildGraph()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading graph:', error)
      setError(error?.message || 'Failed to load graph')
      setLoading(false)
    }
  }

  const buildGraph = async () => {
    if (!report) return

    try {
      setBuilding(true)
      setError('')

      const response = await fetch(`${SUPABASE_URL}/functions/v1/build-research-graph`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          report: {
            topic: report.topic,
            executiveSummary: report.executiveSummary,
            detailedAnalysis: report.detailedAnalysis,
            keyFindings: report.keyFindings,
            insights: report.insights,
            conclusion: report.conclusion,
            sources: report.sources
          },
          researchId: id
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.graph) {
        console.log('Graph built successfully:', {
          nodes: data.graph.nodes?.length || 0,
          relationships: data.graph.relationships?.length || 0,
          clusters: data.graph.clusters?.length || 0
        })
        setGraphData(data.graph)
        // Load clusters after graph is built
        if (data.graph.clusters) {
          setClusters(data.graph.clusters)
        } else {
          await loadClusters()
        }
        
        // Extract and analyze trends
        await extractTrendSignals()
        await loadTrends()
      } else {
        throw new Error('Failed to build graph')
      }
    } catch (error) {
      console.error('Error building graph:', error)
      setError(error?.message || 'Failed to build graph')
    } finally {
      setBuilding(false)
      setLoading(false)
    }
  }

  const loadClusters = async () => {
    if (!id) return
    
    try {
      setLoadingClusters(true)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/detect-communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ researchId: id })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.clusters) {
          setClusters(data.clusters)
          // Update graphData with clusters
          if (graphData) {
            setGraphData({
              ...graphData,
              clusters: data.clusters
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading clusters:', error)
    } finally {
      setLoadingClusters(false)
    }
  }

  const extractTrendSignals = async () => {
    if (!id || !report) return
    
    try {
      // Combine all report text for trend extraction
      const researchContent = [
        report.executiveSummary || '',
        report.detailedAnalysis || '',
        report.insights || '',
        report.conclusion || '',
        ...(Array.isArray(report.keyFindings) 
          ? report.keyFindings.map((f) => f.text || f).join(' ')
          : [])
      ].filter(Boolean).join('\n\n')

      if (!researchContent.trim()) return

      const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-trend-signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          text: researchContent,
          sources: report.sources || [],
          researchId: id,
          createNodes: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Trend signals extracted:', data.stats)
      }
    } catch (error) {
      console.error('Error extracting trend signals:', error)
      // Don't throw - trend extraction is optional
    }
  }

  const loadTrends = async () => {
    if (!id) return
    
    try {
      setLoadingTrends(true)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ researchId: id, timeWindow: 30 })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.trends) {
          setTrends(data.trends)
          
          // Map trend colors
          const colorMap = new Map()
          data.trends.forEach((trend) => {
            const color = getTrendColor(trend.trendState)
            colorMap.set(trend.topic, color)
          })
          setTrendColors(colorMap)
        }
      }
    } catch (error) {
      console.error('Error loading trends:', error)
    } finally {
      setLoadingTrends(false)
    }
  }

  // Graph Canvas Component using vis-network with stylish design
  const GraphCanvas = ({ nodes, edges, onNodeClick }) => {
    const graphContainer = useRef(null)
    const networkRef = useRef(null)

    useEffect(() => {
      if (!graphContainer.current || !nodes || nodes.length === 0) return

      try {
        const visNodes = nodes.map(node => {
          const baseColor = node.fill || getNodeColor(node.data?.type)
          return {
            id: node.id,
            label: node.text || node.id,
            color: {
              background: baseColor,
              border: '#ffffff',
              highlight: { 
                background: '#F2C94C', 
                border: '#F2C94C',
                size: node.width * 1.3 || 40
              },
              hover: {
                background: baseColor,
                border: '#F2C94C',
                size: node.width * 1.2 || 36
              }
            },
            size: node.width || 35,
            font: {
              size: 13,
              face: 'Inter, system-ui, sans-serif',
              color: '#1a1a1a',
              strokeWidth: 2,
              strokeColor: '#ffffff',
              bold: true
            },
            shape: 'dot',
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.2)',
              size: 5,
              x: 2,
              y: 2
            },
            borderWidth: 3,
            borderWidthSelected: 4,
            title: `${node.data?.type || 'Node'}\n${node.data?.description || ''}\nConfidence: ${(node.data?.confidence * 100 || 80).toFixed(0)}%`
          }
        })

        const visEdges = edges.map(edge => {
          const edgeColor = edge.stroke || getEdgeColor(edge.data?.type)
          return {
            id: edge.id,
            from: edge.from,
            to: edge.to,
            label: edge.label || edge.data?.type || '',
            color: {
              color: edgeColor,
              highlight: '#F2C94C',
              hover: edgeColor,
              opacity: 0.7
            },
            width: edge.strokeWidth || 3,
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 1.2,
                type: 'arrow'
              }
            },
            smooth: {
              type: 'continuous',
              roundness: 0.5
            },
            font: {
              size: 11,
              face: 'Inter, system-ui, sans-serif',
              color: '#666',
              align: 'middle',
              strokeWidth: 2,
              strokeColor: '#ffffff'
            },
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.1)',
              size: 3,
              x: 1,
              y: 1
            },
            dashes: edge.data?.type === 'CONTRADICTS' ? [5, 5] : false
          }
        })

        const data = { nodes: visNodes, edges: visEdges }
        const options = {
          nodes: {
            shape: 'dot',
            size: 30,
            font: {
              size: 13,
              face: 'Inter, system-ui, sans-serif',
              color: '#1a1a1a',
              strokeWidth: 2,
              strokeColor: '#ffffff',
              bold: true
            },
            borderWidth: 3,
            borderWidthSelected: 4,
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.2)',
              size: 5,
              x: 2,
              y: 2
            },
            chosen: {
              node: (values) => {
                values.size = values.size * 1.2
                values.borderWidth = 5
              }
            }
          },
          edges: {
            width: 3,
            smooth: {
              type: 'continuous',
              roundness: 0.5
            },
            font: {
              size: 11,
              face: 'Inter, system-ui, sans-serif',
              color: '#666',
              align: 'middle',
              strokeWidth: 2,
              strokeColor: '#ffffff'
            },
            arrows: {
              to: {
                enabled: true,
                scaleFactor: 1.2,
                type: 'arrow'
              }
            },
            shadow: {
              enabled: true,
              color: 'rgba(0,0,0,0.1)',
              size: 3,
              x: 1,
              y: 1
            },
            chosen: {
              edge: (values) => {
                values.width = values.width * 1.5
                values.color = '#F2C94C'
              }
            }
          },
          physics: {
            enabled: true,
            stabilization: {
              enabled: true,
              iterations: 200,
              fit: true
            },
            barnesHut: {
              gravitationalConstant: -2000,
              centralGravity: 0.3,
              springLength: 150,
              springConstant: 0.04,
              damping: 0.09,
              avoidOverlap: 0.5
            }
          },
          interaction: {
            hover: true,
            tooltipDelay: 150,
            zoomView: true,
            dragView: true,
            selectConnectedEdges: true,
            navigationButtons: true,
            keyboard: {
              enabled: true,
              speed: { x: 10, y: 10, zoom: 0.02 },
              bindToWindow: true
            }
          },
          layout: {
            improvedLayout: true,
            hierarchical: {
              enabled: false
            }
          }
        }

        networkRef.current = new VisNetwork(graphContainer.current, data, options)

        networkRef.current.on('click', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0]
            const node = nodes.find(n => n.id === nodeId)
            if (node && onNodeClick) {
              onNodeClick(node)
            }
          }
        })

        return () => {
          if (networkRef.current) {
            networkRef.current.destroy()
          }
        }
      } catch (error) {
        console.error('Error rendering graph with vis-network:', error)
      }
    }, [nodes, edges, onNodeClick])

    return (
      <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
        <div ref={graphContainer} className="w-full h-full" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }} />
      </div>
    )
  }

  // Convert graph data to Reagraph format
  const getReagraphData = () => {
    if (!graphData) return { nodes: [], edges: [] }

    // Filter nodes by type if filter is active
    let filteredNodes = graphData.nodes
    if (filterType) {
      filteredNodes = graphData.nodes.filter(n => n.type === filterType)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredNodes = filteredNodes.filter(n => 
        n.label.toLowerCase().includes(query) ||
        n.type.toLowerCase().includes(query) ||
        n.properties?.description?.toLowerCase().includes(query)
      )
    }

    // Get node IDs for filtering edges
    const nodeIds = new Set(filteredNodes.map(n => n.id))

    // Filter edges to only include filtered nodes
    const filteredEdges = graphData.relationships.filter(rel => 
      nodeIds.has(rel.source) && nodeIds.has(rel.target)
    )

    // Highlight cluster if selected
    let nodesToHighlight = new Set()
    let clusterColors = new Map()
    
    // Map nodes to their cluster colors
    clusters.forEach((cluster, index) => {
      cluster.nodes.forEach(nodeId => {
        clusterColors.set(nodeId, cluster.color || getClusterColor(index))
      })
      if (selectedCluster === cluster.id) {
        cluster.nodes.forEach(nodeId => nodesToHighlight.add(nodeId))
      }
    })

    // Add search highlights
    if (searchQuery) {
      filteredNodes.forEach(node => {
        if (node.label.toLowerCase().includes(searchQuery.toLowerCase())) {
          nodesToHighlight.add(node.id)
        }
      })
    }

    // Convert to Reagraph format
    const nodes = filteredNodes.map(node => {
      const isHighlighted = nodesToHighlight.has(node.id) || highlightedNodes.has(node.id)
      const isSelected = selectedNode?.id === node.id
      const clusterColor = clusterColors.get(node.id)
      
      // Check for trend color
      const trendColor = trendColors.get(node.label)
      const trendInfo = trends.find((t) => t.topic === node.label)
      
      // Priority: Selected > Trend > Cluster > Type
      let nodeColor = getNodeColor(node.type)
      if (isSelected) {
        nodeColor = '#F2C94C' // Yellow for selected
      } else if (showTrendView && trendColor) {
        nodeColor = trendColor // Trend color when trend view is active
      } else if (clusterColor && !showTrendView) {
        nodeColor = clusterColor // Cluster color when not in trend view
      } else if (isHighlighted && !clusterColor && !trendColor) {
        nodeColor = nodeColor + 'CC' // Add transparency for highlight
      }
      
      return {
        id: node.id,
        text: node.label,
        data: {
          type: node.type,
          description: node.properties?.description || '',
          confidence: node.properties?.confidence || 0.8,
          clusterId: clusters.find(c => c.nodes.includes(node.id))?.id,
          trendState: trendInfo?.trendState,
          trendVelocity: trendInfo?.velocity,
          trendPrediction: trendInfo?.prediction,
          ...node.properties
        },
        width: getNodeSize(node, graphData.centrality),
        height: getNodeSize(node, graphData.centrality),
        fill: nodeColor
      }
    })

    const edges = filteredEdges.map(rel => ({
      id: `${rel.source}-${rel.target}-${rel.type}`,
      from: rel.source,
      to: rel.target,
      label: rel.type.replace(/_/g, ' '),
      data: {
        type: rel.type,
        evidence: rel.properties?.evidence || '',
        confidence: rel.properties?.confidence || 0.8,
        ...rel.properties
      },
      stroke: getEdgeColor(rel.type),
      strokeWidth: (rel.properties?.strength || 0.5) * 2 + 1
    }))

    return { nodes, edges }
  }

  const getNodeColor = (type, isSelected = false, isHighlighted = false) => {
    const colors = {
      'Person': '#4A90E2',
      'Organization': '#50C878',
      'Technology': '#FF6B6B',
      'Concept': '#9B59B6',
      'Event': '#F39C12',
      'Trend': '#F39C12',
      'Risk': '#E74C3C',
      'Problem': '#E74C3C',
      'Benefit': '#2ECC71',
      'Solution': '#2ECC71',
      'Product': '#3498DB',
      'Location': '#95A5A6'
    }
    
    let color = colors[type] || '#7F8C8D'
    
    if (isSelected) {
      return '#F2C94C' // Yellow for selected
    }
    if (isHighlighted) {
      return color + 'CC' // Add transparency for highlight
    }
    
    return color
  }

  const getNodeSize = (node, centrality) => {
    const baseSize = 60
    if (centrality) {
      const central = centrality.find(c => c.nodeId === node.id)
      if (central) {
        return baseSize + (central.score * 20)
      }
    }
    return baseSize
  }

  const getEdgeColor = (type) => {
    const colors = {
      'INFLUENCES': '#3498DB',
      'CAUSES': '#E74C3C', // Red for causal relationships
      'ENABLES': '#2ECC71',
      'CONTRADICTS': '#E67E22',
      'DEPENDS_ON': '#9B59B6',
      'PART_OF': '#9B59B6',
      'SIMILAR_TO': '#1ABC9C',
      'USES': '#16A085',
      'REGULATES': '#F39C12',
      'SUPPORTS': '#2ECC71',
      'RELATES_TO': '#7F8C8D'
    }
    return colors[type] || '#7F8C8D'
  }

  const getClusterColor = (index) => {
    const colors = [
      '#9B59B6', // Purple - Cluster 1
      '#2ECC71', // Green - Cluster 2
      '#F2C94C', // Yellow - Cluster 3
      '#3498DB', // Blue - Cluster 4
      '#E74C3C', // Red - Cluster 5
      '#F39C12', // Orange - Cluster 6
      '#1ABC9C', // Teal - Cluster 7
      '#E67E22', // Dark Orange - Cluster 8
    ]
    return colors[index % colors.length]
  }

  const getTrendColor = (trendState) => {
    const colors = {
      'rising': '#E74C3C',    // 🔥 Red - Rising
      'falling': '#3498DB',   // 📉 Blue - Falling
      'emerging': '#2ECC71',  // 🌱 Green - Emerging
      'stable': '#95A5A6'     // ➖ Gray - Stable
    }
    return colors[trendState] || colors['stable']
  }

  const getTrendIcon = (trendState) => {
    const icons = {
      'rising': '🔥',
      'falling': '📉',
      'emerging': '🌱',
      'stable': '➖'
    }
    return icons[trendState] || '➖'
  }

  const handleNodeClick = (node) => {
    const originalNode = graphData?.nodes.find(n => n.id === node.id)
    setSelectedNode(originalNode || null)
    
    // Highlight connected nodes
    if (originalNode) {
      const connected = new Set()
      graphData?.relationships.forEach(rel => {
        if (rel.source === originalNode.id) {
          connected.add(rel.target)
        }
        if (rel.target === originalNode.id) {
          connected.add(rel.source)
        }
      })
      setHighlightedNodes(connected)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query) {
      const matches = new Set()
      graphData?.nodes.forEach(node => {
        if (node.label.toLowerCase().includes(query.toLowerCase())) {
          matches.add(node.id)
        }
      })
      setHighlightedNodes(matches)
    } else {
      setHighlightedNodes(new Set())
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 2))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev * 0.8, 0.5))
  }

  const handleExport = () => {
    if (!graphData) return

    const exportData = {
      topic: report?.topic,
      nodes: graphData.nodes,
      relationships: graphData.relationships,
      clusters: graphData.clusters,
      centrality: graphData.centrality,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research_map_${id}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const entityTypes = Array.from(new Set(graphData?.nodes.map(n => n.type) || []))
  const reagraphData = getReagraphData()

  // Debug: Log graph data
  useEffect(() => {
    if (graphData) {
      console.log('Graph Data:', {
        nodes: graphData.nodes?.length || 0,
        relationships: graphData.relationships?.length || 0,
        reagraphNodes: reagraphData.nodes.length,
        reagraphEdges: reagraphData.edges.length,
        sampleNode: reagraphData.nodes[0],
        sampleEdge: reagraphData.edges[0]
      })
    }
  }, [graphData, reagraphData])

  if (!research || loading) {
    return (
      <div className="ml-64 pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{loading ? 'Loading intelligence map...' : 'Research not found'}</p>
        </div>
      </div>
    )
  }

  if (error && !graphData) {
    return (
      <div className="ml-64 pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Network className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={buildGraph}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-64 pt-16 min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/report/${id}`)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Network className="w-6 h-6 text-blue-600" />
                Research Intelligence Map
              </h1>
              <p className="text-gray-600 mt-1">{report?.topic}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTrendView(!showTrendView)}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showTrendView
                  ? 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title="Toggle Trend View"
            >
              {showTrendView ? '🔥 Trends ON' : '📊 Trends OFF'}
            </button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select graph view mode"
              title="Select graph view mode"
            >
              <option value="force">Force Layout</option>
              <option value="causal">Causal Flow (Left→Right)</option>
            </select>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Export Graph"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={buildGraph}
              disabled={building}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              title="Rebuild Graph"
            >
              <RefreshCw className={`w-4 h-4 ${building ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        {graphData && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Nodes</div>
              <div className="text-2xl font-bold text-gray-900">{graphData.nodes.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Relationships</div>
              <div className="text-2xl font-bold text-gray-900">{graphData.relationships.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Clusters</div>
              <div className="text-2xl font-bold text-gray-900">{graphData.clusters?.length || 0}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-600">Entity Types</div>
              <div className="text-2xl font-bold text-gray-900">{entityTypes.length}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {/* Graph Visualization */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {building ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Building intelligence map...</p>
                  </div>
                </div>
              ) : graphData && reagraphData.nodes.length > 0 ? (
                <GraphCanvas 
                  nodes={reagraphData.nodes}
                  edges={reagraphData.edges}
                  onNodeClick={handleNodeClick}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No graph data available</p>
                    <button
                      onClick={buildGraph}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Build Intelligence Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Search</h3>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search nodes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearch('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setFilterType(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    filterType === null
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Types
                </button>
                {entityTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      filterType === type
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Clusters</h3>
                </div>
                {loadingClusters && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
              </div>
              {clusters.length > 0 ? (
                <div className="space-y-2">
                  {clusters.map((cluster, index) => (
                    <button
                      key={cluster.id}
                      onClick={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border-l-4 ${
                        selectedCluster === cluster.id
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      style={{ borderLeftColor: cluster.color || getClusterColor(index) }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cluster.color || getClusterColor(index) }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{cluster.theme || cluster.id}</div>
                          <div className="text-xs text-gray-500">{cluster.nodes?.length || cluster.size || 0} nodes</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">
                  {loadingClusters ? 'Detecting communities...' : 'No clusters detected. Click "Rebuild Graph" to generate.'}
                </div>
              )}
            </div>

            {/* Node Details */}
            {selectedNode && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Node Details</h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-gray-600">Label</div>
                    <div className="font-medium text-gray-900">{selectedNode.label}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Type</div>
                    <div className="font-medium text-gray-900">{selectedNode.type}</div>
                  </div>
                  {selectedNode.properties?.description && (
                    <div>
                      <div className="text-gray-600">Description</div>
                      <div className="text-gray-900">{selectedNode.properties.description}</div>
                    </div>
                  )}
                  {selectedNode.properties?.confidence && (
                    <div>
                      <div className="text-gray-600">Confidence</div>
                      <div className="text-gray-900">{(selectedNode.properties.confidence * 100).toFixed(0)}%</div>
                    </div>
                  )}
                  {highlightedNodes.size > 0 && (
                    <div>
                      <div className="text-gray-600">Connected Nodes</div>
                      <div className="text-gray-900">{highlightedNodes.size}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trend Analysis */}
            {showTrendView && trends.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Trend Radar</h3>
                  {loadingTrends && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  )}
                </div>
                <div className="space-y-2">
                  {trends.slice(0, 10).map((trend) => (
                    <div
                      key={trend.topic}
                      className="flex items-center justify-between text-sm p-2 rounded border-l-4"
                      style={{ borderLeftColor: getTrendColor(trend.trendState) }}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{getTrendIcon(trend.trendState)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{trend.topic}</div>
                          <div className="text-xs text-gray-500">
                            {trend.velocity > 0 ? '+' : ''}{trend.velocity.toFixed(1)}% change
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 ml-2">
                        {trend.currentFrequency}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      <span>Rising: {trends.filter((t) => t.trendState === 'rising').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      <span>Falling: {trends.filter((t) => t.trendState === 'falling').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span>Emerging: {trends.filter((t) => t.trendState === 'emerging').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                      <span>Stable: {trends.filter((t) => t.trendState === 'stable').length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Centrality */}
            {graphData?.centrality && graphData.centrality.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Most Influential</h3>
                <div className="space-y-2">
                  {graphData.centrality.slice(0, 5).map((item, idx) => {
                    const node = graphData.nodes.find(n => n.id === item.nodeId)
                    return (
                      <div 
                        key={item.nodeId} 
                        className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={() => node && handleNodeClick({ id: node.id })}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">#{idx + 1}</span>
                          <span className="font-medium text-gray-900">{node?.label || item.nodeId}</span>
                        </div>
                        <span className="text-gray-600">{item.score.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
