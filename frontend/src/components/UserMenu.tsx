import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-teal-500',
    ];
    return colors[id % colors.length];
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div
          className={`w-9 h-9 rounded-full ${getAvatarColor(user.id)} flex items-center justify-center text-white text-sm font-medium shadow-sm`}
        >
          {getInitials(user.full_name)}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Signed in as</p>
              <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                  {user.role === 'lead' ? 'Team Lead' : 'Developer'}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full px-4 py-3 text-left flex items-center gap-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

