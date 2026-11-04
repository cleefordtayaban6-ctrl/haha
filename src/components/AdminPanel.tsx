import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  KeyRound,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth, ROOT_ADMIN_EMAIL } from '../context/AuthContext';
import { UserProfile, UserRole, UserStatus } from '../types';

export const AdminPanel: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New user provision modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [newEmail, setNewEmail] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('solver');

  // Load all users from Firestore
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const path = 'users';
    setLoading(true);

    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const userList: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          userList.push({
            uid: docSnap.id,
            email: d.email || 'unknown',
            displayName: d.displayName || 'No Name',
            photoURL: d.photoURL,
            role: (d.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) ? 'admin' : (d.role || 'viewer'),
            status: d.status || 'active',
            createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
            lastLoginAt: d.lastLoginAt?.toDate ? d.lastLoginAt.toDate().toISOString() : (d.lastLoginAt || new Date().toISOString()),
            canShareScreen: d.canShareScreen ?? true,
            canGenerateText: d.canGenerateText ?? true,
            notes: d.notes || '',
          });
        });

        // Always ensure root admin is present in list if not yet written
        const hasRoot = userList.some(u => u.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase());
        if (!hasRoot && currentUser?.email?.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
          userList.unshift({
            uid: currentUser.uid,
            email: ROOT_ADMIN_EMAIL,
            displayName: currentUser.displayName || 'Root Administrator',
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            canShareScreen: true,
            canGenerateText: true,
            notes: 'Primary System Administrator',
          });
        }

        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, currentUser]);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole, userEmail: string) => {
    if (userEmail.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      showNotification('The root administrator role cannot be downgraded.', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Updated role for ${userEmail} to ${newRole}.`, 'success');
    } catch (err: any) {
      showNotification(`Failed to update role: ${err.message}`, 'error');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus, userEmail: string) => {
    if (userEmail.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      showNotification('The root administrator account cannot be suspended.', 'error');
      return;
    }

    const newStatus: UserStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Account for ${userEmail} is now ${newStatus}.`, 'success');
    } catch (err: any) {
      showNotification(`Failed to toggle status: ${err.message}`, 'error');
    }
  };

  const handleTogglePermission = async (userId: string, permissionKey: 'canShareScreen' | 'canGenerateText', currentValue: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        [permissionKey]: !currentValue,
        updatedAt: serverTimestamp(),
      });
      showNotification(`Updated permission for user.`, 'success');
    } catch (err: any) {
      showNotification(`Permission update failed: ${err.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      showNotification('Cannot delete root administrator account.', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to remove user ${userEmail}? This will revoke their access.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      showNotification(`User ${userEmail} removed.`, 'success');
    } catch (err: any) {
      showNotification(`Failed to delete user: ${err.message}`, 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showNotification('Please enter a valid Google email.', 'error');
      return;
    }

    try {
      const generatedId = 'user_' + Math.random().toString(36).substring(2, 10);
      await setDoc(doc(db, 'users', generatedId), {
        uid: generatedId,
        email: newEmail.trim().toLowerCase(),
        displayName: newName.trim() || newEmail.split('@')[0],
        role: newRole,
        status: 'active',
        canShareScreen: true,
        canGenerateText: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        notes: 'Pre-provisioned by Administrator',
      });

      showNotification(`User ${newEmail} successfully registered with role ${newRole}.`, 'success');
      setNewEmail('');
      setNewName('');
      setIsAddUserOpen(false);
    } catch (err: any) {
      showNotification(`Failed to register user: ${err.message}`, 'error');
    }
  };

  // Guard for non-admins
  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
          User management is strictly designated for the platform administrator (<span className="text-amber-400 font-mono font-medium">{ROOT_ADMIN_EMAIL}</span>).
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 font-mono">
          Current User: {currentUser?.email || 'Unauthenticated'}
        </div>
      </div>
    );
  }

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 lg:px-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Administrator User Management
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ROOT PRIVILEGE
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Designated controller for <span className="text-amber-300 font-mono">{ROOT_ADMIN_EMAIL}</span>. Manage roles, permissions, screen sharing, and generator access.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add / Authorize User</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-medium border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{users.length}</div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Google Auth profiles</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Active Solvers & Presenters</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {users.filter((u) => u.status === 'active' && (u.role === 'solver' || u.role === 'presenter')).length}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Authorized for assistant workflows</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Suspended</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {users.filter((u) => u.status === 'suspended').length}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Access disabled</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Screen OCR Permitted</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            {users.filter((u) => u.canGenerateText).length}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Allowed to trigger generator</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="solver">Solver / Copilot</option>
              <option value="presenter">Presenter / Sharer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">User Account</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-indigo-400" />
                    Loading user registry...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isRoot = u.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

                  return (
                    <tr key={u.uid} className="hover:bg-zinc-900/50 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt=""
                              className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                              {u.displayName}
                              {isRoot && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ROOT ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Selector */}
                      <td className="py-3 px-4">
                        {isRoot ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-500/30 font-mono text-[11px]">
                            <Shield className="w-3 h-3 text-amber-400" />
                            Administrator
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.uid, e.target.value as UserRole, u.email)}
                            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="solver">Solver (Copilot)</option>
                            <option value="presenter">Presenter (Sharer)</option>
                            <option value="viewer">Viewer Only</option>
                          </select>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(u.uid, u.status, u.email)}
                          disabled={isRoot}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                            u.status === 'active'
                              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/80'
                              : 'bg-red-950/50 border-red-500/30 text-red-400 hover:bg-red-950/80'
                          } ${isRoot ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="capitalize">{u.status}</span>
                        </button>
                      </td>

                      {/* Granular Permissions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePermission(u.uid, 'canShareScreen', Boolean(u.canShareScreen))}
                            title="Toggle Screen Share Permission"
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                              u.canShareScreen
                                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-600 line-through'
                            }`}
                          >
                            Share Screen
                          </button>

                          <button
                            onClick={() => handleTogglePermission(u.uid, 'canGenerateText', Boolean(u.canGenerateText))}
                            title="Toggle OCR / Generator Permission"
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                              u.canGenerateText
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-600 line-through'
                            }`}
                          >
                            OCR Gen
                          </button>
                        </div>
                      </td>

                      {/* Last Active */}
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {!isRoot && (
                          <button
                            onClick={() => handleDeleteUser(u.uid, u.email)}
                            title="Delete User"
                            className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Pre-provision User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Authorize New User
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Google Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Full name or alias"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="solver">Solver (Can capture screen & solve questions)</option>
                  <option value="presenter">Presenter (Can share screen)</option>
                  <option value="viewer">Viewer (Can watch shared screen)</option>
                  <option value="admin">Admin (Full administrator permissions)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
                >
                  Authorize User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
