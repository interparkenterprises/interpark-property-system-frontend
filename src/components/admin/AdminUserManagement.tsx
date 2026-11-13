'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Check, CheckCircle2, Clock3, Loader2, Users, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const [fetchError, setFetchError] = useState(false);
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
      setFetchError(false);
      const [allUsersData, pendingUsersData] = await Promise.all([
        authAPI.getAllUsers(),
        authAPI.getPendingUsers(),
      ]);
      // Ensure isApproved is always a boolean to satisfy local User type
      setAllUsers(allUsersData.map(u => ({ ...u, isApproved: !!u.isApproved })));
      setPendingUsers(pendingUsersData.map(u => ({ ...u, isApproved: !!u.isApproved })));
    } catch (error: unknown) {
      setFetchError(true);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to fetch users' });
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
      await authAPI.updateUserRole(userId, newRole);
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

  const loadingState = (
    <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading users…
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Users className="h-5 w-5" aria-hidden="true" /></div>
          <div className="space-y-1.5">
            <CardTitle>User management</CardTitle>
            <CardDescription>Review account requests and manage user access.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && <Alert variant={message.type === 'success' ? 'success' : 'destructive'}>{message.text}</Alert>}
        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as 'pending' | 'all')}>
          <TabsList aria-label="User management">
            <TabsTrigger value="pending">
              <Clock3 className="h-4 w-4" aria-hidden="true" /> Pending approvals
              <Badge variant="neutral">{pendingUsers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              <Users className="h-4 w-4" aria-hidden="true" /> All users
              <Badge variant="neutral">{allUsers.length}</Badge>
            </TabsTrigger>
          </TabsList>
          {(['pending', 'all'] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="pt-3">
              {loading ? loadingState : fetchError ? (
                <EmptyState icon={Users} title="Unable to load users" description="Try again to retrieve the latest accounts and approval requests."
                  action={<Button variant="outline" onClick={() => { setMessage(null); void fetchUsers(); }}>Try again</Button>} />
              ) : tab === 'pending' ? (
                pendingUsers.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="You're all caught up" description="No accounts are waiting for approval. You can review existing accounts in All users."
                    action={<Button variant="outline" size="sm" onClick={() => setActiveTab('all')}>View all users</Button>} />
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map(pendingUser => (
                      <div key={pendingUser.id} className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{pendingUser.name}</h3>
                            <Badge variant="warning">Pending approval</Badge>
                          </div>
                          <p className="break-all text-sm text-muted-foreground">{pendingUser.email}</p>
                          <p className="text-xs text-muted-foreground">{pendingUser.role === 'MANAGER' ? 'Manager' : pendingUser.role === 'ADMIN' ? 'Admin' : 'User'} · Requested {formatDate(pendingUser.createdAt)}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button size="sm" loading={processingUserId === pendingUser.id} disabled={processingUserId !== null} onClick={() => handleApproveUser(pendingUser.id, true)}>
                            {processingUserId !== pendingUser.id && <Check className="h-4 w-4" aria-hidden="true" />} Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" disabled={processingUserId !== null} onClick={() => handleApproveUser(pendingUser.id, false)}>
                            <X className="h-4 w-4" aria-hidden="true" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : allUsers.length === 0 ? (
                <EmptyState icon={Users} title="No users found" description="User accounts will appear here when they are available." />
              ) : (
                <Table>
                  <TableHead>
                    <TableHeader>User</TableHeader><TableHeader>Role</TableHeader><TableHeader>Status</TableHeader>
                    <TableHeader>Joined</TableHeader><TableHeader>Last login</TableHeader><TableHeader className="text-right">Actions</TableHeader>
                  </TableHead>
                  <TableBody>
                    {allUsers.map(userItem => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary" aria-hidden="true">
                              {userItem.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}
                            </div>
                            <div><div className="flex items-center gap-2 font-medium">{userItem.name}{userItem.id === user?.id && <Badge variant="neutral">You</Badge>}</div>
                              <div className="text-xs text-muted-foreground">{userItem.email}</div></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={userItem.role} onValueChange={value => handleUpdateRole(userItem.id, value as User['role'])} disabled={processingUserId !== null || userItem.id === user?.id}>
                            <SelectTrigger className="w-32" aria-label={`Role for ${userItem.name}`}><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="MANAGER">Manager</SelectItem><SelectItem value="USER">User</SelectItem></SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell><Badge variant={userItem.isApproved ? 'success' : 'warning'}>{userItem.isApproved ? 'Approved' : 'Pending'}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(userItem.createdAt)}</TableCell>
                        <TableCell className="text-muted-foreground">{userItem.lastLoginAt ? formatDate(userItem.lastLoginAt) : 'Never'}</TableCell>
                        <TableCell className="text-right">
                          {!userItem.isApproved && userItem.role === 'MANAGER' ? (
                            <Button size="sm" variant="outline" loading={processingUserId === userItem.id} disabled={processingUserId !== null} onClick={() => handleApproveUser(userItem.id, true)}>Approve</Button>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
