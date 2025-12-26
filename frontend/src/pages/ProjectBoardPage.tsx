import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, UserPlus, AlertCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi } from '../lib/projects';
import { tasksApi } from '../lib/tasks';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import InviteMemberModal from '../components/InviteMemberModal';
import { Task, TaskStatus, Priority } from '../types';

const COLUMNS = [
  { id: 'todo', title: 'To Do', status: 'todo' as TaskStatus },
  { id: 'inprogress', title: 'In Progress', status: 'inprogress' as TaskStatus },
  { id: 'done', title: 'Done', status: 'done' as TaskStatus },
];

export default function ProjectBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<number | 'all'>('all');

  // Fetch project details
  const { data: project, isLoading: projectLoading, isError: projectError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(Number(projectId)),
    enabled: !!projectId,
    retry: 1, // Only retry once for 404s
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getTasks(Number(projectId)),
    enabled: !!projectId && !!project, // Only fetch tasks if project exists
    retry: 1,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, update }: { taskId: number; update: { status: TaskStatus } }) =>
      tasksApi.updateTask(taskId, update),
    onMutate: async ({ taskId, update }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', projectId]);

      // Optimistically update the cache immediately
      // This works seamlessly with the drag animation
      queryClient.setQueryData<Task[]>(['tasks', projectId], (old = []) =>
        old.map((task) => (task.id === taskId ? { ...task, status: update.status } : task))
      );

      return { previousTasks };
    },
    onSuccess: () => {
      // Success - data is already updated optimistically
      // No need to refetch, avoiding the flash
    },
    onError: (err: any, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks);
      }
      // Show error toast
      const errorMessage = err.response?.data?.detail || 'Failed to update task';
      toast.error(errorMessage);
    },
    // Remove onSettled to prevent immediate refetch that causes flash
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as TaskStatus;
    const taskId = Number(draggableId);

    // Trigger the mutation with optimistic update
    // The removed onSettled prevents flickering
    updateTaskMutation.mutate({ taskId, update: { status: newStatus } });
  };

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (assigneeFilter !== 'all' && task.assignee_id !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, priorityFilter, assigneeFilter]);

  // Group filtered tasks by status
  const tasksByStatus = filteredTasks.reduce(
    (acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

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

  if (projectLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  // Handle project not found or error
  if (projectError || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-6">
            This project doesn't exist or you don't have access to it.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all hover:scale-105"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Page Header - Mobile Optimized */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6"
      >
        {/* Top Row: Back + Title + Action Buttons */}
        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-all hover:shadow-sm border border-transparent hover:border-gray-200 flex-shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} className="text-gray-600 sm:w-5 sm:h-5" />
            </button>

            {/* Project Title & Description */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{project.title}</h1>
              {project.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons - Mobile: Icon only, Desktop: Icon + Text */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Invite Member Button */}
            <button
              onClick={() => setIsInviteMemberModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg transition-all border border-gray-200 hover:shadow-sm"
              title="Invite Member"
            >
              <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Invite</span>
            </button>

            {/* New Task Button */}
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all hover:scale-[1.02] hover:shadow-md"
              title="New Task"
            >
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Avatars + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Member Avatars */}
          <div className="flex -space-x-2">
            {project.members.slice(0, 5).map((member, index) => (
              <div
                key={member.id}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${getAvatarColor(member.id)} flex items-center justify-center text-white text-xs font-medium border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer`}
                title={member.full_name}
                style={{ zIndex: 5 - index }}
              >
                {getInitials(member.full_name)}
              </div>
            ))}
            {project.members.length > 5 && (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white shadow-sm"
                title={`+${project.members.length - 5} more`}
              >
                +{project.members.length - 5}
              </div>
            )}
          </div>

          {/* Filters - Mobile: Full width, Desktop: Inline */}
          <div className="flex items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-3">
            <Filter size={14} className="text-gray-400 hidden sm:block sm:w-4 sm:h-4" />
            
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
              className="flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="all">All Members</option>
              {project.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Error Banner for Task Loading */}
      {tasksError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-sm text-red-800">
            Failed to load tasks. Please refresh the page or try again later.
          </p>
        </motion.div>
      )}

      {/* Kanban Board */}
      <div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((column) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{column.title}</h3>
                  <span className="px-2.5 py-0.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                    {tasksByStatus[column.status]?.length || 0}
                  </span>
                </div>

                {/* Droppable Column */}
                <Droppable droppableId={column.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 bg-gray-50 rounded-xl p-4 min-h-[500px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-300 scale-[1.02]' : ''
                      }`}
                      style={{
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <div className="">
                        {tasksByStatus[column.status]?.map((task, index) => (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => {
                              return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={provided.draggableProps.style}
                                  className={index < (tasksByStatus[column.status]?.length || 0) - 1 ? 'mb-3' : ''}
                                >
                                  <TaskCard
                                    task={task}
                                    onClick={() => {
                                      setSelectedTask(task);
                                      setIsEditTaskModalOpen(true);
                                    }}
                                    isDragging={snapshot.isDragging}
                                    members={project.members}
                                  />
                                </div>
                              );
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>

                      {/* Empty State */}
                      {(!tasksByStatus[column.status] ||
                        tasksByStatus[column.status].length === 0) && (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                            <Plus size={20} className="opacity-40" />
                          </div>
                          <p className="text-sm font-medium opacity-60">No tasks yet</p>
                          <p className="text-xs opacity-40 mt-1">Drag tasks here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </motion.div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        projectId={Number(projectId)}
        members={project.members}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={() => {
          setIsEditTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        projectId={Number(projectId)}
        members={project.members}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteMemberModalOpen}
        onClose={() => setIsInviteMemberModalOpen(false)}
        projectId={Number(projectId)}
        currentMembers={project.members}
        ownerId={project.owner_id}
      />
    </div>
  );
}

