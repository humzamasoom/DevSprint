import { Task, Priority, User } from '../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
  members: User[];
}

const priorityConfig = {
  high: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'High',
  },
  medium: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Medium',
  },
  low: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Low',
  },
};

export default function TaskCard({ task, onClick, isDragging, members }: TaskCardProps) {
  const priority = priorityConfig[task.priority as Priority];
  const assignee = members.find((m) => m.id === task.assignee_id);

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
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 p-4 group ${
        isDragging ? 'rotate-2 shadow-2xl ring-2 ring-blue-400 scale-105 opacity-90 cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        transition: isDragging 
          ? 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s ease, opacity 0.2s ease'
          : 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        // Ensure the card doesn't have margin that could offset the drag
        margin: 0,
      }}
    >
      {/* Task Title */}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {task.title}
      </h4>

      {/* Description (if exists) */}
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Footer: Priority & Assignee */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        {/* Priority Badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}
        >
          {priority.label}
        </span>

        {/* Assignee Avatar */}
        {assignee ? (
          <div
            className={`w-7 h-7 rounded-full ${getAvatarColor(assignee.id)} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
            title={assignee.full_name}
          >
            {getInitials(assignee.full_name)}
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium"
            title="Unassigned"
          >
            ?
          </div>
        )}
      </div>
    </div>
  );
}

