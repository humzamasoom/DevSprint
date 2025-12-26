import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Folder, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { projectsApi } from '../lib/projects';
import ProjectCard from '../components/ProjectCard';
import ProjectCardSkeleton from '../components/ProjectCardSkeleton';
import EditProjectModal from '../components/EditProjectModal';
import { Project } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projects, isLoading, isError, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to delete project';
      toast.error(errorMessage);
    },
  });

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsEditModalOpen(true);
  };

  const handleDeleteProject = (projectId: number) => {
    deleteMutation.mutate(projectId);
  };

  const isLead = user?.role === 'lead';

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter((project) =>
      project.title.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Animation variants for stagger effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Title & Search */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">My Projects</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {filteredProjects?.length || 0} {filteredProjects?.length === 1 ? 'project' : 'projects'}
                {searchQuery && ` (filtered from ${projects?.length || 0})`}
              </p>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-md"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            />
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div key={i} variants={itemVariants}>
                <ProjectCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Error State */}
        {isError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3"
          >
            <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Failed to load projects</h3>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && projects?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-12 text-center"
          >
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600">
                {isLead
                  ? 'Get started by creating your first project using the "New Project" button in the navigation bar above.'
                  : 'No projects assigned to you yet. Contact your team lead.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Empty State - No Search Results */}
        {!isLoading && !isError && projects && projects.length > 0 && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-12 text-center"
          >
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">
                No projects match your search for "{searchQuery}". Try a different search term.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Clear search
              </button>
            </div>
          </motion.div>
        )}

        {/* Projects Grid */}
        {!isLoading && !isError && filteredProjects && filteredProjects.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project) => (
              <motion.div key={project.id} variants={itemVariants}>
                <ProjectCard
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  isOwner={user?.id === project.owner_id}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Edit Project Modal */}
      {projectToEdit && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setProjectToEdit(null);
          }}
          project={projectToEdit}
        />
      )}
    </>
  );
}
