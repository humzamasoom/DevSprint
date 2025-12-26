import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, UserMinus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { projectsApi } from '../lib/projects';
import { usersApi } from '../lib/users';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentMembers: User[];
  ownerId: number;
}

export default function InviteMemberModal({ isOpen, onClose, projectId, currentMembers, ownerId }: InviteMemberModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isLead = user?.role === 'lead';

  // Fetch all users
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: usersApi.getAllUsers,
    enabled: isOpen,
  });

  // Filter out users who are already members
  const currentMemberIds = new Set(currentMembers.map((m) => m.id));
  const availableUsers = allUsers.filter((user) => !currentMemberIds.has(user.id));

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.addProjectMember(projectId, userId),
    onSuccess: () => {
      // Invalidate single project query (for board page)
      queryClient.invalidateQueries({ queryKey: ['project', String(projectId)] });
      // Invalidate tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks', String(projectId)] });
      // Invalidate projects list (for dashboard)
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast.success('Member invited successfully!');
      setSelectedUserId(undefined);
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to invite member';
      toast.error(errorMessage);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => projectsApi.removeProjectMember(projectId, userId),
    onSuccess: () => {
      // Invalidate single project query (for board page)
      queryClient.invalidateQueries({ queryKey: ['project', String(projectId)] });
      // Invalidate tasks query
      queryClient.invalidateQueries({ queryKey: ['tasks', String(projectId)] });
      // Invalidate projects list (for dashboard)
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast.success('Member removed successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Failed to remove member';
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      inviteMutation.mutate(selectedUserId);
    }
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
                <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* User Selection */}
                <div>
                  <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select User
                  </label>
                  {isLoading ? (
                    <div className="text-sm text-gray-500 py-2">Loading users...</div>
                  ) : availableUsers.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2 bg-gray-50 rounded-lg px-3">
                      All users are already members of this project.
                    </div>
                  ) : (
                    <select
                      id="user-select"
                      required
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">-- Select a user --</option>
                      {availableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Current Members List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Members ({currentMembers.length})
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {currentMembers.map((member) => {
                      const isOwner = member.id === ownerId;
                      const canRemove = isLead && !isOwner;
                      
                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {member.full_name}
                              {isOwner && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                  Owner
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove ${member.full_name} from this project?`)) {
                                  removeMutation.mutate(member.id);
                                }
                              }}
                              disabled={removeMutation.isPending}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Remove member"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Message */}
                {inviteMutation.isError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {inviteMutation.error instanceof Error
                      ? inviteMutation.error.message
                      : 'Failed to invite member'}
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
                    disabled={inviteMutation.isPending || !selectedUserId || availableUsers.length === 0}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {inviteMutation.isPending ? (
                      'Inviting...'
                    ) : (
                      <>
                        <UserPlus size={16} className="inline mr-1" />
                        Invite Member
                      </>
                    )}
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

