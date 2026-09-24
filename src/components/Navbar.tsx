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
  LogOut, 
  Menu, 
  X, 
  ThermometerSnowflake,
  UserCheck,
  UtensilsCrossed
} from 'lucide-react';
import { UserRole } from '../types';
import { BaristaLogo } from './BaristaLogo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { userProfile, role, logout, hasAccess } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: hasAccess('dashboard', 'view') },
    { id: 'inventory', label: 'Inventory', icon: Package, visible: hasAccess('inventory', 'view') },
    { id: 'forms', label: 'Dispatch Forms', icon: FileText, visible: hasAccess('forms', 'view') },
    { id: 'outlets', label: 'Outlets', icon: Store, visible: hasAccess('outlets', 'view') },
    { id: 'products', label: 'Products', icon: UtensilsCrossed, visible: hasAccess('products', 'view') },
    { id: 'users', label: 'Users & Access', icon: Users, visible: hasAccess('users', 'view') },
    { id: 'roles', label: 'Roles Matrix', icon: ShieldCheck, visible: hasAccess('roles', 'view') },
    { id: 'reports', label: 'Reports', icon: BarChart3, visible: hasAccess('reports', 'view') },
  ];

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'editor':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'viewer':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <header className="bg-stone-900 text-white shadow-lg sticky top-0 z-40 border-b border-stone-800">
      {/* Top micro bar for HACCP status - clean and secure without backdoor role switcher */}
      <div className="bg-amber-950/60 text-amber-200 text-xs px-3 sm:px-6 py-1.5 flex items-center justify-between border-b border-amber-800/40">
        <div className="flex items-center space-x-2 truncate">
          <ThermometerSnowflake className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider text-[11px] sm:text-xs">
            HACCP Central Kitchen Compliant
          </span>
          <span className="hidden md:inline text-amber-300/70 text-[11px]">
            | Doc No: BCL/REC/HACCP/32 | Cold-Chain Transit: ≤5°C
          </span>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-stone-400 text-[11px] hidden sm:inline">Enterprise QA Portal:</span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase text-amber-300 font-mono">
            Barista Sri Lanka
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand with authentic Barista circular logo */}
          <div 
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0" 
            onClick={() => setCurrentTab(role === 'viewer' ? 'reports' : 'dashboard')}
            title={role === 'viewer' ? "Go to Reports" : "Go to Dashboard"}
          >
            <BaristaLogo className="w-9 h-9 sm:w-10 sm:h-10 ring-1 ring-amber-500/40" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-widest text-base sm:text-lg font-serif text-amber-400">BARISTA</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded border border-stone-700">SRI LANKA</span>
              </div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider font-mono hidden sm:block">Central Kitchen Dispatch</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.filter(item => item.visible).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* RIGHT CLUSTER: User Profile and Menu Icon positioned closely together */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* User Profile Chip - Displayed prominently close to the menu icon on all screen sizes */}
            <div 
              onClick={() => {
                if (hasAccess('users', 'view')) {
                  setCurrentTab('users');
                }
              }}
              className="flex items-center space-x-2 bg-stone-850 hover:bg-stone-800 border border-stone-700 rounded-xl px-2.5 py-1.5 transition cursor-pointer group shadow-sm"
              title="Click to view User Profile & Access settings"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-stone-950 font-black flex items-center justify-center text-xs shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white max-w-[110px] sm:max-w-[170px] truncate leading-tight">
                    {userProfile?.displayName || userProfile?.email || 'Barista IT Administrator'}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeColor(role)}`}>
                    {role}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 font-mono leading-tight flex items-center space-x-1">
                  <span className="text-amber-400 font-bold">{userProfile?.userIdCode || 'USR-ADM-01'}</span>
                  <span className="hidden md:inline">• {userProfile?.email}</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              className="p-2 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-xl border border-stone-750 hover:border-stone-700 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Menu Icon (Mobile & Tablet) - Positioned immediately adjacent to the user profile */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-stone-200 hover:text-white bg-stone-850 hover:bg-stone-800 border border-stone-700 focus:outline-none flex items-center space-x-1.5 transition cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-amber-400" />
                ) : (
                  <Menu className="w-5 h-5 text-amber-400" />
                )}
                <span className="text-xs font-bold hidden sm:inline">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-stone-950 border-b border-stone-800 px-4 pt-2 pb-4 space-y-2 shadow-2xl animate-in slide-in-from-top duration-150">
          <div className="py-2.5 px-3 bg-stone-900 border border-stone-800 rounded-xl mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-stone-950 font-black flex items-center justify-center text-xs">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{userProfile?.displayName || 'Barista IT Administrator'}</p>
                <p className="text-[10px] text-stone-400 font-mono">{userProfile?.email} ({userProfile?.userIdCode || 'USR-ADM-01'})</p>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getRoleBadgeColor(role)}`}>
              {role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-stone-950 font-bold shadow-md'
                      : 'text-stone-300 hover:bg-stone-900 hover:text-white border border-transparent hover:border-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-800/80 flex justify-end items-center text-xs">
            <button
              onClick={logout}
              className="flex items-center space-x-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 rounded-lg border border-stone-800 cursor-pointer"
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
