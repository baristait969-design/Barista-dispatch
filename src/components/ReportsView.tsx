import React from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Clock, 
  Sparkles, 
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { DispatchLog, InventoryBatch } from '../types';

interface ReportsViewProps {
  dispatchLogs: DispatchLog[];
  batches: InventoryBatch[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ dispatchLogs, batches }) => {
  const exportAllDispatchesCSV = () => {
    const headers = [
      'Document No',
      'Date',
      'Dispatch Time',
      'Outlets',
      'Driver Name',
      'Vehicle No',
      'Supervisor / QA Sign',
      'Total Items Count',
      'Total Quantity Dispatched',
      'HACCP Compliant (<=5C)'
    ];

    const rows = dispatchLogs.map(l => [
      `"${l.docNo}"`,
      `"${l.date}"`,
      `"${l.dispatchTime}"`,
      `"${l.outletNames.join('; ')}"`,
      `"${l.driverName}"`,
      `"${l.vehicleNo || ''}"`,
      `"${l.supervisor}"`,
      l.items.length,
      l.items.reduce((s, i) => s + i.quantity, 0),
      l.haccpCompliant ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barista_Dispatch_Archive_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Central Kitchen Reports</h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Dispatch history, HACCP cold-chain temperature verification, and audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportAllDispatchesCSV}
            disabled={dispatchLogs.length === 0}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 font-medium rounded-lg text-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export All Logs to CSV</span>
          </button>
        </div>
      </div>

      {/* Clean Placeholder matching user request ("keep it blank for now will do later") */}
      <div className="bg-stone-900/60 border border-dashed border-stone-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-800 flex items-center justify-center text-amber-400 mb-4">
          <Clock className="w-8 h-8 opacity-70" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Reports & Analytics Section
        </h3>
        <p className="text-xs text-stone-400 max-w-md leading-relaxed mb-6">
          This section is currently reserved for advanced multi-period HACCP analytics, driver mileage calculations, and automated monthly outlet audit summaries (scheduled for next sprint).
        </p>

        <div className="inline-flex items-center space-x-2 bg-stone-850 px-4 py-2 rounded-lg border border-stone-700/60 text-xs text-stone-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Current total recorded dispatches: <strong>{dispatchLogs.length} logs</strong></span>
        </div>
      </div>
    </div>
  );
};
