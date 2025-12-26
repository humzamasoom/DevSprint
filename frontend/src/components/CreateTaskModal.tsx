import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '../lib/tasks';
import { TaskCreate, User, Priority, TaskStatus } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  members: User[];
}

export default function CreateTaskModal({ isOpen, onClose, projectId, members }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (task: TaskCreate) => tasksApi.createTask(projectId, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', String(projectId)] });
      toast.success('Task created successfully!');
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to create task';
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setAssigneeId(undefined);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description: description || undefined,
      status: 'todo' as TaskStatus,
      priority,
      assignee_id: assigneeId,
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
                <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Fix navigation bug"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    id="assignee"
                    value={assigneeId || ''}
                    onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Unassigned</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Message */}
                {createMutation.isError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {createMutation.error instanceof Error
                      ? createMutation.error.message
                      : 'Failed to create task'}
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
                    disabled={createMutation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Task'}
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

