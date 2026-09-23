import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Printer, 
  Send, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Truck, 
  UserCheck, 
  ThermometerSnowflake, 
  History, 
  Edit3, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  Search,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { InventoryBatch, Outlet, Driver, DispatchLog, DispatchLineItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/seedData';
import { createDispatchLogWithDeduction, updateDispatchLog } from '../services/dataService';
import { PrintableDispatchSheet } from './PrintableDispatchSheet';

interface FormsViewProps {
  batches: InventoryBatch[];
  outlets: Outlet[];
  drivers: Driver[];
  dispatchLogs: DispatchLog[];
}

export const FormsView: React.FC<FormsViewProps> = ({
  batches,
  outlets,
  drivers,
  dispatchLogs
}) => {
  const { userProfile, role, hasAccess } = useAuth();
  const canEdit = hasAccess('forms', 'edit');

  const [activeTab, setActiveTab] = useState<'create' | 'submitted'>('create');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [selectedLogForPrint, setSelectedLogForPrint] = useState<DispatchLog | null>(null);
  const [lastSubmittedLog, setLastSubmittedLog] = useState<DispatchLog | null>(null);

  // Automatic current time in HH:MM
  const getCurrentTime = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeWithOffset = (offsetMinutes: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + offsetMinutes);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Selected Outlets (Single or Multiple)
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>(
    outlets.length > 0 ? [outlets[0].id] : []
  );
  const [outletSearch, setOutletSearch] = useState('');

  const [date, setDate] = useState<string>(getTodayDate());
  const [dispatchTime, setDispatchTime] = useState<string>(getCurrentTime());
  const [syncTimeToRows, setSyncTimeToRows] = useState<boolean>(true);
  const [timeSyncedNotice, setTimeSyncedNotice] = useState<string | null>(null);

  const [selectedDriverName, setSelectedDriverName] = useState<string>(
    drivers.length > 0 ? drivers[0].name : 'Kamal Perera'
  );
  const [vehicleNo, setVehicleNo] = useState<string>(
    drivers.length > 0 ? drivers[0].vehicleNo : 'WP CAD-4291'
  );
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Line Items state
  const [lineItems, setLineItems] = useState<DispatchLineItem[]>(() => {
    return INITIAL_PRODUCTS.slice(0, 5).map((prod, idx) => {
      const matchingBatches = batches.filter(b => b.productName === prod.name);
      const latestBatch = matchingBatches.length > 0 ? matchingBatches[0] : null;

      return {
        id: `row-${idx}-${Date.now()}`,
        productName: prod.name,
        batchNo: latestBatch ? latestBatch.batchNo : '',
        batchId: latestBatch ? latestBatch.id : undefined,
        dispatchTime: getCurrentTime(),
        prodDate: latestBatch ? latestBatch.prodDate : getTodayDate(),
        useByDate: latestBatch ? latestBatch.useByDate : '',
        dispatchTemp: latestBatch ? latestBatch.dispatchTemp : prod.defaultTemp,
        quantity: 0,
        availableStock: latestBatch ? latestBatch.quantity : 0
      };
    });
  });

  // Handler: Top dispatch time change with auto-fill option
  const handleTopDispatchTimeChange = (newTime: string, applyToAll = syncTimeToRows) => {
    setDispatchTime(newTime);
    if (applyToAll) {
      setLineItems(prev => prev.map(row => ({ ...row, dispatchTime: newTime })));
      triggerTimeToast(`Auto-filled dispatch time to ${newTime} across all items`);
    }
  };

  // Handler: Explicit Auto-fill Now button
  const handleAutoFillNow = () => {
    const nowTime = getCurrentTime();
    setDispatchTime(nowTime);
    setLineItems(prev => prev.map(row => ({ ...row, dispatchTime: nowTime })));
    triggerTimeToast(`Auto-filled current time (${nowTime}) to all item rows`);
  };

  // Handler: Sync top time to all items
  const handleSyncAllRowsToTopTime = () => {
    setLineItems(prev => prev.map(row => ({ ...row, dispatchTime })));
    triggerTimeToast(`Synchronized all items to top dispatch time (${dispatchTime})`);
  };

  const triggerTimeToast = (msg: string) => {
    setTimeSyncedNotice(msg);
    setTimeout(() => {
      setTimeSyncedNotice(null);
    }, 2800);
  };

  // Keep driver vehicle synced
  const handleDriverChange = (driverName: string) => {
    setSelectedDriverName(driverName);
    const found = drivers.find(d => d.name === driverName);
    if (found) {
      setVehicleNo(found.vehicleNo);
    }
  };

  // Toggle Outlet in Multi-select
  const toggleOutlet = (outletId: string) => {
    if (selectedOutletIds.includes(outletId)) {
      if (selectedOutletIds.length > 1) {
        setSelectedOutletIds(selectedOutletIds.filter(id => id !== outletId));
      }
    } else {
      setSelectedOutletIds([...selectedOutletIds, outletId]);
    }
  };

  const selectAllOutlets = () => {
    setSelectedOutletIds(outlets.map(o => o.id));
  };

  const clearOutletSelection = () => {
    if (outlets.length > 0) {
      setSelectedOutletIds([outlets[0].id]);
    }
  };

  // Auto-fill product details when batch is selected
  const handleBatchSelect = (rowId: string, batchNo: string) => {
    const selectedBatch = batches.find(b => b.batchNo === batchNo);
    setLineItems(prev =>
      prev.map(row => {
        if (row.id === rowId) {
          if (selectedBatch) {
            return {
              ...row,
              batchNo: selectedBatch.batchNo,
              batchId: selectedBatch.id,
              productName: selectedBatch.productName,
              prodDate: selectedBatch.prodDate,
              useByDate: selectedBatch.useByDate,
              dispatchTemp: selectedBatch.dispatchTemp,
              availableStock: selectedBatch.quantity
            };
          }
          return { ...row, batchNo };
        }
        return row;
      })
    );
  };

  const handleRowQuantityChange = (rowId: string, qty: number) => {
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, quantity: Math.max(0, qty) } : row))
    );
  };

  const handleRowTempChange = (rowId: string, temp: number) => {
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, dispatchTemp: temp } : row))
    );
  };

  // Manual row dispatch time entry
  const handleRowTimeChange = (rowId: string, time: string) => {
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, dispatchTime: time } : row))
    );
  };

  // Set single row time to current time
  const handleSetRowTimeToNow = (rowId: string) => {
    const nowTime = getCurrentTime();
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, dispatchTime: nowTime } : row))
    );
  };

  const handleRowProdDateChange = (rowId: string, pDate: string) => {
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, prodDate: pDate } : row))
    );
  };

  const handleRowUseByChange = (rowId: string, expDate: string) => {
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, useByDate: expDate } : row))
    );
  };

  const addCustomRow = () => {
    const newRow: DispatchLineItem = {
      id: `row-custom-${Date.now()}`,
      productName: INITIAL_PRODUCTS[0].name,
      batchNo: batches.length > 0 ? batches[0].batchNo : '',
      batchId: batches.length > 0 ? batches[0].id : undefined,
      dispatchTime: dispatchTime || getCurrentTime(),
      prodDate: batches.length > 0 ? batches[0].prodDate : getTodayDate(),
      useByDate: batches.length > 0 ? batches[0].useByDate : '',
      dispatchTemp: 3.5,
      quantity: 1,
      availableStock: batches.length > 0 ? batches[0].quantity : 0
    };
    setLineItems(prev => [...prev, newRow]);
  };

  const removeRow = (rowId: string) => {
    if (lineItems.length <= 1) {
      alert('At least one product line is required on the dispatch log.');
      return;
    }
    setLineItems(prev => prev.filter(r => r.id !== rowId));
  };

  // Supervisor name is locked to logged-in user profile
  const supervisorName = userProfile?.displayName || userProfile?.email || 'Barista IT Administrator';
  const supervisorId = userProfile?.uid || 'USR-AUTH';

  const selectedOutletNames = outlets
    .filter(o => selectedOutletIds.includes(o.id))
    .map(o => o.name);

  const filteredOutlets = outlets.filter(o => 
    o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
    o.outletId.toLowerCase().includes(outletSearch.toLowerCase()) ||
    (o.location ? o.location.toLowerCase().includes(outletSearch.toLowerCase()) : false)
  );

  // Summary calculations
  const totalUnits = lineItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const activeItemsCount = lineItems.filter(i => (i.quantity || 0) > 0).length;
  const isHaccpCompliant = lineItems.every(i => i.dispatchTemp <= 5.0);

  // Validate and Submit
  const handleSubmitDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Viewers cannot submit dispatch records. Switch to Admin or Editor role.');
      return;
    }

    if (selectedOutletIds.length === 0) {
      alert('Please select at least one delivery outlet first.');
      return;
    }

    const activeItems = lineItems.filter(i => i.quantity > 0);
    if (activeItems.length === 0) {
      alert('Please enter a quantity (> 0) for at least one product row to dispatch.');
      return;
    }

    // Check available stock
    for (const item of activeItems) {
      if (item.availableStock !== undefined && item.quantity > item.availableStock) {
        alert(
          `Cannot dispatch ${item.quantity} units of ${item.productName} (Batch ${item.batchNo}). Only ${item.availableStock} units remaining in central kitchen stock.`
        );
        return;
      }
    }

    setSubmitting(true);
    setSubmitSuccess(null);

    try {
      if (editingLogId) {
        // Updating existing log
        await updateDispatchLog(editingLogId, {
          date,
          dispatchTime,
          outletIds: selectedOutletIds,
          outletNames: selectedOutletNames,
          driverName: selectedDriverName,
          vehicleNo,
          items: activeItems,
          notes,
          haccpCompliant: activeItems.every(i => i.dispatchTemp <= 5.0)
        });
        const updatedLog: DispatchLog = {
          id: editingLogId,
          docNo: 'BCL/REC/HACCP/32',
          title: 'Central Kitchen Dispatch Log',
          revision: 'Rev 01',
          version: '01',
          effectiveDate: '01 January 2025',
          haccpLink: 'OPRP-2',
          approvedBy: 'QA Executive',
          date,
          dispatchTime,
          outletIds: selectedOutletIds,
          outletNames: selectedOutletNames,
          driverName: selectedDriverName,
          vehicleNo,
          supervisor: supervisorName,
          supervisorId: supervisorId,
          supervisorEmail: userProfile?.email || '',
          items: activeItems,
          notes,
          haccpCompliant: activeItems.every(i => i.dispatchTemp <= 5.0),
          status: 'edited',
          createdAt: new Date().toISOString()
        };
        setLastSubmittedLog(updatedLog);
        setSubmitSuccess(`Dispatch Log updated successfully!`);
        setEditingLogId(null);
      } else {
        // Creating new log with automated inventory deduction
        const newLogId = await createDispatchLogWithDeduction(
          {
            docNo: 'BCL/REC/HACCP/32',
            title: 'Central Kitchen Dispatch Log',
            revision: 'Rev 01',
            version: '01',
            effectiveDate: '01 January 2025',
            haccpLink: 'OPRP-2',
            approvedBy: 'QA Executive',
            date,
            dispatchTime,
            outletIds: selectedOutletIds,
            outletNames: selectedOutletNames,
            driverName: selectedDriverName,
            vehicleNo,
            supervisor: supervisorName,
            supervisorId: supervisorId,
            supervisorEmail: userProfile?.email || '',
            items: activeItems,
            notes,
            haccpCompliant: activeItems.every(i => i.dispatchTemp <= 5.0),
            status: 'submitted'
          },
          batches
        );
        const submittedDoc: DispatchLog = {
          id: newLogId,
          docNo: 'BCL/REC/HACCP/32',
          title: 'Central Kitchen Dispatch Log',
          revision: 'Rev 01',
          version: '01',
          effectiveDate: '01 January 2025',
          haccpLink: 'OPRP-2',
          approvedBy: 'QA Executive',
          date,
          dispatchTime,
          outletIds: selectedOutletIds,
          outletNames: selectedOutletNames,
          driverName: selectedDriverName,
          vehicleNo,
          supervisor: supervisorName,
          supervisorId: supervisorId,
          supervisorEmail: userProfile?.email || '',
          items: activeItems,
          notes,
          haccpCompliant: activeItems.every(i => i.dispatchTemp <= 5.0),
          status: 'submitted',
          createdAt: new Date().toISOString()
        };
        setLastSubmittedLog(submittedDoc);
        setSubmitSuccess(`Dispatch Log successfully submitted! Inventory quantities automatically deducted from kitchen batches.`);
      }

      // Reset quantities
      setLineItems(prev => prev.map(r => ({ ...r, quantity: 0 })));
    } catch (err: any) {
      alert('Error submitting dispatch log: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrieveForEdit = (log: DispatchLog) => {
    setEditingLogId(log.id);
    setDate(log.date);
    setDispatchTime(log.dispatchTime);
    setSelectedOutletIds(log.outletIds);
    setSelectedDriverName(log.driverName);
    setVehicleNo(log.vehicleNo || '');
    setNotes(log.notes || '');
    setLineItems(log.items);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrintCurrentDispatches = () => {
    const activeItems = lineItems.filter(i => (i.quantity || 0) > 0);
    if (activeItems.length === 0) {
      alert('Please enter a quantity (> 0) for at least one item before printing.');
      return;
    }
    const draftLog: DispatchLog = {
      id: `DSP-${Date.now().toString().slice(-4)}`,
      docNo: 'BCL/REC/HACCP/32',
      title: 'Central Kitchen Dispatch Log',
      revision: 'Rev 01',
      version: '01',
      effectiveDate: '01 January 2025',
      haccpLink: 'OPRP-2',
      approvedBy: 'QA Executive',
      date,
      dispatchTime,
      outletIds: selectedOutletIds,
      outletNames: selectedOutletNames,
      driverName: selectedDriverName,
      vehicleNo,
      supervisor: supervisorName,
      supervisorId: supervisorId,
      supervisorEmail: userProfile?.email || '',
      items: activeItems,
      notes,
      haccpCompliant: activeItems.every(i => i.dispatchTemp <= 5.0),
      status: 'submitted',
      createdAt: new Date().toISOString()
    };
    setSelectedLogForPrint(draftLog);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 print:hidden shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Central Kitchen Dispatch Form</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
              BCL/REC/HACCP/32
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Dispatch details with automatic or manual time entry, multi-outlet delivery, and cold-chain compliance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-xl bg-stone-800 p-1 border border-stone-700">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'create' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              {editingLogId ? 'Editing Form' : 'New Dispatch'}
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'submitted' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submitted Archive ({dispatchLogs.length})</span>
            </button>
          </div>

          <button
            onClick={handlePrintCurrentDispatches}
            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            title="Print Official HACCP Paper Dispatch Log (Selected Items Only)"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Print Dispatched Sheet</span>
          </button>
        </div>
      </div>

      {/* MODAL FOR PRINTING DISPATCH WITH ONLY SELECTED / ACTIVE ITEMS */}
      {selectedLogForPrint && (
        <PrintableDispatchSheet
          dispatchLog={selectedLogForPrint}
          onClose={() => setSelectedLogForPrint(null)}
          autoPrint={true}
        />
      )}

      {/* Floating Auto-fill Toast */}
      {timeSyncedNotice && (
        <div className="fixed top-20 right-6 z-50 bg-amber-500 text-stone-950 px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{timeSyncedNotice}</span>
        </div>
      )}

      {/* SUBMISSION SUCCESS MODAL / BANNER WITH DIRECT PRINT BUTTON */}
      {lastSubmittedLog && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-stone-900 to-stone-900 border-2 border-emerald-500/80 rounded-2xl p-5 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-extrabold text-sm sm:text-base text-white">
                Dispatch Successfully Submitted & Stock Deducted!
              </span>
              <span className="bg-emerald-900/90 border border-emerald-500 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                {lastSubmittedLog.items.length} Products Dispatched
              </span>
            </div>
            <p className="text-xs text-stone-300">
              Delivered to: <strong className="text-white">{lastSubmittedLog.outletNames.join(', ')}</strong> • Total Units: <strong className="text-amber-400 font-mono">{lastSubmittedLog.items.reduce((s, i) => s + i.quantity, 0)} units</strong> • Driver: {lastSubmittedLog.driverName} ({lastSubmittedLog.vehicleNo || 'Van'})
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedLogForPrint(lastSubmittedLog)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-lg transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Dispatched Items ({lastSubmittedLog.items.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLastSubmittedLog(null);
                setSubmitSuccess(null);
              }}
              className="text-stone-400 hover:text-white text-xs px-2.5 py-1.5 rounded-lg border border-stone-700 hover:bg-stone-800 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {submitSuccess && !lastSubmittedLog && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-2xl text-emerald-200 text-xs flex items-center justify-between print:hidden shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{submitSuccess}</span>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUBMITTED ARCHIVE TAB */}
      {activeTab === 'submitted' ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="font-bold text-white text-base">Submitted Dispatch Logs Archive</h3>
              <p className="text-xs text-stone-400">
                Retrieve submitted forms for edits, re-verification, or HACCP inspection.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              + Create New Dispatch
            </button>
          </div>

          {dispatchLogs.length === 0 ? (
            <div className="py-12 text-center text-stone-500 text-xs">
              No dispatch logs submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-800">
              {dispatchLogs.map((log) => (
                <div key={log.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">{log.docNo}</span>
                      <span className="text-xs bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                        Date: {log.date} @ {log.dispatchTime}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {log.haccpCompliant ? 'HACCP Compliant (≤5°C)' : 'Audit Warning'}
                      </span>
                    </div>

                    <div className="text-xs text-stone-300">
                      <strong>Outlets:</strong> {log.outletNames.join(', ')}
                    </div>

                    <div className="text-xs text-stone-400">
                      Driver: <span className="text-stone-300">{log.driverName}</span> ({log.vehicleNo || 'Van'}) • 
                      Supervisor: <span className="text-amber-300">{log.supervisor}</span> • 
                      Items: <span className="text-stone-300 font-semibold">{log.items.length} line items ({log.items.reduce((s, i) => s + i.quantity, 0)} units total)</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleRetrieveForEdit(log)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-amber-400 border border-stone-700 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Retrieve for Edit</span>
                    </button>

                    <button
                      onClick={() => setSelectedLogForPrint(log)}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-amber-400 border border-stone-700 hover:border-amber-500/50 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      title="Print official dispatch document for this record"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Sheet</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CREATE / EDIT FORM */
        <form onSubmit={handleSubmitDispatch} className="space-y-6">
          {editingLogId && (
            <div className="p-3 bg-blue-950/70 border border-blue-800 rounded-xl text-blue-200 text-xs flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Currently Editing Dispatch Log ID: <strong>{editingLogId}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingLogId(null);
                  setLineItems(prev => prev.map(r => ({ ...r, quantity: 0 })));
                }}
                className="text-xs text-blue-300 underline hover:text-white"
              >
                Cancel Edit Mode
              </button>
            </div>
          )}

          {/* PRINTABLE OFFICIAL HACCP DOCUMENT WRAPPER */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl print:bg-white print:text-black print:p-2 print:border-none print:shadow-none">
            {/* Header Document Table */}
            <div className="border border-stone-700 print:border-black rounded-xl overflow-hidden mb-5">
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stone-700 print:divide-black text-xs">
                {/* Brand Logo Box */}
                <div className="p-4 flex flex-col justify-center items-center bg-stone-850 print:bg-white text-center">
                  <span className="font-serif font-black tracking-widest text-2xl text-amber-500 print:text-black">
                    BARISTA
                  </span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-stone-300 print:text-black">
                    SRI LANKA — CENTRAL KITCHEN
                  </span>
                  <span className="text-[9px] text-stone-400 print:text-gray-600 mt-0.5 font-mono">
                    BCL/REC/HACCP/32
                  </span>
                </div>

                {/* Form Metadata */}
                <div className="p-3 space-y-1 bg-stone-900 print:bg-white">
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Record Code:</span>
                    <strong className="text-white print:text-black font-mono">BCL/REC/HACCP/32</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Title:</span>
                    <strong className="text-amber-400 print:text-black">Dispatch Log</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Effective Date:</span>
                    <span className="text-stone-300 print:text-black font-mono">01 January 2025</span>
                  </div>
                </div>

                <div className="p-3 space-y-1 bg-stone-900 print:bg-white">
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Revision:</span>
                    <span className="text-stone-300 print:text-black font-mono">Rev 01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Version:</span>
                    <span className="text-stone-300 print:text-black font-mono">01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">HACCP Link:</span>
                    <strong className="text-cyan-400 print:text-black font-mono">OPRP-2</strong>
                  </div>
                </div>

                <div className="p-3 space-y-1 bg-stone-900 print:bg-white">
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Approved By:</span>
                    <strong className="text-emerald-400 print:text-black font-semibold">QA Executive</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400 print:text-gray-700">Standard:</span>
                    <span className="text-stone-300 print:text-black">HACCP Compliant</span>
                  </div>
                </div>
              </div>

              {/* Compliance Warning Banner */}
              <div className="bg-stone-800/90 print:bg-gray-100 p-2.5 text-[11px] text-stone-300 print:text-black border-t border-stone-700 print:border-black italic flex items-center space-x-2">
                <ThermometerSnowflake className="w-4 h-4 text-amber-400 print:text-black shrink-0" />
                <span>
                  <strong>HACCP Requirement:</strong> Complete for EVERY dispatch. No product may leave the kitchen without a complete Dispatch Log. Dispatch temperature must be <strong>≤5°C</strong>.
                </span>
              </div>
            </div>

            {/* Outlet Selection & Dispatch Date/Time Section */}
            <div className="bg-stone-850/70 print:bg-white border border-stone-800 print:border-black rounded-xl p-4 sm:p-5 mb-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Outlets Selection (6 columns) */}
                <div className="lg:col-span-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white print:text-black flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-amber-400 print:text-black" />
                      <span>Destination Outlets</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                        {selectedOutletIds.length} Selected
                      </span>
                    </label>
                    <div className="flex items-center space-x-2 print:hidden text-[11px]">
                      <button
                        type="button"
                        onClick={selectAllOutlets}
                        className="text-amber-400 hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-stone-600">•</span>
                      <button
                        type="button"
                        onClick={clearOutletSelection}
                        className="text-stone-400 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Outlets Search Filter */}
                  <div className="relative print:hidden">
                    <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={outletSearch}
                      onChange={(e) => setOutletSearch(e.target.value)}
                      placeholder="Quick filter outlets..."
                      className="w-full pl-8 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-xl">
                    {filteredOutlets.map((outlet) => {
                      const isSelected = selectedOutletIds.includes(outlet.id);
                      return (
                        <button
                          key={outlet.id}
                          type="button"
                          onClick={() => toggleOutlet(outlet.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 border ${
                            isSelected
                              ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold shadow-sm print:bg-gray-200 print:text-black'
                              : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750 print:bg-white print:text-black'
                          }`}
                        >
                          <span className="font-mono text-[10px]">{outlet.outletId}:</span>
                          <span>{outlet.name}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-amber-300/90 print:text-black font-semibold truncate">
                    Routing to: {selectedOutletNames.join(', ') || 'None selected'}
                  </div>
                </div>

                {/* Date, Dispatch Time & Driver (6 columns) */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold text-white print:text-black mb-1">
                        Dispatch Date
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-100 print:text-black focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    {/* DISPATCH TIME WITH AUTO-FILL AND MANUAL ENTRY */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-white print:text-black flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400 print:text-black" />
                          <span>Dispatch Time</span>
                        </label>
                        {/* Auto-fill Current Time Button */}
                        <button
                          type="button"
                          onClick={handleAutoFillNow}
                          className="text-[11px] text-amber-400 hover:text-amber-300 print:hidden font-bold flex items-center space-x-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/20 transition"
                          title="Auto-fill current time to this field and all table rows"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Auto-fill Now</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <input
                          type="time"
                          required
                          value={dispatchTime}
                          onChange={(e) => handleTopDispatchTimeChange(e.target.value)}
                          className="flex-1 px-3 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-100 print:text-black font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleSyncAllRowsToTopTime}
                          className="px-2.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg text-[10px] font-semibold transition cursor-pointer print:hidden shrink-0 flex items-center space-x-1"
                          title="Sync this dispatch time to all line items below"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Sync Rows</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Time Presets (UX enhancement) */}
                  <div className="flex items-center space-x-1.5 print:hidden">
                    <span className="text-[10px] text-stone-400">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleTopDispatchTimeChange(getCurrentTime())}
                      className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded text-stone-300 cursor-pointer"
                    >
                      Now ({getCurrentTime()})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTopDispatchTimeChange(getTimeWithOffset(15))}
                      className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded text-stone-300 cursor-pointer"
                    >
                      +15m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTopDispatchTimeChange('06:30')}
                      className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded text-stone-300 cursor-pointer"
                    >
                      06:30
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTopDispatchTimeChange('14:00')}
                      className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 rounded text-stone-300 cursor-pointer"
                    >
                      14:00
                    </button>
                    <label className="text-[10px] text-stone-400 flex items-center space-x-1 ml-auto cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncTimeToRows}
                        onChange={(e) => setSyncTimeToRows(e.target.checked)}
                        className="rounded border-stone-700 bg-stone-900 text-amber-500 w-3 h-3"
                      />
                      <span>Auto-apply to rows</span>
                    </label>
                  </div>

                  {/* Driver & Vehicle */}
                  <div>
                    <label className="block text-xs font-bold text-white print:text-black mb-1">
                      Assigned Driver & Refrigerated Vehicle
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={selectedDriverName}
                        onChange={(e) => handleDriverChange(e.target.value)}
                        className="flex-1 px-3 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-100 print:text-black focus:outline-none focus:border-amber-500"
                      >
                        {drivers.map((drv) => (
                          <option key={drv.id} value={drv.name}>
                            {drv.name} — {drv.vehicleNo}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Vehicle No"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value)}
                        className="w-36 px-2.5 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-200 print:text-black font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-stone-700 print:border-black rounded-xl overflow-hidden mb-5 shadow-sm">
              <div className="bg-stone-800 print:bg-gray-200 px-4 py-2.5 border-b border-stone-700 print:border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-400 print:text-black">
                    Pastry Kitchen Items & Cold-Chain Dispatch Verification
                  </span>
                  <span className="text-[10px] bg-stone-900 text-stone-300 px-2 py-0.5 rounded font-mono">
                    {lineItems.length} Products
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 print:hidden">
                  <button
                    type="button"
                    onClick={handlePrintCurrentDispatches}
                    className="px-2.5 py-1 bg-stone-750 hover:bg-stone-700 text-amber-400 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm"
                    title="Print only items with quantity > 0"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print Dispatched Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncAllRowsToTopTime}
                    className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                    title="Set all row dispatch times to the header dispatch time"
                  >
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Auto-fill All Times</span>
                  </button>

                  <button
                    type="button"
                    onClick={addCustomRow}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Product Row</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-850 print:bg-gray-100 text-stone-300 print:text-black font-bold uppercase tracking-wider border-b border-stone-700 print:border-black">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[200px]">Product Name</th>
                      <th className="py-2.5 px-3 w-36">
                        <div className="flex items-center justify-between">
                          <span>Dispatch Time</span>
                          <span className="text-[9px] font-normal text-amber-400 lowercase print:hidden">
                            (auto/manual)
                          </span>
                        </div>
                      </th>
                      <th className="py-2.5 px-3 w-40">Batch No (FIFO)</th>
                      <th className="py-2.5 px-3 w-28 text-center">Qty (Manual)</th>
                      <th className="py-2.5 px-3 w-32">Prod. Date</th>
                      <th className="py-2.5 px-3 w-32">Use-By Date</th>
                      <th className="py-2.5 px-3 w-28">Dispatch Temp °C</th>
                      <th className="py-2.5 px-3 w-10 text-right print:hidden">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 print:divide-black">
                    {lineItems.map((item) => {
                      const productBatches = batches.filter(
                        b => b.productName.toLowerCase() === item.productName.toLowerCase()
                      );

                      const isTempWarm = item.dispatchTemp > 5.0;
                      const isOutOfStock = item.availableStock !== undefined && item.availableStock <= 0;
                      const isQtyExceeded = item.availableStock !== undefined && item.quantity > item.availableStock;

                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-stone-800/40 print:hover:bg-transparent transition ${
                            item.quantity === 0 ? 'print:hidden' : ''
                          }`}
                        >
                          {/* Product Name */}
                          <td className="py-2 px-3 font-semibold text-white print:text-black">
                            <input
                              type="text"
                              value={item.productName}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setLineItems(prev =>
                                  prev.map(r => (r.id === item.id ? { ...r, productName: newName } : r))
                                );
                              }}
                              className="w-full bg-transparent border-none text-white print:text-black font-semibold text-xs focus:ring-0 focus:outline-none"
                            />
                            {item.availableStock !== undefined && (
                              <div className="flex items-center space-x-1.5 mt-0.5 print:hidden">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  isOutOfStock
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : 'bg-stone-800 text-stone-400'
                                }`}>
                                  In Stock: {item.availableStock}
                                </span>
                                {isQtyExceeded && (
                                  <span className="text-[10px] text-red-400 font-bold animate-pulse">
                                    Exceeds stock!
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* DISPATCH TIME (CAN BE AUTO-FILLED OR MANUALLY ENTERED) */}
                          <td className="py-2 px-3">
                            <div className="flex items-center space-x-1">
                              <input
                                type="time"
                                value={item.dispatchTime || dispatchTime}
                                onChange={(e) => handleRowTimeChange(item.id, e.target.value)}
                                className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-stone-100 print:text-black font-mono focus:border-amber-500 focus:outline-none"
                                title="Manual time entry or auto-filled"
                              />
                              <button
                                type="button"
                                onClick={() => handleSetRowTimeToNow(item.id)}
                                className="p-1 bg-stone-700 hover:bg-stone-650 text-amber-400 hover:text-amber-300 rounded text-[10px] print:hidden transition cursor-pointer shrink-0"
                                title="Set this row to current time"
                              >
                                Now
                              </button>
                            </div>
                          </td>

                          {/* Batch No */}
                          <td className="py-2 px-3">
                            <select
                              value={item.batchNo}
                              onChange={(e) => handleBatchSelect(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-amber-400 print:text-black font-mono font-bold focus:outline-none"
                            >
                              <option value="">-- Select Batch --</option>
                              {productBatches.map(b => (
                                <option key={b.id} value={b.batchNo}>
                                  {b.batchNo} (Qty: {b.quantity})
                                </option>
                              ))}
                              <optgroup label="All Kitchen Batches">
                                {batches
                                  .filter(b => b.productName.toLowerCase() !== item.productName.toLowerCase())
                                  .map(b => (
                                    <option key={b.id} value={b.batchNo}>
                                      {b.batchNo} — {b.productName}
                                    </option>
                                  ))}
                              </optgroup>
                            </select>
                          </td>

                          {/* Quantity (Manual with +/- steppers for better touch UX) */}
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleRowQuantityChange(item.id, Math.max(0, item.quantity - 1))}
                                className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold text-xs print:hidden cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => handleRowQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                className={`w-14 px-1.5 py-1 bg-stone-800 print:bg-white border rounded text-center text-xs text-white print:text-black font-bold font-mono focus:outline-none ${
                                  isQtyExceeded ? 'border-red-500 text-red-400' : 'border-amber-600/70'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleRowQuantityChange(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center font-bold text-xs print:hidden cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Prod. Date */}
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={item.prodDate}
                              onChange={(e) => handleRowProdDateChange(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-stone-300 print:text-black font-mono focus:outline-none"
                            />
                          </td>

                          {/* Use-By Date */}
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={item.useByDate}
                              onChange={(e) => handleRowUseByChange(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-stone-300 print:text-black font-mono focus:outline-none"
                            />
                          </td>

                          {/* Dispatch Temp °C */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.1"
                              value={item.dispatchTemp}
                              onChange={(e) => handleRowTempChange(item.id, parseFloat(e.target.value) || 0)}
                              className={`w-full px-2 py-1 bg-stone-800 print:bg-white border rounded text-xs font-mono font-bold focus:outline-none ${
                                isTempWarm
                                  ? 'border-red-600 text-red-400 print:text-black'
                                  : 'border-cyan-600 text-cyan-300 print:text-black'
                              }`}
                            />
                          </td>

                          {/* Delete row */}
                          <td className="py-2 px-3 text-right print:hidden">
                            <button
                              type="button"
                              onClick={() => removeRow(item.id)}
                              className="text-stone-500 hover:text-red-400 p-1 cursor-pointer transition"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Sign-off and Supervisor Locked Box */}
            <div className="border border-stone-700 print:border-black rounded-xl p-4 bg-stone-850/60 print:bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delivery Notes */}
                <div>
                  <label className="block text-xs font-bold text-white print:text-black mb-1">
                    Transit & Quality Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Insulated transit containers sealed with ice packs. Maximum 2-hour transit maintained."
                    className="w-full p-2.5 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-200 print:text-black focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Supervisor / QA Sign (STRICTLY LOCKED) */}
                <div className="bg-stone-900 print:bg-gray-100 p-3.5 rounded-xl border border-stone-700 print:border-black flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 mb-1">
                      <UserCheck className="w-4 h-4 text-emerald-400 print:text-black" />
                      <span className="text-xs font-bold text-white print:text-black uppercase">
                        Supervisor / QA Sign Off (Locked)
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 print:text-gray-600 mb-2">
                      Automatically linked to authenticated user session. This field is non-modifiable per HACCP audit requirements.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800 print:border-black">
                    <div>
                      <div className="text-xs font-bold text-amber-400 print:text-black font-mono">
                        {supervisorName}
                      </div>
                      <div className="text-[10px] text-stone-400 print:text-gray-600">
                        Designation: {userProfile?.designation || 'Central Kitchen Administrator'} • {userProfile?.userIdCode || 'USR-ADM-01'}
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 print:border-black px-2 py-0.5 rounded font-mono font-bold">
                      VERIFIED SIGNATURE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Footer Notice */}
            <div className="hidden print:block mt-6 pt-3 border-t border-black text-[10px] text-gray-700 text-center">
              CONFIDENTIAL — INTERNAL USE ONLY | Barista Coffee Lanka | Printed copies are UNCONTROLLED
            </div>
          </div>

          {/* Form Real-time Summary & Action Bar */}
          <div className="bg-stone-900 border border-stone-800 p-4 sm:p-5 rounded-2xl print:hidden shadow-lg space-y-3">
            {/* Live summary pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-stone-400">Dispatch Summary:</span>
                <span className="bg-stone-800 px-2.5 py-1 rounded-lg text-white font-mono font-bold">
                  {activeItemsCount} Products with Qty
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-mono font-bold">
                  {totalUnits} Total Units
                </span>
                <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 ${
                  isHaccpCompliant
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
                }`}>
                  <ThermometerSnowflake className="w-3.5 h-3.5" />
                  <span>{isHaccpCompliant ? 'Cold-Chain Safe (≤5°C)' : 'Warning: High Temp (>5°C)'}</span>
                </span>
              </div>

              <div className="text-stone-400 font-mono text-[11px]">
                Driver: <strong className="text-stone-200">{selectedDriverName}</strong> ({vehicleNo})
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-stone-400">
                Submitting this dispatch log will <strong>automatically reduce stock</strong> from the respective batches in real-time.
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setLineItems(prev => prev.map(r => ({ ...r, quantity: 0 })))}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Clear Quantities
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-extrabold rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting & Adjusting Inventory...' : editingLogId ? 'Update Dispatch Log' : 'Submit Dispatch & Deduct Stock'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
