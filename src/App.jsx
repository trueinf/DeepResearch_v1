import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import ResearchProgress from './pages/ResearchProgress'
import ReportView from './pages/ReportView'
import FollowUpChat from './pages/FollowUpChat'
import ResearchMap from './pages/ResearchMap'
import Signup from './pages/Signup'
import Login from './pages/Login'
import CreateUserDirect from './pages/CreateUserDirect'
import Dashboard from './pages/Dashboard'
import StoryboardPage from './pages/StoryboardPage'
import GenerationPage from './pages/GenerationPage'
import PPTSlideEditor from './pages/PPTSlideEditor'
import { ResearchProvider } from './context/ResearchContext'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider, useSidebar } from './context/SidebarContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ProgressIndicator from './components/ProgressIndicator'
import AIStatusFloat from './components/AIStatusFloat'

function LayoutWrapper({ selectedModel, onModelChange }) {
  const { isCollapsed } = useSidebar()
  const location = useLocation()
  
  // Hide sidebar for ResearchProgress, ReportView, StoryboardPage, and PPTSlideEditor pages
  const isProgressPage = location.pathname.startsWith('/progress/')
  const isReportPage = location.pathname.startsWith('/report/')
  const isStoryboardPage = location.pathname.startsWith('/storyboard/')
  const isPPTPage = location.pathname.startsWith('/ppt/')
  const showSidebar = !isProgressPage && !isReportPage && !isStoryboardPage && !isPPTPage

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}`}>
        {showSidebar && (
          <>
            <TopBar selectedModel={selectedModel} onModelChange={onModelChange} />
            <ProgressIndicator />
          </>
        )}
        <main className={`flex-1 overflow-y-auto ${showSidebar ? '' : ''}`} style={showSidebar ? { paddingTop: '176px' } : {}}>
          <div className={showSidebar ? "max-w-[1440px] mx-auto px-12 py-10" : ""}>
            <Routes>
              <Route path="/" element={<Home selectedModel={selectedModel} />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/progress/:id" element={<ResearchProgress />} />
              <Route path="/report/:id" element={<ReportView />} />
              <Route path="/map/:id" element={<ResearchMap />} />
              <Route path="/chat/:id" element={<FollowUpChat />} />
              <Route path="/storyboard/:id" element={<StoryboardPage />} />
              <Route path="/ppt/:id" element={<PPTSlideEditor />} />
              <Route path="/generation/:id" element={<GenerationPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        {showSidebar && <AIStatusFloat isActive={true} />}
      </div>
    </div>
  )
}

function App() {
  // Get model from localStorage, but force gemini-2.5-flash if it's pro
  const getInitialModel = () => {
    try {
      const saved = localStorage.getItem('selectedModel')
      // If saved model is gemini-2.5-pro, reset to flash
      if (saved === 'gemini-2.5-pro') {
        localStorage.removeItem('selectedModel')
        return 'gemini-2.5-flash'
      }
      return saved || 'gemini-2.5-flash'
    } catch {
      return 'gemini-2.5-flash'
    }
  }
  
  const [selectedModel, setSelectedModel] = useState(getInitialModel())
  
  // Ensure we always start with flash, not pro
  useEffect(() => {
    if (selectedModel === 'gemini-2.5-pro') {
      setSelectedModel('gemini-2.5-flash')
      try {
        localStorage.setItem('selectedModel', 'gemini-2.5-flash')
      } catch {}
    }
  }, [selectedModel])
  
  // Save model to localStorage when it changes
  const handleModelChange = (model) => {
    // Prevent setting to pro - always use flash as default
    const modelToSet = model === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : model
    setSelectedModel(modelToSet)
    try {
      localStorage.setItem('selectedModel', modelToSet)
    } catch {
      // Ignore localStorage errors
    }
  }

  return (
    <AuthProvider>
      <ResearchProvider>
        <SidebarProvider>
          <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/create-user" element={<CreateUserDirect />} />
            
            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <LayoutWrapper selectedModel={selectedModel} onModelChange={handleModelChange} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        </SidebarProvider>
      </ResearchProvider>
    </AuthProvider>
  )
}

export default App
