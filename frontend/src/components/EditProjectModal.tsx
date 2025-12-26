import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsApi } from '../lib/projects';
import { ProjectUpdate, Project } from '../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function EditProjectModal({ isOpen, onClose, project }: EditProjectModalProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const queryClient = useQueryClient();

  // Reset form when project changes
  useEffect(() => {
    if (isOpen) {
      setTitle(project.title);
      setDescription(project.description || '');
    }
  }, [isOpen, project]);

  const updateMutation = useMutation({
    mutationFn: (update: ProjectUpdate) => projectsApi.updateProject(project.id, update),
    onMutate: async (updatedProject) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);

      // Optimistically update to the new value
      queryClient.setQueryData<Project[]>(['projects'], (old = []) =>
        old.map((p) =>
          p.id === project.id
            ? { ...p, ...updatedProject }
            : p
        )
      );

      return { previousProjects };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', String(project.id)] });
      toast.success('Project updated successfully!');
      onClose();
    },
    onError: (err: any, newProject, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      const errorMessage = err.response?.data?.detail || 'Failed to update project';
      toast.error(errorMessage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ 
      title: title !== project.title ? title : undefined,
      description: description !== (project.description || '') ? description || undefined : undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Edit Project</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Sprint 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Error Message */}
                {updateMutation.isError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : 'Failed to update project'}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

