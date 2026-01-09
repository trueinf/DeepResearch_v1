import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSidebar } from '../context/SidebarContext'

export default function TopBar() {
  const { isCollapsed } = useSidebar()
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

  return (
    <div className={`h-16 bg-white border-b border-[#dddddd] flex items-center px-8 sm:px-10 fixed top-0 right-0 z-40 transition-all duration-300 overflow-visible ${isCollapsed ? 'left-16' : 'left-64'}`}>
      <div className="w-full max-w-5xl mx-auto flex items-center justify-end">
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
