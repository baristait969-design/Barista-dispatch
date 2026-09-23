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
  Eye
} from 'lucide-react';
import { InventoryBatch, Outlet, Driver, DispatchLog, DispatchLineItem } from '../types';
import { INITIAL_PRODUCTS } from '../data/seedData';
import { createDispatchLogWithDeduction, updateDispatchLog } from '../services/dataService';

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

  // Automatic current time in HH:MM
  const getCurrentTime = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Selected Outlets (Single or Multiple)
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>(
    outlets.length > 0 ? [outlets[0].id] : []
  );

  const [date, setDate] = useState<string>(getTodayDate());
  const [dispatchTime, setDispatchTime] = useState<string>(getCurrentTime());
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
    // Initial pastry rows pre-populated like Photo 2
    return INITIAL_PRODUCTS.slice(0, 5).map((prod, idx) => {
      // Find latest batch for this product (FIFO)
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

  const handleRowTimeChange = (rowId: string, time: string) => {
    setLineItems(prev =>
      prev.map(row => (row.id === rowId ? { ...row, dispatchTime: time } : row))
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
      dispatchTime: getCurrentTime(),
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
  const supervisorName = userProfile?.displayName || userProfile?.email || 'Supervisor / QA Inspector';
  const supervisorId = userProfile?.uid || 'USR-AUTH';

  const selectedOutletNames = outlets
    .filter(o => selectedOutletIds.includes(o.id))
    .map(o => o.name);

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

    // Filter items with quantity > 0
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
        setSubmitSuccess(`Dispatch Log updated successfully!`);
        setEditingLogId(null);
      } else {
        // Creating new log with automated inventory deduction!
        const newId = await createDispatchLogWithDeduction(
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Central Kitchen Dispatch Form</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
              BCL/REC/HACCP/32
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Fill dispatch details, select single/multiple outlets, auto-fill times, auto-adjust stock levels, and assign drivers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg bg-stone-800 p-1 border border-stone-700">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'create' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              {editingLogId ? 'Editing Form' : 'New Dispatch'}
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'submitted' ? 'bg-amber-600 text-stone-950 shadow-sm' : 'text-stone-300 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submitted Archive ({dispatchLogs.length})</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            title="Print Official HACCP Paper Dispatch Log"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Print Document</span>
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{submitSuccess}</span>
          </div>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-400 hover:text-white text-xs underline"
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
              className="text-xs text-amber-400 hover:underline"
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
                      onClick={() => {
                        handleRetrieveForEdit(log);
                        setTimeout(() => window.print(), 300);
                      }}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-400" />
                      <span>Print Sheet</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* CREATE / EDIT FORM - EXACT MATCH TO PHOTO 2 */
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

          {/* PRINTABLE OFFICIAL HACCP DOCUMENT WRAPPER (Photo 2) */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl print:bg-white print:text-black print:p-2 print:border-none print:shadow-none">
            {/* Header Document Table (Exactly like Photo 2 header) */}
            <div className="border border-stone-700 print:border-black rounded-lg overflow-hidden mb-5">
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

                {/* Form Metadata Table */}
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

              {/* Compliance Warning Banner from Photo 2 */}
              <div className="bg-stone-800/90 print:bg-gray-100 p-2.5 text-[11px] text-stone-300 print:text-black border-t border-stone-700 print:border-black italic flex items-center space-x-2">
                <ThermometerSnowflake className="w-4 h-4 text-amber-400 print:text-black shrink-0" />
                <span>
                  <strong>HACCP Requirement:</strong> Complete for EVERY dispatch. No product may leave the kitchen without a complete Dispatch Log. Dispatch temperature must be <strong>≤5°C</strong>. Cream cakes and Cold Cheesecake: maximum 2-hour transit at ≤5°C.
                </span>
              </div>
            </div>

            {/* Outlet Selection & Dispatch Date/Time Section */}
            <div className="bg-stone-850/60 print:bg-white border border-stone-800 print:border-black rounded-xl p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Outlet Selection (Single or Multiple) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-white print:text-black flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-amber-400 print:text-black" />
                      <span>Select Destination Outlet(s):</span>
                    </label>
                    <span className="text-[10px] text-stone-400 print:text-gray-600">
                      (Select single or multiple branches)
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg">
                    {outlets.map((outlet) => {
                      const isSelected = selectedOutletIds.includes(outlet.id);
                      return (
                        <button
                          key={outlet.id}
                          type="button"
                          onClick={() => toggleOutlet(outlet.id)}
                          className={`px-2.5 py-1 rounded text-xs transition cursor-pointer flex items-center space-x-1.5 border ${
                            isSelected
                              ? 'bg-amber-600 text-stone-950 border-amber-500 font-bold print:bg-gray-200 print:text-black'
                              : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-750 print:bg-white print:text-black'
                          }`}
                        >
                          <span className="font-mono text-[10px]">{outlet.outletId}:</span>
                          <span>{outlet.name}</span>
                          {isSelected && <span>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-1 text-[11px] text-amber-400 print:text-black font-semibold">
                    Dispatched To: {selectedOutletNames.join(', ') || 'No outlet selected'}
                  </div>
                </div>

                {/* Date & Dispatch Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-white print:text-black mb-1">
                      Dispatch Date
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-100 print:text-black focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-white print:text-black flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400 print:text-black" />
                        <span>Dispatch Time</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setDispatchTime(getCurrentTime())}
                        className="text-[10px] text-amber-400 print:hidden hover:underline cursor-pointer"
                        title="Auto-fill current time"
                      >
                        Auto-fill now
                      </button>
                    </div>
                    <input
                      type="time"
                      required
                      value={dispatchTime}
                      onChange={(e) => setDispatchTime(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-100 print:text-black font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-2">
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
                        className="w-36 px-2.5 py-2 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-300 print:text-black font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table (Matching Photo 2 Columns exactly!) */}
            <div className="border border-stone-700 print:border-black rounded-xl overflow-hidden mb-5">
              <div className="bg-stone-800 print:bg-gray-200 px-4 py-2 border-b border-stone-700 print:border-black flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-400 print:text-black">
                  Pastry Kitchen Items & Cold-Chain Dispatch Verification
                </span>
                <button
                  type="button"
                  onClick={addCustomRow}
                  className="px-2.5 py-1 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded text-[11px] font-semibold transition print:hidden flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Row</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-850 print:bg-gray-100 text-stone-300 print:text-black font-bold uppercase tracking-wider border-b border-stone-700 print:border-black">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[200px]">Product Name</th>
                      <th className="py-2.5 px-3 w-28">Dispatch Time</th>
                      <th className="py-2.5 px-3 w-40">Batch No (FIFO)</th>
                      <th className="py-2.5 px-3 w-24 text-center">Qty (Manual)</th>
                      <th className="py-2.5 px-3 w-32">Prod. Date</th>
                      <th className="py-2.5 px-3 w-32">Use-By Date</th>
                      <th className="py-2.5 px-3 w-28">Dispatch Temp °C</th>
                      <th className="py-2.5 px-3 w-10 text-right print:hidden">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800 print:divide-black">
                    {lineItems.map((item) => {
                      // Filter batches for this product
                      const productBatches = batches.filter(
                        b => b.productName.toLowerCase() === item.productName.toLowerCase()
                      );

                      const isTempWarm = item.dispatchTemp > 5.0;

                      return (
                        <tr key={item.id} className="hover:bg-stone-800/30 print:hover:bg-transparent">
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
                              <span className="text-[10px] text-stone-400 print:hidden block">
                                In Stock: {item.availableStock} units
                              </span>
                            )}
                          </td>

                          {/* Dispatch Time */}
                          <td className="py-2 px-3">
                            <input
                              type="time"
                              value={item.dispatchTime || dispatchTime}
                              onChange={(e) => handleRowTimeChange(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-stone-200 print:text-black font-mono"
                            />
                          </td>

                          {/* Batch No (Select latest batch first) */}
                          <td className="py-2 px-3">
                            <select
                              value={item.batchNo}
                              onChange={(e) => handleBatchSelect(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-amber-400 print:text-black font-mono font-bold"
                            >
                              <option value="">-- Select Batch --</option>
                              {/* Product-specific batches first */}
                              {productBatches.map(b => (
                                <option key={b.id} value={b.batchNo}>
                                  {b.batchNo} (Qty: {b.quantity})
                                </option>
                              ))}
                              {/* All batches fallback */}
                              <optgroup label="Other Central Kitchen Batches">
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

                          {/* Quantity (Manual) */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min={0}
                              value={item.quantity}
                              onChange={(e) => handleRowQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-20 mx-auto px-2 py-1 bg-stone-800 print:bg-white border border-amber-600/70 print:border-black rounded text-center text-xs text-white print:text-black font-bold"
                            />
                          </td>

                          {/* Prod. Date */}
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={item.prodDate}
                              onChange={(e) => handleRowProdDateChange(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-stone-300 print:text-black"
                            />
                          </td>

                          {/* Use-By Date */}
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={item.useByDate}
                              onChange={(e) => handleRowUseByChange(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-stone-800 print:bg-white border border-stone-700 print:border-black rounded text-xs text-stone-300 print:text-black"
                            />
                          </td>

                          {/* Dispatch Temp °C */}
                          <td className="py-2 px-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={item.dispatchTemp}
                                onChange={(e) => handleRowTempChange(item.id, parseFloat(e.target.value) || 0)}
                                className={`w-full px-2 py-1 bg-stone-800 print:bg-white border rounded text-xs font-mono font-bold ${
                                  isTempWarm
                                    ? 'border-red-600 text-red-400 print:text-black'
                                    : 'border-cyan-600 text-cyan-300 print:text-black'
                                }`}
                              />
                            </div>
                          </td>

                          {/* Delete row */}
                          <td className="py-2 px-3 text-right print:hidden">
                            <button
                              type="button"
                              onClick={() => removeRow(item.id)}
                              className="text-stone-500 hover:text-red-400 p-1"
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

            {/* Bottom Sign-off and Supervisor Locked Box (From Photo 2) */}
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
                    placeholder="e.g. Insulated transit boxes sealed with ice gel packs. Maximum 2-hour transit maintained."
                    className="w-full p-2.5 bg-stone-900 print:bg-white border border-stone-700 print:border-black rounded-lg text-xs text-stone-200 print:text-black focus:outline-none"
                  />
                </div>

                {/* Supervisor / QA Sign (STRICTLY LOCKED AS REQUESTED) */}
                <div className="bg-stone-900 print:bg-gray-100 p-3.5 rounded-lg border border-stone-700 print:border-black flex flex-col justify-between">
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
                        Designation: {userProfile?.designation || 'Central Kitchen Supervisor'} • {userProfile?.userIdCode || 'QA-ID'}
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

          {/* Form Actions (Hidden on Print) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-4 rounded-xl print:hidden">
            <div className="text-xs text-stone-400">
              Submitting this dispatch log will <strong>automatically reduce stock</strong> from the respective batches in real-time.
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setLineItems(prev => prev.map(r => ({ ...r, quantity: 0 })))}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Clear Quantities
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold rounded-lg text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting & Adjusting Inventory...' : editingLogId ? 'Update Dispatch Log' : 'Submit Dispatch & Deduct Stock'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
