import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import CreateProjectModal from './CreateProjectModal';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { isLead } = useAuth();
  const location = useLocation();

  // Show Create Project button on dashboard and project pages
  const showCreateButton = isLead && (location.pathname === '/' || location.pathname === '/dashboard' || location.pathname.startsWith('/projects'));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar 
        onCreateProject={showCreateButton ? () => setIsCreateModalOpen(true) : undefined}
      />
      
      <main>
        {children}
      </main>

      {/* Global Create Project Modal */}
      {isLead && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}

