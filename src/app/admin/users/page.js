'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchLoading(true);
        setSearchTerm(searchInput);
        setCurrentPage(1); // Reset to first page when search changes
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, searchTerm]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [session, status, router, currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setSearchLoading(false);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setSearchLoading(false);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      confirmText: '',
      onConfirm: null
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Change User Role',
      message: `Are you sure you want to change ${user.name}'s role from ${user.role} to ${newRole}?`,
      confirmText: 'Change Role',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: newRole }),
          });

          if (response.ok) {
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user._id === userId ? { ...user, role: newRole } : user
              )
            );
          } else {
            const error = await response.json();
            setConfirmModal({
              isOpen: true,
              type: 'danger',
              title: 'Error',
              message: error.error || 'Failed to update user role',
              confirmText: 'OK',
              onConfirm: closeConfirmModal
            });
            return;
          }
        } catch (error) {
          console.error('Error updating user role:', error);
          setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Error',
            message: 'Failed to update user role',
            confirmText: 'OK',
            onConfirm: closeConfirmModal
          });
          return;
        }
        closeConfirmModal();
      }
    });
  };

  const handleBlockUser = async (userId, block) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      type: block ? 'danger' : 'warning',
      title: block ? 'Block User' : 'Unblock User',
      message: `Are you sure you want to ${block ? 'block' : 'unblock'} ${user.name}?`,
      confirmText: block ? 'Block User' : 'Unblock User',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}/block`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isBlocked: block }),
          });

          if (response.ok) {
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user._id === userId ? { ...user, isBlocked: block } : user
              )
            );
          } else {
            const error = await response.json();
            setConfirmModal({
              isOpen: true,
              type: 'danger',
              title: 'Error',
              message: error.error || 'Failed to update user status',
              confirmText: 'OK',
              onConfirm: closeConfirmModal
            });
            return;
          }
        } catch (error) {
          console.error('Error updating user status:', error);
          setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Error',
            message: 'Failed to update user status',
            confirmText: 'OK',
            onConfirm: closeConfirmModal
          });
          return;
        }
        closeConfirmModal();
      }
    });
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
      confirmText: 'Delete User',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
          } else {
            const error = await response.json();
            setConfirmModal({
              isOpen: true,
              type: 'danger',
              title: 'Error',
              message: error.error || 'Failed to delete user',
              confirmText: 'OK',
              onConfirm: closeConfirmModal
            });
            return;
          }
        } catch (error) {
          console.error('Error deleting user:', error);
          setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: 'Error',
            message: 'Failed to delete user',
            confirmText: 'OK',
            onConfirm: closeConfirmModal
          });
          return;
        }
        closeConfirmModal();
      }
    });
  };

  const getRoleDisplay = (role) => {
    const roleConfig = {
      admin: { label: 'Admin', color: 'bg-[#B936F4]/20 text-[#B936F4] border-[#B936F4]/30' },
      manager: { label: 'Manager', color: 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30' },
      writer: { label: 'Writer', color: 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30' },
      user: { label: 'User', color: 'bg-[#00FFE0]/20 text-[#00FFE0] border-[#00FFE0]/30' }
    };
    return roleConfig[role] || roleConfig.user;
  };

  const canManageRole = (targetUserRole) => {
    if (session?.user?.role === 'admin') return true;
    if (session?.user?.role === 'manager') {
      // Managers cannot manage admin roles or other manager roles
      return targetUserRole !== 'admin' && targetUserRole !== 'manager';
    }
    return false;
  };

  const canDeleteUser = (userRole) => {
    if (session?.user?.role === 'admin') return true;
    if (session?.user?.role === 'manager') {
      // Managers cannot delete admins or other managers
      return userRole !== 'admin' && userRole !== 'manager';
    }
    return false;
  };

  const canBlockUser = (userRole) => {
    if (session?.user?.role === 'admin') return true;
    if (session?.user?.role === 'manager') {
      // Managers cannot block admins or other managers
      return userRole !== 'admin' && userRole !== 'manager';
    }
    return false;
  };

  const getAvailableRoles = (currentUserRole) => {
    if (session?.user?.role === 'admin') {
      return ['user', 'writer', 'manager', 'admin'];
    }
    if (session?.user?.role === 'manager') {
      // Managers can only assign user or writer roles
      return ['user', 'writer'];
    }
    return [];
  };

  if (status === 'loading' || (loading && isInitialLoad)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="w-48 h-8 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                <div className="w-64 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-32 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
            </div>

            {/* Filters Skeleton */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="w-16 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                  <div className="w-full h-10 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                </div>
                <div>
                  <div className="w-12 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                  <div className="w-full h-10 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                </div>
                <div>
                  <div className="w-16 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                  <div className="w-full h-10 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex items-end">
                  <div className="w-full h-10 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Users Table Skeleton */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0A0F24]/50">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <div className="w-12 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="w-16 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="w-12 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="w-16 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="w-16 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <div className="w-20 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#00FFE0]/10">
                    {[...Array(8)].map((_, index) => (
                      <tr key={index} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#00FFE0]/10 rounded-full"></div>
                            <div>
                              <div className="w-24 h-4 bg-[#00FFE0]/10 rounded-lg mb-1"></div>
                              <div className="w-20 h-3 bg-[#00FFE0]/10 rounded-lg"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-32 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-16 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-16 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-20 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Error Loading Users</h2>
            <p className="text-[#CFCFCF] mb-6">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5]">User Management</h1>
              <p className="text-[#CFCFCF]">Manage user accounts, roles, and permissions</p>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/admin/users/history"
                className="flex items-center gap-2 px-4 py-3 bg-[#B936F4]/20 backdrop-blur-lg border border-[#B936F4]/20 text-[#B936F4] rounded-xl hover:border-[#B936F4]/40 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <ClockIcon className="w-5 h-5" />
                History
              </Link>
              <Link 
                href="/admin"
                className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Admin
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Search users by name or email">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by user role">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="writer">Writer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by user status">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                                      onClick={() => {
                      setSearchInput('');
                      setSearchTerm('');
                      setRoleFilter('all');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                  className="w-full px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="relative bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden">
            {searchLoading && (
              <div className="absolute inset-0 bg-[#0A0F24]/70 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 px-6 py-3 bg-[#0A0F24]/90 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl">
                  <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#F5F5F5] text-sm">Searching...</span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A0F24]/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#F5F5F5] cursor-help" title="User information">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#F5F5F5] cursor-help" title="Email address">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#F5F5F5] cursor-help" title="User role">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#F5F5F5] cursor-help" title="Account status">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#F5F5F5] cursor-help" title="Join date">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#F5F5F5] cursor-help" title="Available actions">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#00FFE0]/10">
                  {users.map((user) => {
                    const roleDisplay = getRoleDisplay(user.role);
                    const availableRoles = getAvailableRoles(user.role);
                    return (
                      <tr key={user._id} className="hover:bg-[#0A0F24]/30 transition-all duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00FFE0]/20 flex items-center justify-center cursor-help" title={user.name}>
                              {user.image ? (
                                <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <UserIcon className="w-5 h-5 text-[#00FFE0]" />
                              )}
                            </div>
                            <div className="cursor-text select-text">
                              <p className="text-[#F5F5F5] font-medium">{user.name}</p>
                              {user.profession && (
                                <p className="text-[#CFCFCF] text-sm">{user.profession}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 cursor-text select-text">
                            <EnvelopeIcon className="w-4 h-4 text-[#CFCFCF]" />
                            <span className="text-[#CFCFCF]">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={!canManageRole(user.role)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border ${roleDisplay.color} transition-all duration-200 ${
                              canManageRole(user.role) 
                                ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
                                : 'cursor-not-allowed opacity-60'
                            }`}
                            title={canManageRole(user.role) ? 'Change user role' : 'Cannot modify this role'}
                          >
                            {availableRoles.map(role => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                            {/* Show current role even if not in available roles for display */}
                            {!availableRoles.includes(user.role) && (
                              <option value={user.role} disabled>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </option>
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.isBlocked ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm border border-red-500/30 cursor-help" title="User is blocked">
                                <EyeSlashIcon className="w-3 h-3" />
                                Blocked
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30 cursor-help" title="User is active">
                                <EyeIcon className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 cursor-help" title={`Joined on ${new Date(user.createdAt).toLocaleDateString()}`}>
                            <CalendarIcon className="w-4 h-4 text-[#CFCFCF]" />
                            <span className="text-[#CFCFCF]">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {canBlockUser(user.role) && (
                              <button
                                onClick={() => handleBlockUser(user._id, !user.isBlocked)}
                                className={`p-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
                                  user.isBlocked
                                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                }`}
                                title={user.isBlocked ? 'Unblock User' : 'Block User'}
                              >
                                {user.isBlocked ? <CheckIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                              </button>
                            )}
                            
                            {canDeleteUser(user.role) && (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 cursor-pointer hover:scale-105"
                                title="Delete User"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-[#00FFE0]/10">
                <div className="flex items-center justify-between">
                  <p className="text-[#CFCFCF] text-sm cursor-help" title={`Showing page ${currentPage} of ${totalPages}`}>
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#F5F5F5] rounded-lg hover:border-[#00FFE0]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105"
                      title={currentPage === 1 ? "Already on first page" : "Go to previous page"}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#F5F5F5] rounded-lg hover:border-[#00FFE0]/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105"
                      title={currentPage === totalPages ? "Already on last page" : "Go to next page"}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#0A0F24]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserIcon className="w-12 h-12 text-[#00FFE0]" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">No Users Found</h3>
              <p className="text-[#CFCFCF]">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
        />
      </div>
    </Layout>
  );
} 
