import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, Search, Layers, FileText, Settings, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useSidebar } from '../context/SidebarContext'

export default function Sidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const location = useLocation()

  const workspaceItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard', exact: true },
    { icon: Search, label: 'Research', path: '/', exact: true },
  ]

  const workflowItems = [
    { icon: Search, label: 'Deep Dive', path: '/', stage: 'research' },
    { icon: Layers, label: 'Storyboard', path: '/storyboard', stage: 'storyboard' },
    { icon: FileText, label: 'Generation', path: '/generation', stage: 'generation' },
  ]

  const getCurrentStage = () => {
    if (location.pathname.startsWith('/report/')) return 'research'
    if (location.pathname.startsWith('/storyboard')) return 'storyboard'
    if (location.pathname.startsWith('/generation')) return 'generation'
    if (location.pathname === '/') return 'research'
    return null
  }

  const currentStage = getCurrentStage()

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-[#1a1a1a] border-r border-[#2c2c2c] transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-[#2c2c2c]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2c2c2c] rounded-lg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-lg text-white tracking-tight">AskDepth</span>
          )}
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-6 scrollbar-light">
        {/* Workspace Section */}
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} mb-6`}>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-3 px-3">
              Workspace
            </div>
          )}
          <nav className="space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#2c2c2c] text-white'
                        : 'text-[#aaaaaa] hover:text-white hover:bg-[#2c2c2c]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Workflow Stages Section */}
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} mb-6`}>
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-3">
              Workflow Stages
            </div>
          )}
          <nav className="space-y-1">
            {workflowItems.map((item) => {
              const Icon = item.icon
              const isActive = currentStage === item.stage
              return (
                <div
                  key={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2c2c2c] text-white'
                      : 'text-[#aaaaaa] hover:text-white hover:bg-[#2c2c2c]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Settings Section */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-[#2c2c2c] text-white'
                : 'text-[#aaaaaa] hover:text-white hover:bg-[#2c2c2c]'
            }`
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </NavLink>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-[#aaaaaa]" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-[#aaaaaa]" />
        )}
      </button>
    </div>
  )
}
