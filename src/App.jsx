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
import AIStatusFloat from './components/AIStatusFloat'

function LayoutWrapper() {
  const { isCollapsed } = useSidebar()
  const location = useLocation()
  
  // Hide sidebar for ResearchProgress, ReportView, StoryboardPage, and PPTSlideEditor pages
  const isProgressPage = location.pathname.startsWith('/progress/')
  const isReportPage = location.pathname.startsWith('/report/')
  const isStoryboardPage = location.pathname.startsWith('/storyboard/')
  const isPPTPage = location.pathname.startsWith('/ppt/')
  const isChatPage = location.pathname.startsWith('/chat/')
  const isMapPage = location.pathname.startsWith('/map/')
  const showSidebar = !isProgressPage && !isReportPage && !isStoryboardPage && !isPPTPage

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'}`}>
        {showSidebar && (
          <>
          <TopBar />
          </>
        )}
        <main className={`flex-1 overflow-y-auto ${showSidebar ? '' : ''}`} style={showSidebar && !isChatPage && !isMapPage ? { paddingTop: '64px' } : {}}>
          <div className={showSidebar && !isChatPage && !isMapPage ? "max-w-[1440px] mx-auto px-12 py-10" : ""}>
            <Routes>
              <Route path="/" element={<Home />} />
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
        {showSidebar && !isChatPage && !isMapPage && <AIStatusFloat isActive={true} />}
      </div>
    </div>
  )
}

function App() {
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
                  <LayoutWrapper />
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
