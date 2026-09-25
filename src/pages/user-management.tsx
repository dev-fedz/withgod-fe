import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  CheckCircle2,
  X,
  Lock,
  Mail,
  User as UserIcon,
  Calendar,
  Layers,
  Settings,
  AlertCircle,
  KeyRound,
  UserCheck,
  UserX,
} from 'lucide-react';
import PageLayout from '../components/PageLayout';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface UserAccount {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  can_manage_calendar: boolean;
  can_manage_users: boolean;
  role_names: string[];
  role_ids: string[];
  permissions_list: string[];
  created_at: string;
}

interface RoleItem {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  users_count: number;
  permissions_count: number;
  role_modules?: Array<{
    id: string;
    module: string;
    module_name: string;
    module_codename: string;
    permissions: Array<{ id: string; codename: string; label: string }>;
  }>;
  created_at: string;
}

interface ModuleItem {
  id: string;
  name: string;
  codename: string;
  category: string;
  description: string;
  permissions: Array<{ id: string; codename: string; label: string }>;
}

export default function UserManagementPage() {
  const router = useRouter();
  const { user, refreshUser } = useApp();

  const [activeTab, setActiveTab] = useState<'accounts' | 'roles' | 'matrix'>('accounts');
  const [usersList, setUsersList] = useState<UserAccount[]>([]);
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [modulesList, setModulesList] = useState<ModuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // User Account Modal (Create / Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userIsActive, setUserIsActive] = useState(true);
  const [userIsStaff, setUserIsStaff] = useState(false);
  const [userCanManageCalendar, setUserCanManageCalendar] = useState(false);
  const [userSelectedRoleIds, setUserSelectedRoleIds] = useState<string[]>([]);

  // Role Modal (Create / Edit & Permissions Matrix)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleSelectedPermIds, setRoleSelectedPermIds] = useState<string[]>([]);

  // Assign Roles Quick Modal
  const [isAssignRolesModalOpen, setIsAssignRolesModalOpen] = useState(false);
  const [assigningUser, setAssigningUser] = useState<UserAccount | null>(null);
  const [quickRoleIds, setQuickRoleIds] = useState<string[]>([]);

  const fetchAllData = async () => {
    if (!user || (!user.is_staff && !user.can_manage_users)) return;
    setIsLoading(true);
    try {
      const [usersData, rolesData, modulesData] = await Promise.all([
        api.getUserAccounts(),
        api.getUserRoles(),
        api.getModules(),
      ]);
      setUsersList(Array.isArray(usersData) ? usersData : []);
      setRolesList(Array.isArray(rolesData) ? rolesData : []);
      setModulesList(Array.isArray(modulesData) ? modulesData : []);
    } catch (err) {
      console.error('Failed to fetch user management data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.is_staff && !user.can_manage_users) {
      router.push('/');
    } else if (user) {
      fetchAllData();
    }
  }, [user]);

  // Open Create User Modal
  const handleOpenCreateUser = () => {
    setEditingUserId(null);
    setUserEmail('');
    setUserPassword('');
    setUserFirstName('');
    setUserLastName('');
    setUserIsActive(true);
    setUserIsStaff(false);
    setUserCanManageCalendar(false);
    setUserSelectedRoleIds([]);
    setIsUserModalOpen(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (account: UserAccount) => {
    setEditingUserId(account.id);
    setUserEmail(account.email);
    setUserPassword('');
    setUserFirstName(account.first_name || '');
    setUserLastName(account.last_name || '');
    setUserIsActive(account.is_active);
    setUserIsStaff(account.is_staff);
    setUserCanManageCalendar(account.can_manage_calendar);
    setUserSelectedRoleIds(account.role_ids || []);
    setIsUserModalOpen(true);
  };

  // Save User Account
  const handleSaveUser = async () => {
    if (!userEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    if (!editingUserId && !userPassword) {
      alert('Please enter a password for the new user');
      return;
    }

    try {
      const payload: any = {
        email: userEmail.trim().toLowerCase(),
        first_name: userFirstName.trim(),
        last_name: userLastName.trim(),
        is_active: userIsActive,
        is_staff: userIsStaff,
        can_manage_calendar: userCanManageCalendar,
        role_ids: userSelectedRoleIds,
      };
      if (userPassword) payload.password = userPassword;

      if (editingUserId) {
        await api.updateUserAccount(editingUserId, payload);
      } else {
        await api.createUserAccount(payload);
      }

      setIsUserModalOpen(false);
      fetchAllData();
      refreshUser();
    } catch (err: any) {
      alert(`Error saving user account: ${err.message || 'Unknown error'}`);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user account "${email}"?`)) return;
    try {
      await api.deleteUserAccount(userId);
      fetchAllData();
    } catch (err: any) {
      alert(`Error deleting user: ${err.message || 'Unknown error'}`);
    }
  };

  // Open Quick Role Assign Modal
  const handleOpenAssignRoles = (account: UserAccount) => {
    setAssigningUser(account);
    setQuickRoleIds(account.role_ids || []);
    setIsAssignRolesModalOpen(true);
  };

  // Save Quick Assigned Roles
  const handleSaveAssignedRoles = async () => {
    if (!assigningUser) return;
    try {
      await api.updateUserAccount(assigningUser.id, {
        role_ids: quickRoleIds,
      });
      setIsAssignRolesModalOpen(false);
      fetchAllData();
      refreshUser();
    } catch (err: any) {
      alert(`Error updating assigned roles: ${err.message || 'Unknown error'}`);
    }
  };

  // Open Create Role Modal
  const handleOpenCreateRole = () => {
    setEditingRoleId(null);
    setRoleName('');
    setRoleDescription('');
    setRoleSelectedPermIds([]);
    setIsRoleModalOpen(true);
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (role: RoleItem) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDescription(role.description || '');

    // Extract all assigned permission IDs
    const permIds: string[] = [];
    role.role_modules?.forEach((rm) => {
      rm.permissions?.forEach((p) => {
        permIds.push(p.id);
      });
    });
    setRoleSelectedPermIds(permIds);
    setIsRoleModalOpen(true);
  };

  // Toggle permission ID in selected list
  const handleTogglePerm = (permId: string) => {
    setRoleSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  // Toggle all permissions for a module
  const handleToggleModulePerms = (mod: ModuleItem) => {
    const modPermIds = mod.permissions.map((p) => p.id);
    const allSelected = modPermIds.every((id) => roleSelectedPermIds.includes(id));

    if (allSelected) {
      setRoleSelectedPermIds((prev) => prev.filter((id) => !modPermIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...roleSelectedPermIds, ...modPermIds]));
      setRoleSelectedPermIds(combined);
    }
  };

  // Save Role & Permissions
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      alert('Please enter a role name');
      return;
    }

    try {
      const payload = {
        name: roleName.trim(),
        description: roleDescription,
        permission_ids: roleSelectedPermIds,
      };

      if (editingRoleId) {
        await api.updateUserRole(editingRoleId, payload);
      } else {
        await api.createUserRole(payload);
      }

      setIsRoleModalOpen(false);
      fetchAllData();
      refreshUser();
    } catch (err: any) {
      alert(`Error saving role: ${err.message || 'Unknown error'}`);
    }
  };

  // Delete Role
  const handleDeleteRole = async (roleId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete role "${name}"?`)) return;
    try {
      await api.deleteUserRole(roleId);
      fetchAllData();
    } catch (err: any) {
      alert(`Error deleting role: ${err.message || 'Unknown error'}`);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (u.full_name || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      if (selectedRoleFilter && !u.role_ids.includes(selectedRoleFilter)) {
        return false;
      }
      if (selectedStatusFilter === 'active' && !u.is_active) return false;
      if (selectedStatusFilter === 'inactive' && u.is_active) return false;
      return true;
    });
  }, [usersList, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  if (!user || (!user.is_staff && !user.can_manage_users)) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-xs text-stone-500">You must have User Management administrative roles to view this page.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        title="User & Role Management"
        items={[{ label: 'User Roles' }]}
        actions={
          activeTab === 'accounts' ? (
            <button
              type="button"
              onClick={handleOpenCreateUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all md:w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User Account</span>
            </button>
          ) : activeTab === 'roles' ? (
            <button
              type="button"
              onClick={handleOpenCreateRole}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all md:w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Role</span>
            </button>
          ) : null
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Tab Switcher */}
        <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'accounts'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'roles'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>User Roles ({rolesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Permissions Matrix</span>
          </button>
        </div>

        {/* TAB 1: USER ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            {/* Search & Filters (Search bar md:w-96 left-aligned) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
              <div className="relative md:w-96">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Role Filter */}
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300"
                >
                  <option value="">All Roles</option>
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="py-20 text-center text-stone-400 text-xs">Loading user accounts...</div>
            ) : filteredUsers.length > 0 ? (
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-stone-100 dark:border-stone-800 text-stone-400 uppercase tracking-wider text-[10px] bg-stone-50/50 dark:bg-stone-950/50">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">User</th>
                      <th className="py-3.5 px-4 font-bold">Assigned Roles</th>
                      <th className="py-3.5 px-4 font-bold">Privileges</th>
                      <th className="py-3.5 px-4 font-bold">Status</th>
                      <th className="py-3.5 px-4 font-bold">Joined</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {filteredUsers.map((account) => (
                      <tr key={account.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                              {account.first_name ? account.first_name[0].toUpperCase() : account.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-stone-900 dark:text-stone-100">{account.full_name}</p>
                              <p className="text-[11px] text-stone-400">{account.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {account.role_names && account.role_names.length > 0 ? (
                              account.role_names.map((rName) => (
                                <span
                                  key={rName}
                                  className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-semibold border border-stone-200 dark:border-stone-700"
                                >
                                  {rName}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400 text-[11px] italic">No role assigned</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {account.is_superuser && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
                                Superuser
                              </span>
                            )}
                            {account.is_staff && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[10px] font-bold">
                                Staff
                              </span>
                            )}
                            {account.can_manage_calendar && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" /> Calendar Admin
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {account.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-[11px] text-stone-400">
                          {account.created_at ? account.created_at.slice(0, 10) : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAssignRoles(account)}
                              title="Assign Roles"
                              className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3 text-amber-500" />
                              <span>Roles</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(account)}
                              title="Edit User"
                              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {!account.is_superuser && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(account.id, account.email)}
                                title="Delete User"
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
                No user accounts found matching your filters.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER ROLES */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolesList.map((role) => (
                <div
                  key={role.id}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-500" />
                        {role.name}
                      </h4>
                      {role.is_system && (
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 text-[10px] font-semibold">
                          System Role
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-serif">
                      {role.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center gap-3 pt-2 text-[11px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        <b>{role.users_count || 0}</b> users
                      </span>
                      <span className="flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-500" />
                        <b>{role.permissions_count || 0}</b> permissions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRole(role)}
                      className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configure Permissions
                    </button>

                    {!role.is_system && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PERMISSIONS MATRIX OVERVIEW */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">System Permissions & Modules Architecture</p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                  Modules represent major subsystems in WithGod. You can assign granular permissions to any custom or system role.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modulesList.map((mod) => (
                <div
                  key={mod.id}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">{mod.name}</h4>
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
                        {mod.codename}
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                      {mod.permissions.length} perms
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 dark:text-stone-400 font-serif leading-relaxed">
                    {mod.description}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Available Permissions:
                    </span>
                    {mod.permissions.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 text-xs text-stone-700 dark:text-stone-300"
                      >
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="font-medium truncate">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* USER ACCOUNT MODAL (Create / Edit)                        */}
      {/* ========================================================= */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUserId ? 'Edit User Account' : 'Create User Account'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">First Name</label>
              <input
                type="text"
                placeholder="First name..."
                value={userFirstName}
                onChange={(e) => setUserFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Last Name</label>
              <input
                type="text"
                placeholder="Last name..."
                value={userLastName}
                onChange={(e) => setUserLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">
              {editingUserId ? 'Change Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
            />
          </div>

          {/* Assign Roles checklist */}
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Assign Roles</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rolesList.map((r) => {
                const isChecked = userSelectedRoleIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setUserSelectedRoleIds((prev) =>
                          isChecked ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                        );
                      }}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">{r.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Special Privileges / Flags */}
          <div className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Account Privileges & Flags</span>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-stone-700 dark:text-stone-300">Can Manage Calendar (Full Google Calendar features)</span>
              <input
                type="checkbox"
                checked={userCanManageCalendar}
                onChange={(e) => setUserCanManageCalendar(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-stone-700 dark:text-stone-300">Staff / Administrator Status</span>
              <input
                type="checkbox"
                checked={userIsStaff}
                onChange={(e) => setUserIsStaff(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-stone-700 dark:text-stone-300">Account Active (Allow Login)</span>
              <input
                type="checkbox"
                checked={userIsActive}
                onChange={(e) => setUserIsActive(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUser}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              Save User Account
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* QUICK ASSIGN ROLES MODAL                                  */}
      {/* ========================================================= */}
      <Modal
        isOpen={isAssignRolesModalOpen}
        onClose={() => setIsAssignRolesModalOpen(false)}
        title={`Assign Roles to ${assigningUser?.full_name || 'User'}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Select which roles this user belongs to. Their effective permissions will be the combined set of all assigned roles.
          </p>

          <div className="space-y-2">
            {rolesList.map((r) => {
              const isChecked = quickRoleIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/50'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setQuickRoleIds((prev) =>
                        isChecked ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                      );
                    }}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-xs text-stone-900 dark:text-stone-100">{r.name}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{r.description}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsAssignRolesModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAssignedRoles}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              Save Assigned Roles
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* ROLE & PERMISSIONS MATRIX MODAL (Create / Edit Role)      */}
      {/* ========================================================= */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRoleId ? 'Configure Role & Permissions' : 'Create New User Role'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Role Name</label>
              <input
                type="text"
                placeholder="e.g. Calendar Manager, Lead Pastor, Scholar..."
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm font-bold border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200"
              />
            </div>

            <div>
              <label className="text-[10px] text-stone-400 uppercase font-bold block mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Describe role responsibilities and privileges..."
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-serif text-stone-800 dark:text-stone-200"
              />
            </div>
          </div>

          {/* Module Permissions Matrix */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Module Permissions Matrix</span>
              </span>
              <span className="text-[11px] font-semibold text-stone-400">
                {roleSelectedPermIds.length} permissions enabled
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {modulesList.map((mod) => {
                const modPermIds = mod.permissions.map((p) => p.id);
                const allSelected = modPermIds.length > 0 && modPermIds.every((id) => roleSelectedPermIds.includes(id));

                return (
                  <div
                    key={mod.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-stone-900 dark:text-stone-100">{mod.name}</h5>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{mod.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleModulePerms(mod)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                          allSelected
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900'
                        }`}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {mod.permissions.map((perm) => {
                        const isChecked = roleSelectedPermIds.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-white dark:bg-stone-950 border-amber-500/60 shadow-2xs'
                                : 'bg-white/60 dark:bg-stone-950/60 border-stone-200/80 dark:border-stone-800 opacity-75'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePerm(perm.id)}
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <span className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                              {perm.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-200 dark:border-stone-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRole}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            >
              Save Role & Permissions
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
