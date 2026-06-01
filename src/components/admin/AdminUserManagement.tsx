'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isApproved: boolean;
  isManagedUser?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [allUsersData, pendingUsersData] = await Promise.all([
        authAPI.getAllUsers(),
        authAPI.getPendingUsers(),
      ]);
      // Ensure isApproved is always a boolean to satisfy local User type
      setAllUsers(allUsersData.map(u => ({ ...u, isApproved: !!u.isApproved })));
      setPendingUsers(pendingUsersData.map(u => ({ ...u, isApproved: !!u.isApproved })));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, isApproved: boolean) => {
    try {
      setProcessingUserId(userId);
      const result = await authAPI.approveUser(userId, isApproved);
      setMessage({ type: 'success', text: result.message });
      await fetchUsers(); // Refresh the lists
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update user approval status' });
    } finally {
      setProcessingUserId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'ADMIN' | 'MANAGER' | 'USER') => {
    if (userId === user?.id && newRole !== 'ADMIN') {
      setMessage({ type: 'error', text: 'You cannot demote yourself!' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setProcessingUserId(userId);
      const updatedUser = await authAPI.updateUserRole(userId, newRole);
      setMessage({ type: 'success', text: `User role updated to ${newRole}` });
      await fetchUsers(); // Refresh the lists
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update user role' });
    } finally {
      setProcessingUserId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-black/20">
      <div className="mb-6 border-b border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Pending Approvals ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            All Users ({allUsers.length})
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg p-4 ${
            message.type === 'success'
              ? 'border border-green-500/30 bg-green-500/10 text-green-400'
              : 'border border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-3 text-slate-400">Loading users...</p>
        </div>
      ) : activeTab === 'pending' ? (
        pendingUsers.length === 0 ? (
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="mt-3 text-lg font-semibold text-slate-300">No pending users</p>
            <p className="text-sm text-slate-400">All manager accounts have been approved</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((pendingUser) => (
              <div
                key={pendingUser.id}
                className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {pendingUser.name}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20">
                        Pending Approval
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{pendingUser.email}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>Role: {pendingUser.role}</span>
                      <span>•</span>
                      <span>Requested: {formatDate(pendingUser.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveUser(pendingUser.id, true)}
                      disabled={processingUserId === pendingUser.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingUserId === pendingUser.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveUser(pendingUser.id, false)}
                      disabled={processingUserId === pendingUser.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processingUserId === pendingUser.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left text-sm font-semibold text-slate-400">
                <th className="pb-3 pl-0 pr-4">User</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Joined</th>
                <th className="pb-3 px-4">Last Login</th>
                <th className="pb-3 pr-0 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allUsers.map((userItem) => (
                <tr key={userItem.id} className="group hover:bg-slate-800/50">
                  <td className="py-4 pl-0 pr-4">
                    <div>
                      <div className="font-semibold text-slate-100">{userItem.name}</div>
                      <div className="text-xs text-slate-400">{userItem.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <select
                      value={userItem.role}
                      onChange={(e) =>
                        handleUpdateRole(userItem.id, e.target.value as 'ADMIN' | 'MANAGER' | 'USER')
                      }
                      disabled={processingUserId === userItem.id || userItem.id === user?.id}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-200 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Manager</option>
                      <option value="USER">User</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    {userItem.isApproved ? (
                      <span className="inline-flex items-center rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-300 ring-1 ring-green-400/20">
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/20">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-400">
                    {formatDate(userItem.createdAt)}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-400">
                    {userItem.lastLoginAt ? formatDate(userItem.lastLoginAt) : 'Never'}
                  </td>
                  <td className="py-4 pr-0 text-right">
                    {!userItem.isApproved && userItem.role === 'MANAGER' && (
                      <button
                        onClick={() => handleApproveUser(userItem.id, true)}
                        disabled={processingUserId === userItem.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-400 transition hover:bg-green-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}