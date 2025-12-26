import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tasksApi } from '../lib/tasks';
import { Task, TaskUpdate, User, Priority, TaskStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ConfirmDialog from './ConfirmDialog';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectId: number;
  members: User[];
}

export default function EditTaskModal({ isOpen, onClose, task, projectId, members }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isLead = user?.role === 'lead';

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_id || undefined);
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: (update: TaskUpdate) => tasksApi.updateTask(task!.id, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', String(projectId)] });
      toast.success('Task updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to update task';
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(task!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', String(projectId)] });
      toast.success('Task deleted successfully!');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to delete task';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!task) return;

    updateMutation.mutate({
      title,
      description: description || undefined,
      status,
      priority,
      assignee_id: assigneeId,
    });
  };

  const handleDelete = () => {
    if (!task) return;
    deleteMutation.mutate();
  };

  if (!task) return null;

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
                <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
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
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Title *
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="edit-priority"
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
                  <label htmlFor="edit-assignee" className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    id="edit-assignee"
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
                {(updateMutation.isError || deleteMutation.isError) && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {updateMutation.error instanceof Error || deleteMutation.error instanceof Error
                      ? 'Operation failed'
                      : 'An error occurred'}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {/* Delete Button (Only for Leads) */}
                  {isLead && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} className="inline mr-1" />
                      Delete
                    </button>
                  )}

                  {/* Save/Cancel Buttons */}
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

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            title="Delete Task"
            message={`Are you sure you want to delete "${task?.title || 'this task'}"? This action cannot be undone.`}
            confirmText="Delete"
            confirmVariant="danger"
          />
        </>
      )}
    </AnimatePresence>
  );
}

