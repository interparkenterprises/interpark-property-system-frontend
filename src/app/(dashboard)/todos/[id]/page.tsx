'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ToDo, ToDoStatus, TaskPriority } from '@/types';
import { todosAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import TodoForm from '@/components/forms/TodoForm';
import { useAuth } from '@/context/AuthContext';

export default function TodoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userId, isAdmin, isManager } = useAuth();
  const [todo, setTodo] = useState<ToDo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const todoId = params.id as string;

  useEffect(() => {
    fetchTodo();
  }, [todoId]);

  const fetchTodo = async () => {
    try {
      const data = await todosAPI.getById(todoId);
      setTodo(data);
    } catch (error) {
      console.error('Error fetching todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await todosAPI.delete(todoId);
      router.push('/dashboard/todos');
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleMarkComplete = async () => {
    setActionLoading(true);
    try {
      await todosAPI.markAsComplete(todoId, completionNotes || undefined);
      setShowCompleteModal(false);
      setCompletionNotes('');
      fetchTodo();
    } catch (error) {
      console.error('Error marking todo as complete:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await todosAPI.approveTask(todoId);
      fetchTodo();
    } catch (error) {
      console.error('Error approving todo:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await todosAPI.rejectTask(todoId, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchTodo();
    } catch (error) {
      console.error('Error rejecting todo:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      await todosAPI.update(todoId, { status: 'PENDING' });
      fetchTodo();
    } catch (error) {
      console.error('Error reopening todo:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSuccess = () => {
    setEditing(false);
    fetchTodo();
  };

  const canUserApprove = () => {
    return (todo?.status === 'PENDING_APPROVAL' && 
            (isAdmin || (isManager && (todo?.assignedById === userId || todo?.isSelfCreated))));
  };

  const canUserComplete = () => {
    return (todo?.userId === userId && 
            (todo?.status === 'PENDING' || todo?.status === 'IN_PROGRESS'));
  };

  const canUserEdit = () => {
    return isAdmin || isManager || todo?.userId === userId;
  };

  const canUserDelete = () => {
    return isAdmin || isManager || todo?.userId === userId;
  };

  const getStatusDetails = (status: ToDoStatus) => {
    const details = {
      PENDING: { 
        label: 'Pending', 
        color: 'bg-yellow-100 border-yellow-300', 
        textColor: 'text-yellow-900',
        icon: '⏳',
        description: 'Task is ready to be started'
      },
      IN_PROGRESS: { 
        label: 'In Progress', 
        color: 'bg-blue-100 border-blue-300', 
        textColor: 'text-blue-900',
        icon: '🔄',
        description: 'Task is currently being worked on'
      },
      PENDING_APPROVAL: { 
        label: 'Pending Approval', 
        color: 'bg-purple-100 border-purple-300', 
        textColor: 'text-purple-900',
        icon: '✋',
        description: 'Task completed, waiting for manager review'
      },
      COMPLETED: { 
        label: 'Completed', 
        color: 'bg-green-100 border-green-300', 
        textColor: 'text-green-900',
        icon: '✅',
        description: 'Task has been approved and completed'
      },
      OVERDUE: { 
        label: 'Overdue', 
        color: 'bg-red-100 border-red-300', 
        textColor: 'text-red-900',
        icon: '⚠️',
        description: 'Task has passed its due date'
      },
      REJECTED: { 
        label: 'Rejected', 
        color: 'bg-gray-100 border-gray-300', 
        textColor: 'text-gray-900',
        icon: '❌',
        description: 'Task was rejected by the manager'
      },
    };
    return details[status] || details.PENDING;
  };

  const getPriorityDetails = (priority: TaskPriority) => {
    const details = {
      LOW: { 
        label: 'Low', 
        color: 'bg-gray-100 border-gray-300',
        textColor: 'text-gray-900',
        icon: '🟢'
      },
      MEDIUM: { 
        label: 'Medium', 
        color: 'bg-blue-100 border-blue-300',
        textColor: 'text-blue-900',
        icon: '🔵'
      },
      HIGH: { 
        label: 'High', 
        color: 'bg-orange-100 border-orange-300',
        textColor: 'text-orange-900',
        icon: '🟠'
      },
      URGENT: { 
        label: 'Urgent', 
        color: 'bg-red-100 border-red-300',
        textColor: 'text-red-900',
        icon: '🔴'
      },
    };
    return details[priority] || details.MEDIUM;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-700">Loading task details...</p>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Todo not found</h2>
        <p className="text-gray-600 mb-6">The task you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => router.push('/dashboard/todos')}>
          Back to Todos
        </Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary" 
              onClick={() => setEditing(false)}
              className="flex items-center gap-2"
            >
              ← Back to Task
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">Edit Todo</h1>
          </div>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <TodoForm 
            todo={todo} 
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  const statusDetails = getStatusDetails(todo.status);
  const priorityDetails = getPriorityDetails(todo.priority);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back Button - Always visible */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/todos')}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          <span className="text-lg">←</span>
          Back to Todos
        </Button>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${priorityDetails.color} ${priorityDetails.textColor} border`}>
              <span className="mr-1">{priorityDetails.icon}</span>
              {priorityDetails.label} Priority
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusDetails.color} ${statusDetails.textColor} border`}>
              <span className="mr-1">{statusDetails.icon}</span>
              {statusDetails.label}
            </div>
            {todo.isSelfCreated && (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-900 border border-indigo-300">
                📝 Self-Created
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{todo.title}</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {canUserComplete() && (
            <Button 
              onClick={() => setShowCompleteModal(true)} 
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
            >
              {actionLoading ? 'Processing...' : '✓ Mark Complete'}
            </Button>
          )}
          
          {canUserApprove() && (
            <>
              <Button 
                onClick={handleApprove} 
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              >
                ✓ Approve
              </Button>
              <Button 
                onClick={() => setShowRejectModal(true)} 
                disabled={actionLoading}
                variant="danger"
                className="shadow-sm"
              >
                ✗ Reject
              </Button>
            </>
          )}
          
          {todo.status === 'COMPLETED' && todo.userId === userId && (
            <Button 
              onClick={handleReopen} 
              disabled={actionLoading}
              variant="secondary"
              className="shadow-sm"
            >
              🔄 Reopen
            </Button>
          )}
          
          {canUserEdit() && (
            <Button onClick={() => setEditing(true)} className="shadow-sm">
              ✏️ Edit
            </Button>
          )}
          
          {canUserDelete() && (
            <Button 
              variant="danger" 
              onClick={() => setShowDeleteConfirm(true)}
              className="shadow-sm"
            >
              🗑️ Delete
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`p-6 rounded-lg border-2 ${statusDetails.color} shadow-sm`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{statusDetails.icon}</span>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg ${statusDetails.textColor} mb-1`}>
                Status: {statusDetails.label}
              </h3>
              <p className={`${statusDetails.textColor} opacity-90`}>
                {statusDetails.description}
              </p>
              {todo.status === 'PENDING_APPROVAL' && todo.completionNotes && (
                <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900 mb-1">Completion Notes:</p>
                  <p className="text-gray-800">{todo.completionNotes}</p>
                </div>
              )}
              {todo.status === 'REJECTED' && todo.rejectionReason && (
                <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900 mb-1">Rejection Reason:</p>
                  <p className="text-gray-800">{todo.rejectionReason}</p>
                </div>
              )}
              {todo.status === 'OVERDUE' && todo.dueDate && (
                <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">Was due on: {new Date(todo.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Card */}
        {todo.description && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              📄 Description
            </h2>
            <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
              {todo.description}
            </p>
          </div>
        )}

        {/* Completion Notes (if completed) */}
        {todo.completionNotes && todo.status === 'COMPLETED' && (
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
            <h2 className="text-sm font-semibold text-green-800 uppercase tracking-wide mb-3">
              📝 Completion Notes
            </h2>
            <p className="text-green-900 whitespace-pre-wrap leading-relaxed">
              {todo.completionNotes}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            📋 Task Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Priority</h3>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <span>{priorityDetails.icon}</span>
                  <span>{priorityDetails.label}</span>
                </p>
              </div>

              {todo.dueDate && (
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Due Date</h3>
                  <p className="text-gray-900 font-medium">
                    {new Date(todo.dueDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    <span className="text-gray-600 text-sm ml-2">
                      at {new Date(todo.dueDate).toLocaleTimeString()}
                    </span>
                  </p>
                </div>
              )}

              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Created</h3>
                <p className="text-gray-900 font-medium">
                  {new Date(todo.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  <span className="text-gray-600 text-sm ml-2">
                    at {new Date(todo.createdAt).toLocaleTimeString()}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Last Updated</h3>
                  <p className="text-gray-900 font-medium">
                    {new Date(todo.updatedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    <span className="text-gray-600 text-sm ml-2">
                      at {new Date(todo.updatedAt).toLocaleTimeString()}
                    </span>
                  </p>
                </div>
              )}

              {todo.completedAt && (
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Completed</h3>
                  <p className="text-gray-900 font-medium">
                    {new Date(todo.completedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    <span className="text-gray-600 text-sm ml-2">
                      at {new Date(todo.completedAt).toLocaleTimeString()}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* People Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            👥 People
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todo.user && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">👤</div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Assigned To</h3>
                  <p className="text-gray-900 font-medium">{todo.user.name}</p>
                  <p className="text-gray-600 text-sm">{todo.user.email}</p>
                </div>
              </div>
            )}

            {todo.assignedBy && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">📋</div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Assigned By</h3>
                  <p className="text-gray-900 font-medium">{todo.assignedBy.name}</p>
                  <p className="text-gray-600 text-sm">{todo.assignedBy.email}</p>
                </div>
              </div>
            )}

            {todo.approvedBy && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">✓</div>
                <div>
                  <h3 className="text-xs font-medium text-green-700 uppercase mb-1">Approved By</h3>
                  <p className="text-green-900 font-medium">{todo.approvedBy.name}</p>
                  {todo.approvedAt && (
                    <p className="text-green-700 text-sm">
                      {new Date(todo.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {todo.reviewedBy && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl">👁️</div>
                <div>
                  <h3 className="text-xs font-medium text-purple-700 uppercase mb-1">Reviewed By</h3>
                  <p className="text-purple-900 font-medium">{todo.reviewedBy.name}</p>
                  {todo.reviewedAt && (
                    <p className="text-purple-700 text-sm">
                      {new Date(todo.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Cards */}
        {todo.isSelfCreated && (
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Self-Created Task</h3>
                <p className="text-blue-800">
                  {todo.status === 'PENDING_APPROVAL' 
                    ? 'This task is waiting for manager approval before you can start working on it.' 
                    : todo.status === 'PENDING' 
                      ? 'This task has been approved by your manager. You can now start working on it.'
                      : todo.status === 'REJECTED'
                        ? 'This task was rejected by your manager. Please check the rejection reason above.'
                        : todo.status === 'COMPLETED'
                          ? 'This self-created task has been completed and approved.'
                          : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {todo.assignedById && !todo.isSelfCreated && todo.assignedById !== userId && (
          <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📌</span>
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Manager-Assigned Task</h3>
                <p className="text-green-800">
                  This task was assigned to you by {todo.assignedBy?.name}. 
                  {todo.status === 'PENDING' && ' Once you complete it, it will need manager approval.'}
                  {todo.status === 'IN_PROGRESS' && ' Keep working on this task.'}
                  {todo.status === 'PENDING_APPROVAL' && ' This task is waiting for manager review.'}
                  {todo.status === 'COMPLETED' && ' This task has been completed and approved.'}
                  {todo.status === 'REJECTED' && ' This task was rejected. Please check the rejection reason.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🗑️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Task</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{todo.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Task</h3>
              <p className="text-gray-700 mb-4">
                Add any completion notes (optional):
              </p>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 mb-4"
                rows={3}
                placeholder="Enter completion notes here..."
              />
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => {
                  setShowCompleteModal(false);
                  setCompletionNotes('');
                }}>
                  Cancel
                </Button>
                <Button onClick={handleMarkComplete} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : 'Complete Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Task Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Reject Task</h3>
              <p className="text-gray-700 mb-4">
                Please provide a reason for rejection:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 mb-4"
                rows={3}
                placeholder="Enter rejection reason..."
                required
              />
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleReject} disabled={!rejectionReason.trim() || actionLoading}>
                  {actionLoading ? 'Processing...' : 'Reject Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}