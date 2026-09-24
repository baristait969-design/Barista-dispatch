import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Edit, 
  Trash2, 
  Key, 
  Check, 
  X, 
  Sliders, 
  CheckCircle2, 
  Lock, 
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, UserRole, ModulePermissions } from '../types';
import { 
  createNewUser, 
  updateUserRoleAndPermissions, 
  updateUserPassword, 
  deleteUserRecord 
} from '../services/dataService';

interface UsersViewProps {
  usersList: UserProfile[];
}

export const UsersView: React.FC<UsersViewProps> = ({ usersList }) => {
  const { role, userProfile, updateCurrentUserPassword } = useAuth();
  const isAdmin = role === 'admin';

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserProfile | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // General feedback
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // System-generated automatic User ID generator
  const generateSystemUserId = (targetRole: UserRole = 'editor', list: UserProfile[] = usersList) => {
    const rolePrefix = targetRole === 'admin' ? 'ADM' : targetRole === 'editor' ? 'EDT' : 'VIW';
    const numbers = list
      .map(u => {
        const match = u.userIdCode?.match(/\d+/g);
        return match ? parseInt(match[match.length - 1], 10) : 0;
      })
      .filter(n => !isNaN(n) && n > 0);

    const highest = numbers.length > 0 ? Math.max(...numbers) : 3;
    const nextNum = Math.max(highest + 1, list.length + 1);
    return `USR-${rolePrefix}-${String(nextNum).padStart(2, '0')}`;
  };

  // New User Form State
  const [formData, setFormData] = useState(() => ({
    userIdCode: `USR-EDT-${String(Math.max(4, usersList.length + 1)).padStart(2, '0')}`,
    displayName: '',
    email: '',
    password: '123',
    role: 'editor' as UserRole,
    designation: 'Pastry Kitchen Supervisor',
    department: 'Central Kitchen & Logistics',
    permissions: {
      dashboard: { view: true, edit: false },
      inventory: { view: true, edit: true },
      forms: { view: true, edit: true },
      outlets: { view: true, edit: false }, // Only admin can edit outlets
      products: { view: true, edit: false }, // Only admin can edit products
      users: { view: false, edit: false },
      roles: { view: false, edit: false },
      reports: { view: true, edit: false }
    }
  }));

  // Edit User optional password field
  const [editUserPassword, setEditUserPassword] = useState('');

  const handleRoleChangeInForm = (newRole: UserRole) => {
    let perms: ModulePermissions;
    if (newRole === 'admin') {
      perms = {
        dashboard: { view: true, edit: true },
        inventory: { view: true, edit: true },
        forms: { view: true, edit: true },
        outlets: { view: true, edit: true },
        products: { view: true, edit: true },
        users: { view: true, edit: true },
        roles: { view: true, edit: true },
        reports: { view: true, edit: true }
      };
    } else if (newRole === 'editor') {
      perms = {
        dashboard: { view: true, edit: false },
        inventory: { view: true, edit: true },
        forms: { view: true, edit: true },
        outlets: { view: true, edit: false }, // Only admin can edit/add/delete/suspend outlets
        products: { view: true, edit: false }, // Only admin can edit/add/delete/suspend products
        users: { view: true, edit: false },
        roles: { view: true, edit: false },
        reports: { view: true, edit: false }
      };
    } else {
      perms = {
        dashboard: { view: false, edit: false },
        inventory: { view: false, edit: false },
        forms: { view: false, edit: false },
        outlets: { view: false, edit: false },
        products: { view: false, edit: false },
        users: { view: false, edit: false },
        roles: { view: false, edit: false },
        reports: { view: true, edit: false } // Viewer section only report visible and printable
      };
    }

    setFormData(prev => ({
      ...prev,
      role: newRole,
      userIdCode: generateSystemUserId(newRole, usersList),
      permissions: perms,
      designation: newRole === 'admin' ? 'QA Executive / Admin' : newRole === 'editor' ? 'Pastry Kitchen Supervisor' : 'Store Auditor'
    }));
  };

  const handleOpenCreateModal = () => {
    const nextCode = generateSystemUserId(formData.role, usersList);
    setFormData(prev => ({
      ...prev,
      userIdCode: nextCode
    }));
    setShowAddModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Security violation: Only Administrators can create staff users.');
      return;
    }
    setSubmitting(true);
    setActionSuccess(null);
    try {
      // Ensure system generated User ID is always assigned
      const assignedUserIdCode = formData.userIdCode || generateSystemUserId(formData.role, usersList);
      await createNewUser({
        uid: `usr-${Date.now()}`,
        userIdCode: assignedUserIdCode,
        displayName: formData.displayName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim() || '123',
        role: formData.role,
        designation: formData.designation,
        department: formData.department,
        permissions: formData.permissions,
        createdAt: new Date().toISOString()
      });
      
      const createdMsg = `Staff account created! User ID: ${assignedUserIdCode} • Assigned Role: ${formData.role.toUpperCase()} • Password: ${formData.password || '123'}`;
      setActionSuccess(createdMsg);
      setShowAddModal(false);

      // Reset form with new system code for next user
      const nextRole = 'editor';
      setFormData({
        userIdCode: generateSystemUserId(nextRole, [...usersList, { id: 'temp', userIdCode: assignedUserIdCode } as any]),
        displayName: '',
        email: '',
        password: '123',
        role: nextRole,
        designation: 'Pastry Kitchen Supervisor',
        department: 'Central Kitchen & Logistics',
        permissions: {
          dashboard: { view: true, edit: false },
          inventory: { view: true, edit: true },
          forms: { view: true, edit: true },
          outlets: { view: true, edit: false },
          products: { view: true, edit: false },
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
    if (!editingUser || !isAdmin) {
      alert('Security violation: Only Administrators can update user roles and permissions.');
      return;
    }
    setSubmitting(true);
    try {
      await updateUserRoleAndPermissions(
        editingUser.id,
        editingUser.role,
        editingUser.permissions,
        editingUser.userIdCode,
        editUserPassword.trim().length > 0 ? editUserPassword.trim() : undefined
      );

      // If current user's password was updated
      if (editUserPassword.trim().length > 0 && userProfile?.id === editingUser.id) {
        await updateCurrentUserPassword(editUserPassword.trim());
      }

      setActionSuccess(`Permissions and details updated successfully for ${editingUser.displayName}!`);
      setEditingUser(null);
      setEditUserPassword('');
    } catch (err: any) {
      alert('Error updating user: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!isAdmin) {
      alert('Security violation: Only Administrators can change staff passwords.');
      return;
    }

    if (newPassword.trim().length === 0) {
      setPasswordError('Please enter a valid password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please re-check.');
      return;
    }

    setSubmitting(true);
    setPasswordError(null);

    try {
      await updateUserPassword(passwordModalUser.id, newPassword.trim());

      // If updating current logged in user's password
      if (userProfile && (userProfile.id === passwordModalUser.id || userProfile.email === passwordModalUser.email)) {
        await updateCurrentUserPassword(newPassword.trim());
      }

      setActionSuccess(`Password successfully changed for ${passwordModalUser.displayName} (${passwordModalUser.email})! New password is now active.`);
      setPasswordModalUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError('Failed to change password: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isAdmin) {
      alert('Security violation: Only Administrators can remove users.');
      return;
    }
    if (confirm(`Are you sure you want to remove user "${name}"?`)) {
      try {
        await deleteUserRecord(id);
        setActionSuccess(`User "${name}" has been removed from the system.`);
      } catch (err: any) {
        alert('Error removing user: ' + err.message);
      }
    }
  };

  const togglePermission = (module: keyof ModulePermissions, type: 'view' | 'edit') => {
    if (!isAdmin) return; // Strictly Administrator only

    if (module === 'outlets' && type === 'edit') {
      alert('Security Policy: Only Administrators can create, edit, suspend, or delete retail outlets.');
      return;
    }

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
    { key: 'products', label: 'Products Master Catalog' },
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
            Exclusive administration section: Provision accounts, change passwords, and configure role permissions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick password change for currently signed-in user / Administrator */}
          {userProfile && (
            <button
              onClick={() => {
                setPasswordModalUser(userProfile);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError(null);
              }}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-750 border border-stone-700 hover:border-amber-500/50 text-stone-200 font-medium rounded-lg text-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Change My Password</span>
            </button>
          )}

          {isAdmin ? (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Staff User</span>
            </button>
          ) : (
            <div className="text-xs text-stone-400 flex items-center space-x-1.5 bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Only Administrator can manage permissions</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Rule Information Banner */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
        isAdmin 
          ? 'bg-stone-900 border-stone-800 text-stone-300' 
          : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
      }`}>
        {isAdmin ? (
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          <strong className="text-white">Access Governance:</strong>{' '}
          {isAdmin ? (
            <span>
              You are signed in as <strong>Administrator ({userProfile?.email})</strong>. You have exclusive authority to create staff accounts, change/reset passwords for any user, and adjust granular module permissions.
            </span>
          ) : (
            <span>
              <strong>Read-Only View:</strong> You are signed in with the <strong>{role.toUpperCase()}</strong> role. Modifying user permissions, changing passwords, and creating accounts are strictly restricted to <strong>Administrator</strong> accounts.
            </span>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
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
                <th className="py-3 px-4">Password Status</th>
                <th className="py-3 px-4">Accessible Modules</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {usersList.map((user) => {
                const userRole = user.role || 'viewer';
                const perms = user.permissions || {};
                const isCurrentUser = userProfile?.id === user.id || userProfile?.email === user.email;

                return (
                  <tr key={user.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {user.userIdCode || `USR-${user.id.slice(0, 5)}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center space-x-1.5">
                        <span>{user.displayName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-normal">
                            You
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center space-x-1.5">
                        <span className="text-stone-400 font-mono text-[11px]">••••••••</span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setPasswordModalUser(user);
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError(null);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                            title="Change password for this user"
                          >
                            Change
                          </button>
                        )}
                      </div>
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
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                setPasswordModalUser(user);
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordError(null);
                              }}
                              className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition cursor-pointer"
                              title="Change User Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditUserPassword('');
                              }}
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
                        ) : (
                          <span className="text-[10px] text-stone-600 flex items-center space-x-1">
                            <Lock className="w-3 h-3" />
                            <span>Protected</span>
                          </span>
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

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Change Staff Password</h3>
                  <p className="text-[11px] text-stone-400">
                    Target User: <strong className="text-amber-300">{passwordModalUser.displayName}</strong> ({passwordModalUser.email})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPasswordModalUser(null)} 
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-200 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (e.g. 123)"
                    className="w-full px-3 py-2 pr-9 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 text-[11px] text-stone-400 bg-stone-850 p-2.5 rounded-lg border border-stone-800">
                The updated password will take effect immediately for staff portal login.
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating Password...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL - ADMINISTRATOR ONLY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Provision New Staff User</h3>
                  <p className="text-[11px] text-stone-400">
                    Administrator authority: assign User ID code, password, & role
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center justify-between">
                    <span>User ID Code</span>
                    <span className="text-[10px] text-amber-400 font-medium flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>System Generated</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={formData.userIdCode}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-amber-400 font-mono font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
                    title="User ID is automatically generated by the system and cannot be manually modified"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Automatically assigned system identifier</p>
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
                    <option value="admin">Admin (Full Control & User Management)</option>
                    <option value="editor">Editor (Kitchen & Forms Creation)</option>
                    <option value="viewer">Viewer (Read-Only Audit)</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Staff Email Address (for Login)
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ksilva@barista.lk"
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Default: 123"
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  Manage Access for {editingUser.displayName}
                </h3>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-stone-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center justify-between">
                    <span>User ID Code</span>
                    <span className="text-[10px] text-amber-400 font-medium flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Permanent & Locked</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={editingUser.userIdCode || `USR-${editingUser.id.slice(0, 5)}`}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-xs text-amber-400 font-mono font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
                    title="Once a user is created, their User ID cannot be changed by any person"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Permanent ID cannot be modified after creation</p>
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

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Change Password (Optional)
                </label>
                <input
                  type="text"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="Leave empty to keep existing password, or enter new"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none"
                />
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
