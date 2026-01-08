import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSidebar } from '../context/SidebarContext'

export default function TopBar({ selectedModel, onModelChange }) {
  const { isCollapsed } = useSidebar()
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }
  
  const models = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', status: 'active' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', status: 'active' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', status: 'active' },
  ]

  const safeSelectedModel = selectedModel === 'gemini-2.5-pro' ? 'gemini-2.5-flash' : (selectedModel || 'gemini-2.5-flash')
  const currentModel = models.find(m => m.id === safeSelectedModel) || models[0]

  return (
    <div className={`h-16 bg-white border-b border-[#dddddd] flex items-center justify-end px-6 fixed top-0 right-0 z-40 transition-all duration-300 ${isCollapsed ? 'left-16' : 'left-64'}`}>
      <div className="flex items-center gap-4">
        {/* Model Selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#f0f0f0] hover:bg-[#e0e0e0] rounded-lg transition-colors border border-[#e0e0e0]"
          >
            <span className="text-sm font-medium text-[#333333]">{currentModel.name}</span>
            <ChevronDown className="w-4 h-4 text-[#666666]" />
          </button>

          {showModelDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowModelDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e0e0e0] rounded-lg shadow-xl z-20">
                <div className="py-1">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id)
                        setShowModelDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#f0f0f0] transition-colors ${
                        safeSelectedModel === model.id ? 'text-[#000000] font-semibold' : 'text-[#333333]'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${model.status === 'active' ? 'bg-[#000000]' : 'bg-[#999999]'}`}></div>
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="w-8 h-8 bg-[#000000] rounded-full flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {getUserInitials()}
          </button>

          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#e0e0e0] rounded-lg shadow-xl z-20">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-[#e0e0e0]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#000000] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#333333] truncate">
                          {user?.email || 'User'}
                        </p>
                        <p className="text-xs text-[#666666]">Signed in</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 text-[#000000] hover:bg-[#f0f0f0] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
