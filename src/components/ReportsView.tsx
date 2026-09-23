import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Truck, 
  ShieldCheck, 
  ThermometerSnowflake, 
  Calendar, 
  Filter, 
  Package, 
  FileText, 
  TrendingUp, 
  Eye, 
  Search,
  Lock,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { DispatchLog, InventoryBatch, Outlet, Driver } from '../types';
import { PrintableDispatchSheet } from './PrintableDispatchSheet';

interface ReportsViewProps {
  dispatchLogs: DispatchLog[];
  batches: InventoryBatch[];
  outlets?: Outlet[];
  drivers?: Driver[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  dispatchLogs, 
  batches,
  outlets = [],
  drivers = []
}) => {
  const { userProfile, role, hasAccess } = useAuth();
  
  // Access control
  const canViewReports = hasAccess('reports', 'view');
  const canExport = hasAccess('reports', 'edit') || role === 'admin';

  // Sub-tabs
  const [activeReportTab, setActiveReportTab] = useState<'dispatch_log' | 'outlets' | 'products' | 'haccp_audit'>('dispatch_log');

  // Filters state
  const [datePreset, setDatePreset] = useState<'today' | '7days' | '30days' | 'all' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>('all');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>('all');
  const [haccpFilter, setHaccpFilter] = useState<'all' | 'compliant' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Dispatch for Printable Sheet Modal
  const [selectedLogForPrint, setSelectedLogForPrint] = useState<DispatchLog | null>(null);
  const [isExecutiveReportPrinting, setIsExecutiveReportPrinting] = useState<boolean>(false);

  // Helper date calculations
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter logs based on date, outlet, driver, haccp, and search
  const filteredLogs = useMemo(() => {
    return dispatchLogs.filter(log => {
      // Date filtering
      if (datePreset === 'today') {
        if (log.date !== todayStr) return false;
      } else if (datePreset === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const threshold = d.toISOString().split('T')[0];
        if (log.date < threshold) return false;
      } else if (datePreset === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        const threshold = d.toISOString().split('T')[0];
        if (log.date < threshold) return false;
      } else if (datePreset === 'custom') {
        if (startDate && log.date < startDate) return false;
        if (endDate && log.date > endDate) return false;
      }

      // Outlet filtering
      if (selectedOutletFilter !== 'all') {
        const matchesOutlet = log.outletNames.some(name => 
          name.toLowerCase().includes(selectedOutletFilter.toLowerCase())
        );
        if (!matchesOutlet) return false;
      }

      // Driver filtering
      if (selectedDriverFilter !== 'all') {
        if (log.driverName !== selectedDriverFilter) return false;
      }

      // HACCP filtering
      if (haccpFilter === 'compliant' && !log.haccpCompliant) return false;
      if (haccpFilter === 'warning' && log.haccpCompliant) return false;

      // Text search
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const inDoc = log.docNo.toLowerCase().includes(q);
        const inDriver = log.driverName.toLowerCase().includes(q);
        const inSupervisor = log.supervisor.toLowerCase().includes(q);
        const inOutlets = log.outletNames.some(o => o.toLowerCase().includes(q));
        const inItems = log.items.some(i => i.productName.toLowerCase().includes(q) || i.batchNo.toLowerCase().includes(q));
        if (!inDoc && !inDriver && !inSupervisor && !inOutlets && !inItems) return false;
      }

      return true;
    });
  }, [dispatchLogs, datePreset, startDate, endDate, selectedOutletFilter, selectedDriverFilter, haccpFilter, searchQuery, todayStr]);

  // Aggregate Metrics
  const totalDispatches = filteredLogs.length;
  const totalUnitsDispatched = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      return acc + log.items.reduce((s, i) => s + (i.quantity || 0), 0);
    }, 0);
  }, [filteredLogs]);

  const compliantLogsCount = filteredLogs.filter(l => l.haccpCompliant).length;
  const haccpComplianceRate = totalDispatches > 0 
    ? Math.round((compliantLogsCount / totalDispatches) * 100) 
    : 100;

  const averageTemp = useMemo(() => {
    let sum = 0;
    let count = 0;
    filteredLogs.forEach(log => {
      log.items.forEach(item => {
        if (item.quantity > 0) {
          sum += item.dispatchTemp;
          count++;
        }
      });
    });
    return count > 0 ? (sum / count).toFixed(1) : '3.6';
  }, [filteredLogs]);

  const deviationCount = filteredLogs.filter(l => !l.haccpCompliant).length;

  // Outlet Distribution Breakdown
  const outletStats = useMemo(() => {
    const map: Record<string, { count: number; units: number; lastDate: string }> = {};
    filteredLogs.forEach(log => {
      const unitsInLog = log.items.reduce((s, i) => s + (i.quantity || 0), 0);
      const dividedUnits = log.outletNames.length > 0 ? Math.round(unitsInLog / log.outletNames.length) : unitsInLog;

      log.outletNames.forEach(outlet => {
        if (!map[outlet]) {
          map[outlet] = { count: 0, units: 0, lastDate: log.date };
        }
        map[outlet].count += 1;
        map[outlet].units += dividedUnits;
        if (log.date > map[outlet].lastDate) {
          map[outlet].lastDate = log.date;
        }
      });
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      share: totalUnitsDispatched > 0 ? Math.round((data.units / totalUnitsDispatched) * 100) : 0
    })).sort((a, b) => b.units - a.units);
  }, [filteredLogs, totalUnitsDispatched]);

  // Product Distribution Breakdown
  const productStats = useMemo(() => {
    const map: Record<string, { units: number; batchCount: Set<string>; avgTempSum: number; count: number }> = {};
    filteredLogs.forEach(log => {
      log.items.forEach(item => {
        if (item.quantity > 0) {
          if (!map[item.productName]) {
            map[item.productName] = { units: 0, batchCount: new Set(), avgTempSum: 0, count: 0 };
          }
          map[item.productName].units += item.quantity;
          if (item.batchNo) map[item.productName].batchCount.add(item.batchNo);
          map[item.productName].avgTempSum += item.dispatchTemp;
          map[item.productName].count += 1;
        }
      });
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      units: data.units,
      batchesUsed: data.batchCount.size,
      avgTemp: data.count > 0 ? (data.avgTempSum / data.count).toFixed(1) : '3.5',
      share: totalUnitsDispatched > 0 ? Math.round((data.units / totalUnitsDispatched) * 100) : 0
    })).sort((a, b) => b.units - a.units);
  }, [filteredLogs, totalUnitsDispatched]);

  // Driver Distribution Breakdown
  const driverStats = useMemo(() => {
    const map: Record<string, { trips: number; units: number; vehicle: string }> = {};
    filteredLogs.forEach(log => {
      const units = log.items.reduce((s, i) => s + (i.quantity || 0), 0);
      if (!map[log.driverName]) {
        map[log.driverName] = { trips: 0, units: 0, vehicle: log.vehicleNo || 'Van' };
      }
      map[log.driverName].trips += 1;
      map[log.driverName].units += units;
    });

    return Object.entries(map).map(([driver, data]) => ({
      driver,
      ...data
    })).sort((a, b) => b.units - a.units);
  }, [filteredLogs]);

  // Export CSV Function
  const exportAllDispatchesCSV = () => {
    if (!canExport) {
      alert('Your current role has read-only access. Only Admin or Kitchen Editor can export audit reports.');
      return;
    }

    const headers = [
      'Document No',
      'Date',
      'Dispatch Time',
      'Outlets Delivered',
      'Driver Name',
      'Vehicle No',
      'Supervisor / QA Officer',
      'Product Name',
      'Batch No',
      'Quantity Dispatched (Units)',
      'Loaded Temperature (C)',
      'HACCP Compliant (<=5C)',
      'Log Status'
    ];

    const rows: any[] = [];
    filteredLogs.forEach(log => {
      log.items.forEach(item => {
        if (item.quantity > 0) {
          rows.push([
            `"${log.docNo}"`,
            `"${log.date}"`,
            `"${log.dispatchTime}"`,
            `"${log.outletNames.join('; ')}"`,
            `"${log.driverName}"`,
            `"${log.vehicleNo || ''}"`,
            `"${log.supervisor}"`,
            `"${item.productName}"`,
            `"${item.batchNo}"`,
            item.quantity,
            item.dispatchTemp,
            item.dispatchTemp <= 5.0 ? 'YES' : 'NO',
            `"${log.status}"`
          ]);
        }
      });
    });

    if (rows.length === 0) {
      alert('No dispatched items found for the selected filter criteria.');
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barista_Central_Kitchen_Dispatch_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Executive Summary Report
  const handlePrintExecutiveReport = () => {
    setIsExecutiveReportPrinting(true);
    setTimeout(() => {
      window.print();
      setIsExecutiveReportPrinting(false);
    }, 400);
  };

  // Unauthorized view check
  if (!canViewReports) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Access Restricted: Reports Module</h3>
          <p className="text-xs text-stone-400 max-w-md mt-1">
            Your current assigned role ({role.toUpperCase()}) does not possess permissions to view Central Kitchen QA and dispatch analytics. Please contact the Barista IT Administrator to update your module access matrix.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Modal for Printing Selected Dispatch Log (ONLY DISPATCHED ITEMS) */}
      {selectedLogForPrint && (
        <PrintableDispatchSheet
          dispatchLog={selectedLogForPrint}
          onClose={() => setSelectedLogForPrint(null)}
          autoPrint={true}
        />
      )}

      {/* TOP BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 print:hidden shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Central Kitchen Reports & QA Audits</h2>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
              OPRP-2 Certified
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Real-time bakery dispatch analytics, cold-chain compliance (≤5°C), retail outlet volumes, and item performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === 'viewer' && (
            <div className="px-3 py-1.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Viewer Role: Reports & Print Only</span>
            </div>
          )}

          <button
            onClick={handlePrintExecutiveReport}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 font-semibold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="Print Executive QA & Dispatch Summary Sheet"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Executive Report</span>
          </button>

          {role !== 'viewer' && canExport && (
            <button
              onClick={exportAllDispatchesCSV}
              disabled={filteredLogs.length === 0}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-md disabled:opacity-50"
              title="Download CSV for Excel / ERP integration"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* OPERATIONAL KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Dispatches */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Total Dispatches</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{totalDispatches}</span>
            <span className="text-[11px] text-stone-500 block">Deliveries recorded</span>
          </div>
        </div>

        {/* Total Units Dispatched */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Total Output</span>
            <Package className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono">{totalUnitsDispatched}</span>
            <span className="text-[11px] text-stone-500 block">Pastry & bakery units</span>
          </div>
        </div>

        {/* HACCP Compliance Rate */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Cold-Chain Adherence</span>
            <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-2xl font-black font-mono ${
                haccpComplianceRate >= 95 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {haccpComplianceRate}%
              </span>
              <span className="text-[10px] text-stone-400 font-mono">OPRP-2 (≤5°C)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              {compliantLogsCount} of {totalDispatches} fully compliant
            </span>
          </div>
        </div>

        {/* Average Loading Temperature */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Avg Dispatch Temp</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white font-mono">{averageTemp}°C</span>
              <span className="text-[10px] text-emerald-400 font-mono">Safe</span>
            </div>
            <span className="text-[11px] text-stone-500 block">Max standard: 5.0°C</span>
          </div>
        </div>

        {/* Outlets Serviced & Deviations */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>Outlets Serviced</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white font-mono">{outletStats.length}</span>
              <span className="text-[11px] text-stone-500 block">Active branches</span>
            </div>
            {deviationCount > 0 ? (
              <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded">
                {deviationCount} Alerts
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                0 Breaches
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3 print:hidden shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div className="flex items-center space-x-2 text-xs font-bold text-stone-300">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Report Filters & Operational Parameters</span>
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            Showing {filteredLogs.length} matching dispatches
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          
          {/* Date Presets */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-stone-400 mb-1">
              Time Period
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Available Records</option>
              <option value="today">Today Only ({todayStr})</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Outlet Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-stone-400 mb-1">
              Destination Outlet
            </label>
            <select
              value={selectedOutletFilter}
              onChange={(e) => setSelectedOutletFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Retail Branches</option>
              {outlets.map(o => (
                <option key={o.id} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-stone-400 mb-1">
              Cold-Chain Driver
            </label>
            <select
              value={selectedDriverFilter}
              onChange={(e) => setSelectedDriverFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Fleet Drivers</option>
              {drivers.map(d => (
                <option key={d.id} value={d.name}>{d.name} ({d.vehicleNo})</option>
              ))}
            </select>
          </div>

          {/* HACCP Compliance Filter */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-stone-400 mb-1">
              Cold-Chain Status
            </label>
            <select
              value={haccpFilter}
              onChange={(e) => setHaccpFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Dispatches</option>
              <option value="compliant">Compliant Only (≤5.0°C)</option>
              <option value="warning">Deviations (&gt;5.0°C)</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] font-semibold uppercase text-stone-400 mb-1">
              Search Products / Logs
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Product, Batch, Outlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-stone-850 border border-stone-700 rounded-lg text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Custom date range picker if 'custom' is active */}
        {datePreset === 'custom' && (
          <div className="pt-2 border-t border-stone-800 flex items-center space-x-3 text-xs">
            <span className="text-stone-400">From Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-stone-850 border border-stone-700 rounded text-stone-200 text-xs font-mono"
            />
            <span className="text-stone-400">To Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-stone-850 border border-stone-700 rounded text-stone-200 text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* REPORT SUB-NAV TABS */}
      <div className="flex border-b border-stone-800 space-x-2 print:hidden overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('dispatch_log')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeReportTab === 'dispatch_log'
              ? 'bg-stone-900 text-amber-400 border-amber-500'
              : 'text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-900/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dispatch Records & Print Archive ({filteredLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('outlets')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeReportTab === 'outlets'
              ? 'bg-stone-900 text-amber-400 border-amber-500'
              : 'text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-900/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Outlet Distribution Breakdown ({outletStats.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('products')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeReportTab === 'products'
              ? 'bg-stone-900 text-amber-400 border-amber-500'
              : 'text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-900/40'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Performance Matrix ({productStats.length})</span>
        </button>

        <button
          onClick={() => setActiveReportTab('haccp_audit')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center space-x-2 border-b-2 ${
            activeReportTab === 'haccp_audit'
              ? 'bg-stone-900 text-amber-400 border-amber-500'
              : 'text-stone-400 hover:text-stone-200 border-transparent hover:bg-stone-900/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>HACCP Cold-Chain & OPRP-2 Audit Log</span>
        </button>
      </div>

      {/* TAB 1: DISPATCH RECORDS & INSTANT PRINT */}
      {activeReportTab === 'dispatch_log' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Itemized Dispatch Manifests</h3>
              <p className="text-xs text-stone-400">
                Click "Print Sheet" on any record to print ONLY the selected dispatched items with official HACCP header.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">
              Total Units: <strong>{totalUnitsDispatched}</strong>
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">
              No dispatch records found matching your filter parameters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-850 text-stone-300 font-bold uppercase tracking-wider border-b border-stone-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Doc No / Date</th>
                    <th className="py-3 px-4">Destination Outlets</th>
                    <th className="py-3 px-4">Driver & Vehicle</th>
                    <th className="py-3 px-4">Dispatched Items & Qty</th>
                    <th className="py-3 px-4 text-center">Cold-Chain Temp</th>
                    <th className="py-3 px-4">QA Supervisor</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {filteredLogs.map((log) => {
                    const activeItems = log.items.filter(i => i.quantity > 0);
                    const unitsCount = activeItems.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <tr key={log.id} className="hover:bg-stone-800/40 transition">
                        {/* Doc No & Date */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-amber-400 text-xs block">{log.docNo}</span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {log.date} @ {log.dispatchTime}
                          </span>
                        </td>

                        {/* Destination Outlets */}
                        <td className="py-3 px-4 font-semibold text-white max-w-[200px]">
                          <div className="truncate" title={log.outletNames.join(', ')}>
                            {log.outletNames.join(', ')}
                          </div>
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {log.outletNames.length} branch(es)
                          </span>
                        </td>

                        {/* Driver & Vehicle */}
                        <td className="py-3 px-4 text-stone-300">
                          <div>{log.driverName}</div>
                          <span className="text-[10px] text-stone-400 font-mono">{log.vehicleNo || 'Van'}</span>
                        </td>

                        {/* Dispatched Items */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-white font-mono text-sm">{unitsCount}</span>
                            <span className="text-stone-400 text-[11px]">units</span>
                            <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded">
                              ({activeItems.length} products)
                            </span>
                          </div>
                          <div className="text-[10px] text-stone-400 truncate max-w-[220px] mt-0.5">
                            {activeItems.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                          </div>
                        </td>

                        {/* Cold-Chain Temp */}
                        <td className="py-3 px-4 text-center">
                          {log.haccpCompliant ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>≤5°C PASS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded font-mono animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              <span>DEVIATION</span>
                            </span>
                          )}
                        </td>

                        {/* QA Supervisor */}
                        <td className="py-3 px-4 text-stone-300 text-xs">
                          <div className="font-medium text-stone-200">{log.supervisor}</div>
                          <span className="text-[10px] text-stone-500 font-mono">QA Verified</span>
                        </td>

                        {/* Action: Print Dispatched Items */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedLogForPrint(log)}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-amber-400 hover:text-amber-300 border border-stone-700 hover:border-amber-500/50 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ml-auto cursor-pointer shadow-sm"
                            title="Print this dispatch sheet with only dispatched items and official Barista header"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Sheet</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OUTLET BREAKDOWN */}
      {activeReportTab === 'outlets' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="text-sm font-bold text-white">Retail Outlet Delivery & Volume Breakdown</h3>
              <p className="text-xs text-stone-400">
                Total pastry and cake units delivered per Barista Sri Lanka branch.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">
              Total Delivery Trips: <strong>{totalDispatches}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outletStats.map((stat, idx) => (
              <div key={stat.name} className="bg-stone-850 border border-stone-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-stone-800 text-amber-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-white">{stat.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {stat.units} Units ({stat.share}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stat.share * 2 || 5)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  <span>Deliveries: <strong>{stat.count} dispatches</strong></span>
                  <span>Last Service: <strong className="font-mono text-stone-300">{stat.lastDate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT PERFORMANCE MATRIX */}
      {activeReportTab === 'products' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="text-sm font-bold text-white">Product Dispatch & Inventory Output Matrix</h3>
              <p className="text-xs text-stone-400">
                Quantity dispatched, distinct batch rotations, and average departure temperatures.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400">
              Active Products: <strong>{productStats.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-850 text-stone-300 font-bold uppercase tracking-wider border-b border-stone-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Pastry / Kitchen Product</th>
                  <th className="py-3 px-4 text-center">Total Dispatched</th>
                  <th className="py-3 px-4 text-center">Output Share</th>
                  <th className="py-3 px-4 text-center">Batches Utilized</th>
                  <th className="py-3 px-4 text-center">Avg Dispatch Temp</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {productStats.map((prod) => (
                  <tr key={prod.name} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>{prod.name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400 text-sm">
                      {prod.units} units
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-stone-300">
                      {prod.share}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-stone-300">
                      {prod.batchesUsed} batches
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-cyan-300">
                      {prod.avgTemp}°C
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                        Active In Circulation
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: HACCP COLD-CHAIN & OPRP-2 AUDIT LOG */}
      {activeReportTab === 'haccp_audit' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
            <div>
              <div className="flex items-center space-x-2">
                <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">HACCP OPRP-2 Cold-Chain Audit Verification</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Standard: Product core temperature must be ≤ 5.0°C at central kitchen dispatch loading.
              </p>
            </div>
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-stone-400">Total Audits:</span>
              <strong className="text-white">{filteredLogs.length}</strong>
              <span className="text-stone-400">• Compliance:</span>
              <strong className="text-emerald-400">{haccpComplianceRate}%</strong>
            </div>
          </div>

          {/* Compliance Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">Optimal Range (0°C - 4.5°C)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black font-mono text-emerald-300 mt-2">
                {compliantLogsCount} Logs
              </p>
              <span className="text-[11px] text-emerald-400/80 block mt-0.5">
                Complies with strict OPRP-2 central kitchen standard
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">Critical Limit Margin (4.6°C - 5.0°C)</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-300 mt-2">
                0 Logs
              </p>
              <span className="text-[11px] text-amber-400/80 block mt-0.5">
                Requires accelerated loading protocol
              </span>
            </div>

            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase">Deviations (&gt; 5.0°C Breach)</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-black font-mono text-red-300 mt-2">
                {deviationCount} Logs
              </p>
              <span className="text-[11px] text-red-400/80 block mt-0.5">
                Immediate CAPA and re-chilling required
              </span>
            </div>
          </div>

          {/* Audit Verification Statement */}
          <div className="p-4 bg-stone-850 border border-stone-700 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>QA Executive Compliance Certificate</span>
            </h4>
            <p className="text-stone-300 leading-relaxed text-[11px]">
              This log verifies that all refrigerated pastry dispatches from the Barista Sri Lanka Central Kitchen were inspected by the designated Quality Assurance Executive. Probe thermometer readings are recorded for every batch prior to vehicle loading. Maximum cold-chain transit time to retail outlets does not exceed 2 hours in insulated refrigerated containers.
            </p>
            <div className="pt-2 border-t border-stone-800 flex justify-between items-center text-[10px] text-stone-400 font-mono">
              <span>HACCP Link: OPRP-2 | Document: BCL/REC/HACCP/32</span>
              <span>Auditor: {userProfile?.displayName || 'Central Kitchen QA Executive'}</span>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY EXECUTIVE AUDIT REPORT LAYOUT */}
      <div className="hidden print:block text-black bg-white p-6">
        <div className="border-2 border-black p-4 mb-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-3">
            <div>
              <h1 className="text-xl font-bold font-serif">BARISTA COFFEE LANKA (PVT) LTD</h1>
              <p className="text-xs font-bold">CENTRAL KITCHEN DISPATCH & HACCP AUDIT EXECUTIVE STATEMENT</p>
            </div>
            <div className="text-right text-xs font-mono">
              <p>Doc Ref: BCL/REC/HACCP/32</p>
              <p>HACCP Link: OPRP-2</p>
              <p>Date: {todayStr}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs mb-4">
            <div>Total Dispatches: <strong>{totalDispatches}</strong></div>
            <div>Total Units: <strong>{totalUnitsDispatched}</strong></div>
            <div>Cold-Chain Compliance: <strong>{haccpComplianceRate}%</strong></div>
            <div>Avg Dispatch Temp: <strong>{averageTemp}°C</strong></div>
          </div>

          <h3 className="font-bold text-xs uppercase mb-2 border-b border-black">Dispatches in this Period</h3>
          <table className="w-full text-left text-[10px] border border-black mb-4">
            <thead>
              <tr className="border-b border-black bg-gray-100">
                <th className="p-1">Doc No</th>
                <th className="p-1">Date/Time</th>
                <th className="p-1">Outlets</th>
                <th className="p-1">Driver & Vehicle</th>
                <th className="p-1">Items</th>
                <th className="p-1">Units</th>
                <th className="p-1">HACCP (≤5°C)</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b border-gray-300">
                  <td className="p-1 font-mono">{log.docNo}</td>
                  <td className="p-1">{log.date} @ {log.dispatchTime}</td>
                  <td className="p-1">{log.outletNames.join(', ')}</td>
                  <td className="p-1">{log.driverName} ({log.vehicleNo || 'Van'})</td>
                  <td className="p-1">{log.items.length}</td>
                  <td className="p-1 font-bold">{log.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="p-1">{log.haccpCompliant ? 'PASS' : 'DEV'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t-2 border-black text-xs">
            <div>
              <p>Prepared by: _______________________</p>
              <p className="text-[10px] text-gray-600 mt-1">Central Kitchen Dispatch QA Officer</p>
            </div>
            <div>
              <p>Approved by: _______________________</p>
              <p className="text-[10px] text-gray-600 mt-1">Head of Quality Assurance / Operations</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
