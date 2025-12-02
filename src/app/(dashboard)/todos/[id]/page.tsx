'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ToDo } from '@/types';
import { todosAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import TodoForm from '@/components/forms/TodoForm';

export default function TodoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [todo, setTodo] = useState<ToDo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        await todosAPI.delete(todoId);
        router.push('/dashboard/todos');
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    }
  };

  const handleStatusChange = async () => {
    if (!todo) return;
    
    const newStatus = todo.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      await todosAPI.update(todoId, { status: newStatus });
      fetchTodo();
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const handleUpdateSuccess = () => {
    setEditing(false);
    fetchTodo();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!todo) {
    return <div>Todo not found</div>;
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Edit Todo</h1>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <TodoForm 
            todo={todo} 
            onSuccess={handleUpdateSuccess}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">{todo.title}</h1>
        <div className="space-x-2">
          <Button onClick={handleStatusChange}>
            {todo.status === 'PENDING' ? 'Mark Complete' : 'Reopen'}
          </Button>
          <Button onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Status</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              todo.status === 'PENDING' 
                ? 'bg-orange-100 text-orange-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {todo.status}
            </span>
          </div>

          {todo.description && (
            <div>
              <h2 className="text-sm font-medium text-gray-500">Description</h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap mt-1">{todo.description}</p>
            </div>
          )}

          {todo.dueDate && (
            <div>
              <h2 className="text-sm font-medium text-gray-500">Due Date</h2>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(todo.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-gray-500">Created</h2>
            <p className="text-sm text-gray-900 mt-1">
              {new Date(todo.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-medium text-gray-500">Assigned To</h2>
            <p className="text-sm text-gray-900 mt-1">{todo.user?.name ?? 'Unassigned'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}