import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Store, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  Code, 
  LogOut, 
  Menu, 
  X, 
  ThermometerSnowflake,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { userProfile, role, logout, isSimulated, loginDemoRole, hasAccess } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: hasAccess('dashboard', 'view') },
    { id: 'inventory', label: 'Inventory', icon: Package, visible: hasAccess('inventory', 'view') },
    { id: 'forms', label: 'Dispatch Forms', icon: FileText, visible: hasAccess('forms', 'view') },
    { id: 'outlets', label: 'Outlets', icon: Store, visible: hasAccess('outlets', 'view') },
    { id: 'users', label: 'Users & Access', icon: Users, visible: hasAccess('users', 'view') },
    { id: 'roles', label: 'Roles Matrix', icon: ShieldCheck, visible: hasAccess('roles', 'view') },
    { id: 'reports', label: 'Reports', icon: BarChart3, visible: hasAccess('reports', 'view') },
    { id: 'vscode-guide', label: 'VS Code Guide', icon: Code, visible: true },
  ];

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'editor':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'viewer':
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-stone-900 text-white shadow-md sticky top-0 z-40 border-b border-stone-800">
      {/* Top micro bar for HACCP status and quick demo role switch */}
      <div className="bg-amber-700/30 text-amber-200 text-xs px-4 py-1 flex items-center justify-between border-b border-amber-600/30">
        <div className="flex items-center space-x-2">
          <ThermometerSnowflake className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">HACCP Central Kitchen Compliant</span>
          <span className="hidden sm:inline text-amber-300/80">| Doc No: BCL/REC/HACCP/32 | Transit Temp: ≤5°C</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-stone-300 hidden md:inline">Testing Role:</span>
          <div className="flex items-center space-x-1 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
            <span className="text-[11px] font-medium uppercase text-stone-200">{role}</span>
            <button 
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline ml-1 cursor-pointer"
              title="Switch role to test access permissions for uni presentation"
            >
              Switch Role
            </button>
          </div>
        </div>
      </div>

      {/* Role Switcher Floating Menu */}
      {showRoleSwitcher && (
        <div className="absolute right-4 top-8 bg-stone-800 border border-stone-700 rounded-lg shadow-xl p-3 z-50 w-72 text-sm">
          <div className="font-semibold text-stone-200 mb-1 flex items-center justify-between">
            <span>Presentation Role Switcher</span>
            <button onClick={() => setShowRoleSwitcher(false)} className="text-stone-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-400 mb-2">Switch roles to test how permissions adapt in real time:</p>
          <div className="space-y-1.5">
            <button
              onClick={() => { loginDemoRole('admin'); setShowRoleSwitcher(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs transition ${
                role === 'admin' ? 'bg-amber-600 text-white font-medium' : 'bg-stone-700/60 text-stone-200 hover:bg-stone-700'
              }`}
            >
              <span>Admin (QA Executive)</span>
              <span className="text-[10px] bg-stone-900/50 px-1.5 py-0.5 rounded">Full Access</span>
            </button>
            <button
              onClick={() => { loginDemoRole('editor'); setShowRoleSwitcher(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs transition ${
                role === 'editor' ? 'bg-blue-600 text-white font-medium' : 'bg-stone-700/60 text-stone-200 hover:bg-stone-700'
              }`}
            >
              <span>Editor (Pastry Chef / Sup)</span>
              <span className="text-[10px] bg-stone-900/50 px-1.5 py-0.5 rounded">Inventory & Forms</span>
            </button>
            <button
              onClick={() => { loginDemoRole('viewer'); setShowRoleSwitcher(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs transition ${
                role === 'viewer' ? 'bg-emerald-600 text-white font-medium' : 'bg-stone-700/60 text-stone-200 hover:bg-stone-700'
              }`}
            >
              <span>Viewer (Store Auditor)</span>
              <span className="text-[10px] bg-stone-900/50 px-1.5 py-0.5 rounded">Read Only</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center font-serif font-black text-xl text-stone-900 tracking-wider shadow-inner">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-widest text-lg font-serif text-amber-400">BARISTA</span>
                <span className="text-xs font-semibold px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded border border-stone-700">SRI LANKA</span>
              </div>
              <p className="text-[11px] text-stone-400 uppercase tracking-wider font-mono">Central Kitchen Dispatch Log</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.filter(item => item.visible).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-stone-950 font-semibold shadow-sm'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1.5">
                <span className="text-xs font-medium text-stone-200 max-w-[150px] truncate">
                  {userProfile?.displayName || userProfile?.email || 'Logged In'}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                {userProfile?.userIdCode || 'ID: AUT-AUTH'}
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-950 border-b border-stone-800 px-4 pt-2 pb-4 space-y-1">
          <div className="py-2 border-b border-stone-800 mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-stone-200">{userProfile?.displayName || userProfile?.email}</p>
              <p className="text-[10px] text-stone-400">{userProfile?.userIdCode || 'User'}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRoleBadgeColor(role)}`}>
              {role}
            </span>
          </div>

          {navItems.filter(item => item.visible).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition text-left cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-stone-800 flex justify-between items-center">
            <button
              onClick={() => setShowRoleSwitcher(true)}
              className="text-xs text-amber-400 hover:underline"
            >
              Change Demo Role ({role})
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-1 text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-stone-900 rounded"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
