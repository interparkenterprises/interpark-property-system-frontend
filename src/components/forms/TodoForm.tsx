'use client';

import { useState, useEffect } from 'react';
import { ToDo, TaskPriority, CreateTodoRequest, UpdateTodoRequest } from '@/types';
import { todosAPI, authAPI, managedUsersAPI } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface TodoFormProps {
  todo?: ToDo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TodoForm({ todo, onSuccess, onCancel }: TodoFormProps) {
  const { user, isAdmin, isManager, userId } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM' as TaskPriority,
    assignedUserId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isManagerOrAdmin = isAdmin || isManager;

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || '',
        dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
        priority: todo.priority,
        assignedUserId: todo.assignedById || '',
      });
    }
  }, [todo]);

  useEffect(() => {
    // Fetch available users for assignment if user is manager or admin and creating a new task
    if (isManagerOrAdmin && !todo) {
      fetchAvailableUsers();
    }
  }, [isManagerOrAdmin, todo]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      if (isAdmin) {
        // ADMIN: Fetch all users using authAPI
        const users = await authAPI.getAllUsers();
        // Filter out current user and only show active/approved users
        const filteredUsers = users
          .filter(u => u.id !== userId && u.isApproved !== false)
          .map(u => ({ id: u.id, name: u.name, email: u.email }));
        setAvailableUsers(filteredUsers);
      } else if (isManager) {
        // MANAGER: Fetch only their managed users
        const managedUsers = await managedUsersAPI.getAll();
        setAvailableUsers(managedUsers.map(u => ({ 
          id: u.id, 
          name: u.name, 
          email: u.email 
        })));
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (todo) {
        // For updates, only send allowed fields
        const updateData: UpdateTodoRequest = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        };
        if (formData.dueDate) {
          updateData.dueDate = formData.dueDate;
        }
        await todosAPI.update(todo.id, updateData);
      } else {
        // For creation
        const createData: CreateTodoRequest = {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
        };
        if (formData.dueDate) {
          createData.dueDate = formData.dueDate;
        }
        // Only managers/admins can assign tasks to others
        if (isManagerOrAdmin && formData.assignedUserId) {
          createData.assignedUserId = formData.assignedUserId;
        }
        await todosAPI.create(createData);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save todo');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'text-gray-600' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        required
        className="text-gray-900 placeholder:text-gray-500"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Enter task description..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <Input
        label="Due Date"
        name="dueDate"
        type="date"
        value={formData.dueDate}
        onChange={handleChange}
        className="text-gray-900 placeholder:text-gray-500"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900"
        >
          {priorityOptions.map(opt => (
            <option key={opt.value} value={opt.value} className={opt.color}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Only show assignment field for managers/admins when creating new task */}
      {!todo && isManagerOrAdmin && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign To {isAdmin ? '(All Users)' : '(Managed Users)'}
          </label>
          <select
            name="assignedUserId"
            value={formData.assignedUserId}
            onChange={handleChange}
            disabled={loadingUsers}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Assign to myself</option>
            {loadingUsers ? (
              <option disabled>Loading users...</option>
            ) : (
              availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin 
              ? "Select a user to assign this task to. Leave empty to create for yourself."
              : "Select a managed user to assign this task to. Leave empty to create for yourself."}
          </p>
          {!loadingUsers && availableUsers.length === 0 && (
            <p className="text-xs text-yellow-600 mt-1">
              {isAdmin 
                ? "No other users found to assign tasks to."
                : "No managed users found to assign tasks to."}
            </p>
          )}
        </div>
      )}

      {!todo && !isManagerOrAdmin && (
        <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded text-sm">
          <p>⚠️ Tasks you create will need manager approval before you can start working on them.</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : todo ? 'Update' : 'Create'} Todo
        </Button>
      </div>
    </form>
  );
}