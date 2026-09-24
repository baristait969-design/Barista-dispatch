import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  FileText, 
  Store, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  ThermometerSnowflake, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  TrendingDown,
  UserCheck,
  UtensilsCrossed
} from 'lucide-react';
import { InventoryBatch, DispatchLog, Outlet, Product } from '../types';

interface DashboardViewProps {
  batches: InventoryBatch[];
  dispatchLogs: DispatchLog[];
  outlets: Outlet[];
  products?: Product[];
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  batches,
  dispatchLogs,
  outlets,
  products,
  onNavigate
}) => {
  const { userProfile, role, hasAccess } = useAuth();

  const totalStockUnits = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const lowStockCount = batches.filter(b => b.quantity <= 15).length;
  
  // Calculate batches expiring within 3 days or already expired
  const today = new Date().toISOString().split('T')[0];
  const expiringSoonCount = batches.filter(b => {
    if (!b.useByDate) return false;
    const diffDays = (new Date(b.useByDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diffDays <= 3;
  }).length;

  const todayDispatches = dispatchLogs.filter(d => d.date === today || d.createdAt.startsWith(today)).length;

  const quickNav = [
    {
      id: 'inventory',
      title: 'Inventory Management',
      desc: 'Batch tracking, quantities, prod & future expiration dates, dispatch temp (°C), and CSV export.',
      icon: Package,
      badge: `${batches.length} Batches`,
      color: 'from-amber-600 to-amber-700',
      visible: hasAccess('inventory', 'view')
    },
    {
      id: 'forms',
      title: 'Dispatch Forms (BCL/REC/HACCP/32)',
      desc: 'Issue dispatches with multi-outlet selection, auto-time, FIFO batches, real-time inventory deduction & driver logs.',
      icon: FileText,
      badge: 'HACCP Standard',
      color: 'from-blue-600 to-blue-700',
      visible: hasAccess('forms', 'view')
    },
    {
      id: 'outlets',
      title: 'Retail Outlets',
      desc: 'Manage Barista branch locations, outlet IDs, contacts, and delivery destinations.',
      icon: Store,
      badge: `${outlets.length} Branches`,
      color: 'from-emerald-600 to-emerald-700',
      visible: hasAccess('outlets', 'view')
    },
    {
      id: 'products',
      title: 'Products Master Catalog',
      desc: 'Master product catalog with system-generated IDs (PRD-XX), categories, and cold-chain dispatch temperatures.',
      icon: UtensilsCrossed,
      badge: `${(products || []).length} Products`,
      color: 'from-amber-600 to-amber-700',
      visible: hasAccess('products', 'view')
    },
    {
      id: 'users',
      title: 'Users & Access Control',
      desc: 'Create users with ID codes, assign roles (Admin, Editor, Viewer), and manage granular module visibility.',
      icon: Users,
      badge: 'User Settings',
      color: 'from-purple-600 to-purple-700',
      visible: hasAccess('users', 'view')
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      desc: 'View RBAC access matrix, visibility levels for each module, and security hierarchy.',
      icon: ShieldCheck,
      badge: 'RBAC Security',
      color: 'from-rose-600 to-rose-700',
      visible: hasAccess('roles', 'view')
    },
    {
      id: 'reports',
      title: 'Reports & Audit Log',
      desc: 'View submitted dispatch logs, export archives, and print official QA compliance records.',
      icon: BarChart3,
      badge: 'QA Compliance',
      color: 'from-indigo-600 to-indigo-700',
      visible: hasAccess('reports', 'view')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Personalized Welcome & Account Profile Card */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-amber-500/5 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center text-stone-950 font-serif font-black text-2xl shadow-lg shrink-0">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'B'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Welcome, {userProfile?.displayName || userProfile?.email}!
                </h2>
                <span className={`px-2 py-0.5 text-xs font-bold rounded border uppercase ${
                  role === 'admin' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : role === 'editor' 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {role} Role
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                {userProfile?.designation || 'Central Kitchen Staff'} • {userProfile?.department || 'Quality Assurance & Kitchen Logistics'}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stone-300">
                <span className="inline-flex items-center space-x-1 bg-stone-800 px-2.5 py-1 rounded-md border border-stone-700 font-mono">
                  <span className="text-stone-400">User ID:</span>
                  <span className="text-amber-400 font-semibold">{userProfile?.userIdCode || 'USR-AUTH'}</span>
                </span>
                <span className="inline-flex items-center space-x-1 bg-stone-800 px-2.5 py-1 rounded-md border border-stone-700">
                  <span className="text-stone-400">Email:</span>
                  <span>{userProfile?.email}</span>
                </span>
                <span className="inline-flex items-center space-x-1 bg-stone-800 px-2.5 py-1 rounded-md border border-stone-700">
                  <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-400" />
                  <span>OPRP-2 Compliance: Active</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => onNavigate('forms')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>New Dispatch Log</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 font-medium rounded-lg text-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Stock Overview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span>Total Units In Kitchen</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-white">{totalStockUnits}</div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center space-x-1">
            <span>Across</span>
            <span className="text-amber-400 font-semibold">{batches.length} batches</span>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span>Today's Dispatches</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{todayDispatches}</div>
          <div className="text-[11px] text-stone-400 mt-1">
            <span>Total recorded: </span>
            <span className="text-blue-400 font-semibold">{dispatchLogs.length} logs</span>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span>Active Outlets</span>
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {outlets.filter(o => o.active).length}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            <span>Network branches ready</span>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
            <span>Cold-Chain Status</span>
            <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-400 flex items-center space-x-1">
            <span>≤ 5.0 °C</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            <span>100% HACCP Standard</span>
          </div>
        </div>
      </div>

      {/* Stock Health Alerts (Low stock & Expiring soon) */}
      {(lowStockCount > 0 || expiringSoonCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockCount > 0 && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-amber-200">
                    Low Stock Alert ({lowStockCount} Batches)
                  </div>
                  <div className="text-xs text-amber-300/80">
                    Some batches have dropped below the minimum 15 unit threshold.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold px-3 py-1.5 rounded-lg transition"
              >
                Inspect
              </button>
            </div>
          )}

          {expiringSoonCount > 0 && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-rose-200">
                    Expiry Alert ({expiringSoonCount} Batches)
                  </div>
                  <div className="text-xs text-rose-300/80">
                    Batches reaching expiration date within 3 days. Prioritize in FIFO dispatches.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg transition"
              >
                Check
              </button>
            </div>
          )}
        </div>
      )}

      {/* Module Shortcuts Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          Central Kitchen System Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickNav.filter(item => item.visible).map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="bg-stone-900 border border-stone-800 hover:border-amber-600/60 rounded-xl p-5 shadow-sm transition hover:shadow-md cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base group-hover:text-amber-400 transition">
                    {item.title}
                  </h4>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-amber-400 font-medium">
                  <span>Open Module</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Dispatches & HACCP OPRP-2 Protocol Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Recent Kitchen Dispatch Logs</span>
            </h3>
            <button
              onClick={() => onNavigate('forms')}
              className="text-xs text-amber-400 hover:underline"
            >
              View All ({dispatchLogs.length})
            </button>
          </div>

          {dispatchLogs.length === 0 ? (
            <div className="text-center py-8 text-stone-500 text-xs">
              No dispatch logs recorded yet. Use the "Dispatch Forms" button to issue the first delivery.
            </div>
          ) : (
            <div className="divide-y divide-stone-800">
              {dispatchLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{log.docNo}</span>
                      <span className="text-[10px] bg-stone-800 px-1.5 py-0.2 rounded text-stone-300">
                        {log.date} @ {log.dispatchTime}
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold">
                        {log.outletNames.join(', ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Driver: <span className="text-stone-300">{log.driverName}</span> • Supervisor: <span className="text-stone-300">{log.supervisor}</span> • {log.items.length} product line(s)
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('forms')}
                    className="text-xs bg-stone-800 hover:bg-stone-750 text-stone-300 px-2.5 py-1 rounded transition"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HACCP Compliance Sidebar Note */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ThermometerSnowflake className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm">HACCP OPRP-2 Protocol</h3>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              "No product may leave the central kitchen without a verified Dispatch Log. Dispatch temperature must be <strong>≤ 5°C</strong>. Cream cakes and cold cheesecakes: maximum 2-hour transit in temperature-controlled vehicles."
            </p>
            <div className="mt-4 p-3 bg-stone-800/80 rounded-lg border border-stone-700 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-stone-300">
                <span>Doc Number:</span>
                <span className="text-amber-400 font-bold">BCL/REC/HACCP/32</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Revision:</span>
                <span>Rev 01 (01 Jan 2025)</span>
              </div>
              <div className="flex justify-between text-stone-300">
                <span>Approval:</span>
                <span className="text-emerald-400">QA Executive</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800">
            <button
              onClick={() => onNavigate('reports')}
              className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-amber-300 border border-stone-700 hover:border-amber-500/50 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>View Central Kitchen QA Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
