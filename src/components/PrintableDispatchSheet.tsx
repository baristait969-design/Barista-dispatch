import React from 'react';
import { Printer, X, CheckCircle2, AlertTriangle, ShieldCheck, ThermometerSnowflake, FileText } from 'lucide-react';
import { DispatchLog, DispatchLineItem } from '../types';
import { BaristaLogo } from './BaristaLogo';

interface PrintableDispatchSheetProps {
  dispatchLog: Partial<DispatchLog> & {
    items: DispatchLineItem[];
    outletNames: string[];
    date: string;
    dispatchTime: string;
    driverName: string;
    supervisor: string;
  };
  onClose?: () => void;
  autoPrint?: boolean;
}

export const PrintableDispatchSheet: React.FC<PrintableDispatchSheetProps> = ({
  dispatchLog,
  onClose,
  autoPrint = false
}) => {
  // Filter ONLY items with quantity > 0
  const activeItems = dispatchLog.items.filter(item => item.quantity > 0);
  const totalUnits = activeItems.reduce((acc, item) => acc + item.quantity, 0);
  const isAllHaccpCompliant = activeItems.every(item => item.dispatchTemp <= 5.0);

  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto print:backdrop-blur-none">
      <div className="relative w-full max-w-4xl bg-white text-stone-900 rounded-2xl shadow-2xl p-6 sm:p-8 print:p-4 print:shadow-none print:rounded-none print:w-full print:max-w-none">
        
        {/* Screen Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-200 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-1 rounded-md font-bold font-mono">
              HACCP BCL/REC/HACCP/32
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Official Printed Dispatch Sheet (Selected Items Only)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
                title="Close Sheet"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* PRINTABLE OFFICIAL HACCP DOCUMENT */}
        <div className="print-content text-stone-900">
          
          {/* Header Grid */}
          <div className="border-2 border-stone-900 mb-4">
            <div className="grid grid-cols-12 divide-y md:divide-y-0 md:divide-x-2 divide-stone-900">
              
              {/* Brand Logo & Name (4 cols) */}
              <div className="col-span-12 md:col-span-4 p-4 flex flex-col justify-center items-center text-center bg-stone-50">
                <BaristaLogo className="w-12 h-12 mb-1 shadow-sm" />
                <h1 className="font-serif font-black tracking-widest text-xl text-stone-900 leading-none">
                  BARISTA
                </h1>
                <p className="text-[10px] font-bold tracking-wider uppercase text-stone-700 mt-0.5">
                  SRI LANKA — CENTRAL KITCHEN
                </p>
                <p className="text-[9px] text-stone-500 font-mono mt-0.5">
                  Barista Coffee Lanka (Pvt) Ltd.
                </p>
              </div>

              {/* Document Identity (4 cols) */}
              <div className="col-span-12 md:col-span-4 p-3 text-xs space-y-1">
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500">Document Code:</span>
                  <span className="font-mono font-bold text-stone-900">BCL/REC/HACCP/32</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500">Record Title:</span>
                  <span className="font-bold text-stone-900">Dispatch Log & Receipt</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500">Effective Date:</span>
                  <span className="font-mono text-stone-800">01 January 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">HACCP Link:</span>
                  <span className="font-mono font-bold text-blue-800">OPRP-2 (Cold-Chain ≤5°C)</span>
                </div>
              </div>

              {/* Governance & QA (4 cols) */}
              <div className="col-span-12 md:col-span-4 p-3 text-xs space-y-1 bg-stone-50/50">
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500">Revision:</span>
                  <span className="font-mono text-stone-800">Rev 01</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500">Version:</span>
                  <span className="font-mono text-stone-800">01</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span className="text-stone-500">Approved By:</span>
                  <span className="font-bold text-stone-900">QA Executive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Log Ref / ID:</span>
                  <span className="font-mono font-bold text-stone-800 truncate max-w-[130px]">
                    {dispatchLog.id || `DSP-${Date.now().toString().slice(-6)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-banner: HACCP Cold Chain Mandate */}
            <div className="bg-stone-100 p-2 border-t-2 border-stone-900 flex items-center justify-between text-[11px] px-3">
              <div className="flex items-center space-x-2">
                <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-700" />
                <span className="font-semibold text-stone-800">
                  CRITICAL CONTROL REQUIREMENT: Maximum dispatch transit temperature must remain ≤ 5.0°C.
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-600">
                Official Controlled Copy
              </span>
            </div>
          </div>

          {/* Delivery & Logistics Manifest Details */}
          <div className="border border-stone-300 rounded-lg p-3.5 mb-4 bg-stone-50/60 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-semibold">Destination Outlets</span>
                <span className="font-bold text-stone-900 text-sm">
                  {dispatchLog.outletNames && dispatchLog.outletNames.length > 0 
                    ? dispatchLog.outletNames.join(', ')
                    : 'All Assigned Outlets'}
                </span>
              </div>

              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-semibold">Date & Dispatch Time</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {dispatchLog.date} @ {dispatchLog.dispatchTime} hrs
                </span>
              </div>

              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-semibold">Driver & Refrigerated Vehicle</span>
                <span className="font-bold text-stone-900 text-sm">
                  {dispatchLog.driverName} • <span className="font-mono">{dispatchLog.vehicleNo || 'Van'}</span>
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-stone-500">Dispatch QA / Supervisor: </span>
                <strong className="text-stone-900">{dispatchLog.supervisor}</strong>
                {dispatchLog.supervisorId && (
                  <span className="text-stone-500 font-mono ml-1">({dispatchLog.supervisorId})</span>
                )}
              </div>
              {dispatchLog.notes && (
                <div>
                  <span className="text-stone-500">Transit Notes: </span>
                  <span className="text-stone-800 italic">{dispatchLog.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Dispatches Table (ONLY ITEMS DISPATCHED) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-stone-800">
                Dispatched Kitchen Line Items ({activeItems.length} Products)
              </span>
              <span className="text-[10px] text-stone-500 font-mono">
                Printed only items with quantity &gt; 0
              </span>
            </div>

            {activeItems.length === 0 ? (
              <div className="border border-stone-300 p-8 text-center text-xs text-stone-500 italic">
                No products with quantity &gt; 0 selected for dispatch.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse border border-stone-900">
                <thead>
                  <tr className="bg-stone-100 text-stone-900 border-b-2 border-stone-900 font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2 border-r border-stone-400 w-8 text-center">#</th>
                    <th className="p-2 border-r border-stone-400">Product Description</th>
                    <th className="p-2 border-r border-stone-400 w-28">Batch No (FIFO)</th>
                    <th className="p-2 border-r border-stone-400 w-20 text-center">Dispatch Time</th>
                    <th className="p-2 border-r border-stone-400 w-24">Prod Date</th>
                    <th className="p-2 border-r border-stone-400 w-24">Use-By Date</th>
                    <th className="p-2 border-r border-stone-400 w-20 text-center">Qty (Units)</th>
                    <th className="p-2 border-r border-stone-400 w-24 text-center">Temp °C</th>
                    <th className="p-2 w-24 text-center">HACCP Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-300">
                  {activeItems.map((item, index) => {
                    const isCompliant = item.dispatchTemp <= 5.0;
                    return (
                      <tr key={item.id || index} className="text-stone-900">
                        <td className="p-2 border-r border-stone-300 text-center font-mono font-bold text-stone-500">
                          {index + 1}
                        </td>
                        <td className="p-2 border-r border-stone-300 font-bold">
                          {item.productName}
                        </td>
                        <td className="p-2 border-r border-stone-300 font-mono font-semibold text-stone-800">
                          {item.batchNo || 'N/A'}
                        </td>
                        <td className="p-2 border-r border-stone-300 text-center font-mono">
                          {item.dispatchTime || dispatchLog.dispatchTime}
                        </td>
                        <td className="p-2 border-r border-stone-300 font-mono text-stone-700">
                          {item.prodDate || '-'}
                        </td>
                        <td className="p-2 border-r border-stone-300 font-mono text-stone-700">
                          {item.useByDate || '-'}
                        </td>
                        <td className="p-2 border-r border-stone-300 text-center font-mono font-bold text-sm bg-stone-50">
                          {item.quantity}
                        </td>
                        <td className="p-2 border-r border-stone-300 text-center font-mono font-bold">
                          <span className={isCompliant ? 'text-stone-900' : 'text-red-600 underline'}>
                            {item.dispatchTemp.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="p-2 text-center font-mono text-[10px] font-bold">
                          {isCompliant ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              PASS (≤5°C)
                            </span>
                          ) : (
                            <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              FAIL (&gt;5°C)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-900 bg-stone-100 font-bold text-xs text-stone-900">
                    <td colSpan={6} className="p-2 text-right uppercase tracking-wider">
                      Total Dispatched Output:
                    </td>
                    <td className="p-2 border-r border-l border-stone-900 text-center font-mono text-sm bg-stone-200 font-black">
                      {totalUnits} Units
                    </td>
                    <td colSpan={2} className="p-2 text-center font-mono text-[11px]">
                      {isAllHaccpCompliant ? (
                        <span className="text-emerald-800 font-bold">✓ 100% Cold-Chain Compliant</span>
                      ) : (
                        <span className="text-red-800 font-bold">⚠ Deviation Detected</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Quality & HACCP Certification Banner */}
          <div className="border border-stone-300 bg-stone-50 p-3 rounded-lg mb-4 text-[11px] leading-relaxed">
            <strong className="text-stone-900">Central Kitchen QA Verification:</strong> All refrigerated items listed above have been prepared, packed, and loaded from the Barista Central Kitchen according to HACCP Standard Operating Procedures. Product temperatures were tested using calibrated probe thermometers. Cold-chain integrity must be preserved throughout delivery transit.
          </div>

          {/* Official 3-Party Sign-off Matrix */}
          <div className="border-2 border-stone-900 rounded-lg overflow-hidden">
            <div className="bg-stone-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              Verification & Custody Handover Sign-Off (Strict HACCP Audit Protocol)
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-t border-stone-900 text-xs">
              
              {/* 1. Dispatch Supervisor */}
              <div className="p-3 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    1. Central Kitchen Dispatch QA
                  </span>
                  <p className="font-bold text-stone-900 mt-1">{dispatchLog.supervisor}</p>
                  <p className="text-[10px] text-stone-500 font-mono">Date: {dispatchLog.date} @ {dispatchLog.dispatchTime}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-dashed border-stone-400">
                  <span className="text-[10px] text-stone-400 block">Authorized Signature:</span>
                  <div className="h-6 font-serif italic text-sm text-stone-800 flex items-center">
                    ✓ Verified Electronic QA Sign
                  </div>
                </div>
              </div>

              {/* 2. Driver / Cold-Chain Transit */}
              <div className="p-3 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    2. Cold-Chain Transport Driver
                  </span>
                  <p className="font-bold text-stone-900 mt-1">{dispatchLog.driverName}</p>
                  <p className="text-[10px] text-stone-500 font-mono">Vehicle: {dispatchLog.vehicleNo || 'WP CAD-4291'}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-dashed border-stone-400">
                  <span className="text-[10px] text-stone-400 block">Driver Acceptance Signature:</span>
                  <div className="h-6 border-b border-stone-300"></div>
                </div>
              </div>

              {/* 3. Retail Store Receiving */}
              <div className="p-3 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    3. Retail Store Receiving In-Charge
                  </span>
                  <p className="font-bold text-stone-900 mt-1">Branch Receiving Barista</p>
                  <p className="text-[10px] text-stone-500 font-mono">Temp on Arrival: _____ °C</p>
                </div>
                <div className="mt-4 pt-2 border-t border-dashed border-stone-400">
                  <span className="text-[10px] text-stone-400 block">Store Stamp & Signature:</span>
                  <div className="h-6 border-b border-stone-300"></div>
                </div>
              </div>

            </div>
          </div>

          {/* Micro Footer for Print Compliance */}
          <div className="mt-3 pt-2 border-t border-stone-300 flex justify-between items-center text-[9px] text-stone-500 font-mono">
            <span>Barista Coffee Lanka • BCL/REC/HACCP/32 • Controlled Document</span>
            <span>Printed on: {new Date().toLocaleString()}</span>
            <span>Page 1 of 1</span>
          </div>

        </div>
      </div>
    </div>
  );
};
