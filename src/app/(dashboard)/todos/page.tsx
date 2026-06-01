'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ToDo, ToDoStatus, TaskPriority, GetTodosQueryParams, ManagedUser } from '@/types';
import { todosAPI, managedUsersAPI, authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';

// Add these imports for charts
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

export default function TodosPage() {
  const { user, isAdmin, isManager, userId } = useAuth();
  const [todos, setTodos] = useState<ToDo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ToDoStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedStatsUser, setSelectedStatsUser] = useState<string>('');
  const [statsUserList, setStatsUserList] = useState<Array<{ id: string; name: string; email: string }>>([]);

  const isManagerOrAdmin = isAdmin || isManager;

  // Colors for charts
  const STATUS_COLORS = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    PENDING_APPROVAL: '#8b5cf6',
    COMPLETED: '#10b981',
    OVERDUE: '#ef4444',
    REJECTED: '#6b7280'
  };

  const PRIORITY_COLORS = {
    LOW: '#9ca3af',
    MEDIUM: '#3b82f6',
    HIGH: '#f59e0b',
    URGENT: '#ef4444'
  };

  useEffect(() => {
    fetchTodos();
    if (isManagerOrAdmin) {
      fetchAvailableUsers();
      fetchStatsUsers();
    }
  }, [statusFilter, priorityFilter, selectedUserId]);

  const fetchTodos = async () => {
    setLoading(true);
    try {
      const params: GetTodosQueryParams = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      if (selectedUserId && isManagerOrAdmin) {
        params.userId = selectedUserId;
      }
      
      const data = await todosAPI.getAll(params);
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      if (isAdmin) {
        const users = await authAPI.getAllUsers();
        const filteredUsers = users
          .filter(u => u.id !== userId)
          .map(u => ({ id: u.id, name: u.name, email: u.email }));
        setAvailableUsers(filteredUsers);
      } else if (isManager) {
        const managedUsers = await managedUsersAPI.getAll();
        const mappedUsers = managedUsers.map((u: ManagedUser) => ({ 
          id: u.id, 
          name: u.name, 
          email: u.email 
        }));
        setAvailableUsers(mappedUsers);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStatsUsers = async () => {
    try {
      if (isAdmin) {
        // Admin can see all users with tasks
        const users = await authAPI.getAllUsers();
        setStatsUserList(users.map(u => ({ id: u.id, name: u.name, email: u.email })));
      } else if (isManager) {
        // Manager only sees managed users
        const managedUsers = await managedUsersAPI.getAll();
        // Add current manager to see their own stats too
        setStatsUserList([
          { id: userId || '', name: 'My Stats', email: '' },
          ...managedUsers.map((u: ManagedUser) => ({ id: u.id, name: u.name, email: u.email }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching stats users:', error);
    }
  };

  const fetchStats = async (targetUserId?: string) => {
    setStatsLoading(true);
    try {
      const targetId = targetUserId || selectedUserId || userId || undefined;
      const statsData = await todosAPI.getStats(targetId);
      setStats(statsData);
      setSelectedStatsUser(targetId || '');
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
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

  const handleMarkComplete = async (id: string, completionNotes?: string) => {
    try {
      await todosAPI.markAsComplete(id, completionNotes);
      fetchTodos();
    } catch (error) {
      console.error('Error marking todo as complete:', error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await todosAPI.approveTask(id);
      fetchTodos();
    } catch (error) {
      console.error('Error approving todo:', error);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await todosAPI.rejectTask(id, reason);
      fetchTodos();
    } catch (error) {
      console.error('Error rejecting todo:', error);
    }
  };

  const handleReopen = async (id: string) => {
    try {
      await todosAPI.update(id, { status: 'PENDING' });
      fetchTodos();
    } catch (error) {
      console.error('Error reopening todo:', error);
    }
  };

  const getStatusColor = (status: ToDoStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PENDING_APPROVAL: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      REJECTED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: TaskPriority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getStatusLabel = (status: ToDoStatus) => {
    const labels = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      PENDING_APPROVAL: 'Pending Approval',
      COMPLETED: 'Completed',
      OVERDUE: 'Overdue',
      REJECTED: 'Rejected',
    };
    return labels[status] || status;
  };

  // Prepare data for charts
  const prepareStatusChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Pending', value: stats.byStatus.pending, color: STATUS_COLORS.PENDING },
      { name: 'In Progress', value: stats.byStatus.inProgress, color: STATUS_COLORS.IN_PROGRESS },
      { name: 'Pending Approval', value: stats.byStatus.pendingApproval, color: STATUS_COLORS.PENDING_APPROVAL },
      { name: 'Completed', value: stats.byStatus.completed, color: STATUS_COLORS.COMPLETED },
      { name: 'Overdue', value: stats.byStatus.overdue, color: STATUS_COLORS.OVERDUE },
      { name: 'Rejected', value: stats.byStatus.rejected, color: STATUS_COLORS.REJECTED }
    ].filter(item => item.value > 0);
  };

  const preparePriorityChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Low', value: stats.byPriority.low, color: PRIORITY_COLORS.LOW },
      { name: 'Medium', value: stats.byPriority.medium, color: PRIORITY_COLORS.MEDIUM },
      { name: 'High', value: stats.byPriority.high, color: PRIORITY_COLORS.HIGH },
      { name: 'Urgent', value: stats.byPriority.urgent, color: PRIORITY_COLORS.URGENT }
    ].filter(item => item.value > 0);
  };

  const prepareDailyActivityData = () => {
    if (!stats || !stats.dailyActivity) return [];
    return Object.entries(stats.dailyActivity)
      .slice(-7) // Last 7 days
      .map(([date, data]: [string, any]) => ({
        date: new Date(date).toLocaleDateString(),
        created: data.created,
        completed: data.completed
      }));
  };

  // Permission checks based on user role
  const canUserApprove = (todo: ToDo) => {
    if (isAdmin) return todo.status === 'PENDING_APPROVAL';
    if (isManager) {
      return todo.status === 'PENDING_APPROVAL' && 
             (todo.assignedById === userId || todo.isSelfCreated);
    }
    return false;
  };

  const canUserComplete = (todo: ToDo) => {
    if (!isManagerOrAdmin) {
      return todo.userId === userId && 
             (todo.status === 'PENDING' || todo.status === 'IN_PROGRESS');
    }
    if (todo.userId === userId && (todo.status === 'PENDING' || todo.status === 'IN_PROGRESS')) {
      return true;
    }
    return false;
  };

  const canUserDelete = (todo: ToDo) => {
    if (isAdmin) return true;
    if (isManager) {
      return todo.assignedById === userId || todo.userId === userId;
    }
    return todo.userId === userId;
  };

  const canUserReopen = (todo: ToDo) => {
    return todo.status === 'COMPLETED' && todo.userId === userId;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">To-Do List</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => fetchStats()}>
            View Stats
          </Button>
          <Link href="/todos/create">
            <Button>Add Todo</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ToDoStatus || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority || '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              <option value="">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {(isAdmin || isManager) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isAdmin ? 'All Users' : 'Managed Users'}
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 disabled:bg-gray-100"
              >
                <option value="">My Tasks</option>
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
              {!loadingUsers && availableUsers.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  {isAdmin ? "No other users found." : "No managed users found."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Modal with Blur Background */}
      {showStats && stats && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowStats(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Task Statistics Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {isAdmin || isManager ? (
                    <>Viewing stats for: <span className="font-semibold">
                      {selectedStatsUser === userId ? 'Your Tasks' : 
                       statsUserList.find(u => u.id === selectedStatsUser)?.name || 'Selected User'}
                    </span></>
                  ) : (
                    'Your Personal Statistics'
                  )}
                </p>
              </div>
              
              {/* User selector for Admin/Manager */}
              {(isAdmin || isManager) && statsUserList.length > 0 && (
                <div className="mx-4 w-64">
                  <select
                    value={selectedStatsUser}
                    onChange={(e) => fetchStats(e.target.value)}
                    disabled={statsLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                  >
                    <option value={userId ?? ''}>My Stats</option>
                    {statsUserList
                      .filter(u => u.id !== userId)
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.email && `(${user.email})`}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              
              <button 
                onClick={() => setShowStats(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {statsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Loading statistics...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 font-medium">Total Tasks</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 font-medium">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.completion.completionRate}%</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 font-medium">Completed On Time</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completion.tasksCompletedOnTime}</p>
                  </div>
                  <div className="bg-linear-to-br from-red-50 to-red-100 p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-700 font-medium">Completed Late</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.completion.tasksCompletedLate}</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Distribution Pie Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Task Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={prepareStatusChartData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareStatusChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value} tasks`, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Priority Distribution Bar Chart */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Tasks by Priority</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={preparePriorityChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: 'black' }} />
                        <YAxis tick={{ fill: 'black' }} />
                        <Tooltip formatter={(value: any) => [`${value} tasks`, 'Count']} />
                        <Bar dataKey="value" fill="#8884d8">
                          {preparePriorityChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Weekly Activity Line Chart */}
                  {Object.keys(stats.weeklyActivity || {}).length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Weekly Activity Trend</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={Object.entries(stats.weeklyActivity).slice(-12).map(([week, data]: [string, any]) => ({
                          week,
                          created: data.created,
                          completed: data.completed
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" tick={{ fill: 'black', fontSize: 12 }} />
                          <YAxis tick={{ fill: 'black' }} />
                          <Tooltip formatter={(value: any) => [`${value} tasks`, '']} />
                          <Legend />
                          <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} />
                          <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Daily Activity Area Chart */}
                  {prepareDailyActivityData().length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Last 7 Days Activity</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={prepareDailyActivityData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fill: 'black', fontSize: 12 }} />
                          <YAxis tick={{ fill: 'black' }} />
                          <Tooltip formatter={(value: any) => [`${value} tasks`, '']} />
                          <Legend />
                          <Area type="monotone" dataKey="created" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Created" />
                          <Area type="monotone" dataKey="completed" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Completed" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Detailed Stats Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Table */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Status Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">✅ Pending:</span>
                        <span className="font-semibold text-gray-900">{stats.byStatus.pending}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">🔄 In Progress:</span>
                        <span className="font-semibold text-gray-900">{stats.byStatus.inProgress}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">⏳ Pending Approval:</span>
                        <span className="font-semibold text-gray-900">{stats.byStatus.pendingApproval}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">✔️ Completed:</span>
                        <span className="font-semibold text-gray-900">{stats.byStatus.completed}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">⚠️ Overdue:</span>
                        <span className="font-semibold text-red-600">{stats.byStatus.overdue}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">❌ Rejected:</span>
                        <span className="font-semibold text-gray-900">{stats.byStatus.rejected}</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Table */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Priority Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">🟢 Low:</span>
                        <span className="font-semibold text-gray-900">{stats.byPriority.low}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">🔵 Medium:</span>
                        <span className="font-semibold text-gray-900">{stats.byPriority.medium}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">🟠 High:</span>
                        <span className="font-semibold text-gray-900">{stats.byPriority.high}</span>
                      </div>
                      <div className="flex justify-between p-2 hover:bg-gray-100 rounded">
                        <span className="text-gray-900">🔴 Urgent:</span>
                        <span className="font-semibold text-gray-900">{stats.byPriority.urgent}</span>
                      </div>
                    </div>
                    {stats.completion.averageCompletionTime && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-gray-900">Average Completion Time:</span>
                          <span className="font-semibold text-gray-900">
                            {parseFloat(stats.completion.averageCompletionTime).toFixed(1)} hours
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Most Productive Days */}
                {stats.mostProductiveDays && stats.mostProductiveDays.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">🏆 Most Productive Days</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {stats.mostProductiveDays.map((day: any) => (
                        <div key={day.day} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                          <span className="font-medium text-gray-900">{day.day}</span>
                          <span className="text-lg font-bold text-green-600">{day.tasksCompleted} tasks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No todos found. Create your first todo!
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className={`font-semibold text-lg ${todo.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.title}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                      {todo.priority}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(todo.status)}`}>
                      {getStatusLabel(todo.status)}
                    </span>
                    {todo.isSelfCreated && todo.status === 'PENDING_APPROVAL' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Awaiting Approval
                      </span>
                    )}
                  </div>
                  
                  {todo.description && (
                    <p className={`text-gray-600 mt-1 text-sm ${todo.status === 'COMPLETED' ? 'line-through' : ''}`}>
                      {todo.description}
                    </p>
                  )}
                  
                  {todo.completionNotes && todo.status === 'PENDING_APPROVAL' && (
                    <p className="text-sm text-purple-600 mt-1">
                      Completion notes: {todo.completionNotes}
                    </p>
                  )}
                  
                  {todo.rejectionReason && todo.status === 'REJECTED' && (
                    <p className="text-sm text-red-600 mt-1">
                      Rejection reason: {todo.rejectionReason}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    {todo.dueDate && (
                      <span>Due: {new Date(todo.dueDate).toLocaleDateString()}</span>
                    )}
                    {todo.user && todo.user.id !== userId && (
                      <span>Assigned to: {todo.user.name}</span>
                    )}
                    {todo.assignedBy && todo.assignedBy.id !== userId && (
                      <span>Assigned by: {todo.assignedBy.name}</span>
                    )}
                    {todo.createdAt && (
                      <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4 flex-wrap gap-2">
                  {canUserComplete(todo) && (
                    <button
                      onClick={() => {
                        const notes = prompt('Add completion notes (optional):');
                        handleMarkComplete(todo.id, notes || undefined);
                      }}
                      className="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      Complete
                    </button>
                  )}
                  
                  {canUserApprove(todo) && (
                    <>
                      <button
                        onClick={() => handleApprove(todo.id)}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) handleReject(todo.id, reason);
                        }}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {canUserReopen(todo) && (
                    <button
                      onClick={() => handleReopen(todo.id)}
                      className="text-orange-600 hover:text-orange-900 text-sm font-medium"
                    >
                      Reopen
                    </button>
                  )}
                  
                  <Link
                    href={`/todos/${todo.id}`}
                    className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                  >
                    View
                  </Link>
                  
                  {canUserDelete(todo) && (
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}