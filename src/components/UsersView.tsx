import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Mail, 
  Key, 
  Check, 
  X, 
  Sliders,
  CheckCircle2,
  Lock,
  Info,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, UserRole, ModulePermissions } from '../types';
import { createNewUser, updateUserRoleAndPermissions, deleteUserRecord } from '../services/dataService';

interface UsersViewProps {
  usersList: UserProfile[];
}

export const UsersView: React.FC<UsersViewProps> = ({ usersList }) => {
  const { role, userProfile } = useAuth();
  const isAdmin = role === 'admin';

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);

  // New User Form
  const [formData, setFormData] = useState({
    userIdCode: `USR-${Math.floor(100 + Math.random() * 900)}`,
    displayName: '',
    email: '',
    role: 'editor' as UserRole,
    designation: 'Pastry Kitchen Supervisor',
    department: 'Central Kitchen & Logistics',
    permissions: {
      dashboard: { view: true, edit: false },
      inventory: { view: true, edit: true },
      forms: { view: true, edit: true },
      outlets: { view: true, edit: true },
      users: { view: false, edit: false },
      roles: { view: false, edit: false },
      reports: { view: true, edit: false }
    }
  });

  const handleRoleChangeInForm = (newRole: UserRole) => {
    let perms: ModulePermissions;
    if (newRole === 'admin') {
      perms = {
        dashboard: { view: true, edit: true },
        inventory: { view: true, edit: true },
        forms: { view: true, edit: true },
        outlets: { view: true, edit: true },
        users: { view: true, edit: true },
        roles: { view: true, edit: true },
        reports: { view: true, edit: true }
      };
    } else if (newRole === 'editor') {
      perms = {
        dashboard: { view: true, edit: false },
        inventory: { view: true, edit: true },
        forms: { view: true, edit: true },
        outlets: { view: true, edit: true },
        users: { view: true, edit: false },
        roles: { view: true, edit: false },
        reports: { view: true, edit: false }
      };
    } else {
      perms = {
        dashboard: { view: true, edit: false },
        inventory: { view: true, edit: false },
        forms: { view: true, edit: false },
        outlets: { view: true, edit: false },
        users: { view: false, edit: false },
        roles: { view: false, edit: false },
        reports: { view: true, edit: false }
      };
    }

    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: perms,
      designation: newRole === 'admin' ? 'QA Executive / Admin' : newRole === 'editor' ? 'Pastry Kitchen Supervisor' : 'Store Auditor'
    }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Admins have authority to create new system users.');
      return;
    }
    setSubmitting(true);
    setCreationSuccess(null);
    try {
      await createNewUser({
        uid: `usr-${Date.now()}`,
        userIdCode: formData.userIdCode,
        displayName: formData.displayName,
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        designation: formData.designation,
        department: formData.department,
        permissions: formData.permissions,
        createdAt: new Date().toISOString()
      });
      
      const createdMsg = `Staff account created successfully! User ID: ${formData.userIdCode} • Assigned Role: ${formData.role.toUpperCase()} (${formData.displayName})`;
      setCreationSuccess(createdMsg);
      setShowAddModal(false);

      // Reset form with new generated code
      setFormData({
        userIdCode: `USR-${Math.floor(100 + Math.random() * 900)}`,
        displayName: '',
        email: '',
        role: 'editor',
        designation: 'Pastry Kitchen Supervisor',
        department: 'Central Kitchen & Logistics',
        permissions: {
          dashboard: { view: true, edit: false },
          inventory: { view: true, edit: true },
          forms: { view: true, edit: true },
          outlets: { view: true, edit: true },
          users: { view: false, edit: false },
          roles: { view: false, edit: false },
          reports: { view: true, edit: false }
        }
      });
    } catch (err: any) {
      alert('Error creating user: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !isAdmin) return;
    setSubmitting(true);
    try {
      await updateUserRoleAndPermissions(
        editingUser.id,
        editingUser.role,
        editingUser.permissions,
        editingUser.userIdCode
      );
      setEditingUser(null);
    } catch (err: any) {
      alert('Error updating user: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to remove user "${name}"?`)) {
      try {
        await deleteUserRecord(id);
      } catch (err: any) {
        alert('Error removing user: ' + err.message);
      }
    }
  };

  const togglePermission = (module: keyof ModulePermissions, type: 'view' | 'edit') => {
    if (editingUser) {
      setEditingUser(prev => {
        if (!prev) return null;
        const currentPerms = (prev.permissions || {}) as any;
        const modulePerms = currentPerms[module] || { view: false, edit: false };
        return {
          ...prev,
          permissions: {
            ...currentPerms,
            [module]: {
              ...modulePerms,
              [type]: !modulePerms[type]
            }
          }
        };
      });
    } else {
      setFormData(prev => {
        const currentPerms = prev.permissions as any;
        const modulePerms = currentPerms[module] || { view: false, edit: false };
        return {
          ...prev,
          permissions: {
            ...currentPerms,
            [module]: {
              ...modulePerms,
              [type]: !modulePerms[type]
            }
          }
        };
      });
    }
  };

  const modulesList: { key: keyof ModulePermissions; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard Module' },
    { key: 'inventory', label: 'Inventory (Batches, Stock, Dates)' },
    { key: 'forms', label: 'Dispatch Forms (BCL/REC/HACCP/32)' },
    { key: 'outlets', label: 'Outlets Directory' },
    { key: 'users', label: 'Users Settings & Creation' },
    { key: 'roles', label: 'Roles Matrix & Security' },
    { key: 'reports', label: 'QA Compliance Reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Users & Role Access Control</h2>
            <span className="text-xs bg-stone-800 px-2 py-0.5 rounded text-amber-400 font-mono">
              {usersList.length} Accounts
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Exclusive administration section: Provision staff accounts with unique User IDs, assign roles (Admin, Editor, Viewer), and manage granular module visibility.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Staff User</span>
          </button>
        ) : (
          <div className="text-xs text-stone-400 flex items-center space-x-1.5 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>User creation is restricted to System Administrators only</span>
          </div>
        )}
      </div>

      {/* Security Rule Information Banner */}
      <div className="bg-stone-850 border border-stone-800 rounded-xl p-4 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-stone-300 leading-relaxed">
          <strong className="text-white">Central Kitchen Security Policy:</strong> In compliance with HACCP access governance, staff cannot self-register from the front login page. Account provisioning and role assignment are strictly restricted to this <strong>Users</strong> module and can only be executed by an authenticated <strong>System Administrator</strong>.
        </div>
      </div>

      {/* Creation Success Banner */}
      {creationSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{creationSuccess}</span>
          </div>
          <button
            onClick={() => setCreationSuccess(null)}
            className="text-emerald-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-850 bg-stone-800/60 text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">User ID Code</th>
                <th className="py-3 px-4">Name & Title</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Accessible Modules</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {usersList.map((user) => {
                const userRole = user.role || 'viewer';
                const perms = user.permissions || {};

                return (
                  <tr key={user.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {user.userIdCode || `USR-${user.id.slice(0, 5)}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{user.displayName}</div>
                      <div className="text-[10px] text-stone-400">{user.designation || 'Staff'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-300 font-mono text-[11px]">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        userRole === 'admin'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : userRole === 'editor'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      }`}>
                        {userRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {['inventory', 'forms', 'outlets', 'reports'].map((mod) => {
                          const canView = userRole === 'admin' || (perms as any)[mod]?.view !== false;
                          const canMod = userRole === 'admin' || (perms as any)[mod]?.edit === true;
                          return (
                            <span
                              key={mod}
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                canMod
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : canView
                                  ? 'bg-stone-800 text-stone-300'
                                  : 'bg-stone-900 text-stone-600 line-through'
                              }`}
                            >
                              {mod} {canMod ? '(E)' : canView ? '(V)' : ''}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-1.5 text-stone-400 hover:text-blue-400 hover:bg-stone-800 rounded transition cursor-pointer"
                              title="Edit User Role & Module Permissions"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.displayName)}
                              className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded transition cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL - STRICTLY ADMINISTRATOR ONLY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Provision New Staff User</h3>
                  <p className="text-[11px] text-stone-400">
                    Administrator authority: assign User ID code & role
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    User ID Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userIdCode}
                    onChange={(e) => setFormData({ ...formData, userIdCode: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    System Role Assignment
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleChangeInForm(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-bold"
                  >
                    <option value="admin">Admin (QA Executive - Full Control)</option>
                    <option value="editor">Editor (Pastry Chef - Inventory & Forms)</option>
                    <option value="viewer">Viewer (Auditor - Read-only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Full Name / Staff Designation
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="e.g. Kasun Silva (Pastry Chef)"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Staff Email Address (for Portal Sign In)
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ksilva@barista.lk"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Module Visibility Configuration */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Module Visibility & Edit Access Levels:</span>
                </label>
                <div className="bg-stone-850 p-3 rounded-xl border border-stone-800 space-y-2">
                  {modulesList.map((m) => {
                    const currentPerm = (formData.permissions as any)[m.key] || { view: false, edit: false };
                    return (
                      <div key={m.key} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60 last:border-b-0">
                        <span className="text-stone-300 font-medium">{m.label}</span>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentPerm.view}
                              onChange={() => togglePermission(m.key, 'view')}
                              className="rounded border-stone-700 bg-stone-800 text-amber-500"
                            />
                            <span className="text-[11px] text-stone-400">View</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currentPerm.edit}
                              onChange={() => togglePermission(m.key, 'edit')}
                              className="rounded border-stone-700 bg-stone-800 text-amber-500"
                            />
                            <span className="text-[11px] text-stone-400">Edit</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Provisioning Account...' : 'Provision User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER ROLE & PERMISSIONS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  Manage Access for {editingUser.displayName}
                </h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    User ID Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.userIdCode || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, userIdCode: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Role Assignment
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-bold focus:outline-none"
                  >
                    <option value="admin">Admin (Full Control)</option>
                    <option value="editor">Editor (Kitchen & Forms)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                </div>
              </div>

              {/* Granular Module Visibility Configuration */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Custom Module Visibility & Edit Permissions:</span>
                </label>
                <div className="bg-stone-850 p-3 rounded-xl border border-stone-800 space-y-2">
                  {modulesList.map((m) => {
                    const currentPerm = (editingUser.permissions as any)?.[m.key] || { view: false, edit: false };
                    return (
                      <div key={m.key} className="flex items-center justify-between text-xs py-1 border-b border-stone-800/60 last:border-b-0">
                        <span className="text-stone-300 font-medium">{m.label}</span>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!currentPerm.view}
                              onChange={() => togglePermission(m.key, 'view')}
                              className="rounded border-stone-700 bg-stone-800 text-amber-500"
                            />
                            <span className="text-[11px] text-stone-400">View</span>
                          </label>
                          <label className="flex items-center space-x-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!currentPerm.edit}
                              onChange={() => togglePermission(m.key, 'edit')}
                              className="rounded border-stone-700 bg-stone-800 text-amber-500"
                            />
                            <span className="text-[11px] text-stone-400">Edit</span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Role & Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
