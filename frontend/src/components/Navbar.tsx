import { useState, useRef, useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onCreateProject?: () => void;
}

export default function Navbar({ onCreateProject }: NavbarProps) {
  const { user, logout, isLead } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsDropdownOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            {/* Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-2 sm:p-2.5 shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                <Zap size={18} className="text-white sm:w-5 sm:h-5" strokeWidth={2.5} />
              </div>
            </div>
            
            {/* Text Logo */}
            <div className="flex items-baseline">
              <span className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight group-hover:text-gray-700 transition-colors">
                Dev
              </span>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tight">
                Sprint
              </span>
            </div>
          </Link>

          {/* Right Side: Actions + User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Create Project Button (Only for Leads) */}
            {isLead && onCreateProject && (
              <button
                onClick={onCreateProject}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                title="New Project"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2.5} />
                <span className="hidden sm:inline">New Project</span>
              </button>
            )}

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-sm ring-2 ring-white">
                  {user ? getInitials(user.full_name) : '?'}
                </div>

                {/* User Info (Hidden on mobile) */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900 leading-tight">
                    {user?.full_name || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 capitalize leading-tight">
                    {user?.role || 'Member'}
                  </span>
                </div>

                {/* Dropdown Arrow */}
                <ChevronDown
                  size={16}
                  className={`hidden md:block text-gray-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

