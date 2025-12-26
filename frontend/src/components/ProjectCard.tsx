import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Trash2, Pencil } from 'lucide-react';
import { Project } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
  isOwner?: boolean;
}

export default function ProjectCard({ project, onClick, onEdit, onDelete, isOwner }: ProjectCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-200 group"
    >
      {/* Project Title */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
          {project.title}
        </h3>
        <div className="flex items-center gap-2">
          {/* Edit Button (Only for Owners) */}
          {isOwner && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Edit project"
            >
              <Pencil size={16} />
            </button>
          )}
          {/* Delete Button (Only for Owners) */}
          {isOwner && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Delete project"
            >
              <Trash2 size={16} />
            </button>
          )}
          <ArrowRight
            size={20}
            className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0"
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
        {project.description || 'No description provided'}
      </p>

      {/* Member Avatars */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {project.members.slice(0, 5).map((member, index) => (
            <div
              key={member.id}
              className={`w-8 h-8 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm`}
              title={member.full_name}
              style={{ zIndex: 5 - index }}
            >
              {getInitials(member.full_name)}
            </div>
          ))}
          {project.members.length > 5 && (
            <div
              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white shadow-sm"
              title={`+${project.members.length - 5} more`}
            >
              +{project.members.length - 5}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-500 ml-1">
          {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => onDelete && onDelete(project.id)}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.title}"? This will delete all tasks and cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </motion.div>
  );
}

