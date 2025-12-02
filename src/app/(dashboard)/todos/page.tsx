'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ToDo } from '@/types';
import { todosAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function TodosPage() {
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await todosAPI.getAll();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        await todosAPI.delete(id);
        fetchTodos();
      } catch (error) {
        console.error('Error deleting todo:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PENDING' ? 'COMPLETED' : 'PENDING';
    try {
      await todosAPI.update(id, { status: newStatus });
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const pendingTodos = todos.filter(todo => todo.status === 'PENDING');
  const completedTodos = todos.filter(todo => todo.status === 'COMPLETED');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">To-Do List</h1>
        <Link href="/todos/create">
          <Button>Add Todo</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-orange-600">Pending ({pendingTodos.length})</h2>
          {pendingTodos.length === 0 ? (
            <p className="text-gray-500">No pending todos.</p>
          ) : (
            <div className="space-y-4">
              {pendingTodos.map((todo) => (
                <div key={todo.id} className="border-l-4 border-orange-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{todo.title}</h3>
                      {todo.description && (
                        <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                      )}
                      {todo.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleStatusChange(todo.id, todo.status)}
                        className="text-green-600 hover:text-green-900 text-sm"
                      >
                        Complete
                      </button>
                      <Link
                        href={`/todos/${todo.id}`}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 text-green-600">Completed ({completedTodos.length})</h2>
          {completedTodos.length === 0 ? (
            <p className="text-gray-500">No completed todos.</p>
          ) : (
            <div className="space-y-4">
              {completedTodos.map((todo) => (
                <div key={todo.id} className="border-l-4 border-green-500 pl-4 py-2 opacity-75">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-through">{todo.title}</h3>
                      {todo.description && (
                        <p className="text-sm text-gray-600 mt-1 line-through">{todo.description}</p>
                      )}
                      {todo.dueDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {new Date(todo.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleStatusChange(todo.id, todo.status)}
                        className="text-orange-600 hover:text-orange-900 text-sm"
                      >
                        Reopen
                      </button>
                      <Link
                        href={`/todos/${todo.id}`}
                        className="text-primary-600 hover:text-primary-900 text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDelete(todo.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}