import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DispatchLog } from '../types';

/**
 * Builds the jsPDF instance for Executive QA Report.
 */
export function buildExecutiveReportDoc(
  logs: DispatchLog[],
  stats: {
    totalDispatches: number;
    totalUnitsDispatched: number;
    haccpComplianceRate: number;
    averageTemp: string;
    compliantLogsCount: number;
    deviationCount: number;
    outletsCount: number;
  },
  userName: string = 'QA Executive',
  dateRange: string = 'All Records'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Header Banner Background
  doc.setFillColor(30, 27, 24); // Dark stone
  doc.rect(0, 0, 297, 26, 'F');

  // Brand Name
  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BARISTA SRI LANKA — CENTRAL KITCHEN', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text('EXECUTIVE DISPATCH & HACCP COLD-CHAIN AUDIT REPORT', 14, 19);

  // Document Metadata on Right
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 200);
  doc.text(`Doc Ref: BCL/REC/HACCP/32 | OPRP-2`, 220, 10);
  doc.text(`Generated: ${todayStr} | Auditor: ${userName}`, 220, 16);
  doc.text(`Period: ${dateRange}`, 220, 22);

  // KPI Summary Strip
  doc.setFillColor(245, 245, 247);
  doc.rect(14, 30, 269, 18, 'F');
  doc.setDrawColor(210, 210, 215);
  doc.rect(14, 30, 269, 18, 'S');

  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);

  // KPI 1: Dispatches
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DISPATCHES', 20, 36);
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(String(stats.totalDispatches), 20, 44);

  // KPI 2: Total Units
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('TOTAL OUTPUT', 65, 36);
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`${stats.totalUnitsDispatched} Units`, 65, 44);

  // KPI 3: HACCP Rate
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('COLD-CHAIN ADHERENCE', 120, 36);
  doc.setFontSize(14);
  doc.setTextColor(stats.haccpComplianceRate >= 95 ? 16 : 180, stats.haccpComplianceRate >= 95 ? 140 : 80, 50);
  doc.text(`${stats.haccpComplianceRate}% (OPRP-2)`, 120, 44);

  // KPI 4: Avg Temp
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('AVG DISPATCH TEMP', 190, 36);
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`${stats.averageTemp} °C`, 190, 44);

  // KPI 5: Outlets
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('ACTIVE OUTLETS', 245, 36);
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(String(stats.outletsCount), 245, 44);

  // Table Data
  const tableRows: any[] = [];
  logs.forEach(log => {
    const totalUnits = log.items.reduce((s, i) => s + i.quantity, 0);
    const isCompliant = log.items.every(i => i.dispatchTemp <= 5.0);
    const itemSummary = log.items.filter(i => i.quantity > 0).map(i => `${i.productName} (${i.quantity})`).join(', ');

    tableRows.push([
      log.docNo,
      `${log.date} ${log.dispatchTime}`,
      log.outletNames.join(', '),
      log.driverName,
      log.supervisor,
      `${log.items.filter(i => i.quantity > 0).length} items (${totalUnits} units)`,
      itemSummary || 'None',
      isCompliant ? 'PASS (≤5°C)' : 'DEV (>5°C)'
    ]);
  });

  autoTable(doc, {
    startY: 52,
    head: [['Doc No', 'Date / Time', 'Destination Outlets', 'Driver', 'QA Supervisor', 'Output', 'Product Breakdown', 'HACCP']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [35, 32, 29],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 26 },
      1: { cellWidth: 26 },
      2: { cellWidth: 42 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 28 },
      6: { cellWidth: 62 },
      7: { fontStyle: 'bold', cellWidth: 25, halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'PASS (≤5°C)') {
          data.cell.styles.textColor = [16, 120, 50];
        } else {
          data.cell.styles.textColor = [180, 20, 20];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 25 }
  });

  // Footer Sign-off on Last Page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Barista Coffee Lanka (Pvt) Ltd. • Doc: BCL/REC/HACCP/32 • Confidential HACCP Audit Report • Page ${i} of ${pageCount}`,
      14,
      200
    );
  }

  return doc;
}

/**
 * Downloads Executive QA PDF.
 */
export function generateExecutiveReportPDF(
  logs: DispatchLog[],
  stats: any,
  userName: string = 'QA Executive',
  dateRange: string = 'All Records'
) {
  const doc = buildExecutiveReportDoc(logs, stats, userName, dateRange);
  const todayStr = new Date().toISOString().split('T')[0];
  doc.save(`Barista_Executive_Dispatch_Report_${todayStr}.pdf`);
}

/**
 * Opens Executive QA PDF in a new tab with device auto-print triggered.
 */
export function printExecutiveReportPDF(
  logs: DispatchLog[],
  stats: any,
  userName: string = 'QA Executive',
  dateRange: string = 'All Records'
) {
  const doc = buildExecutiveReportDoc(logs, stats, userName, dateRange);
  doc.autoPrint();
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const win = window.open(pdfUrl, '_blank');
  if (!win) {
    const todayStr = new Date().toISOString().split('T')[0];
    doc.save(`Barista_Executive_Dispatch_Report_${todayStr}.pdf`);
  }
}

/**
 * Builds the jsPDF instance for Single Dispatch Manifest Sheet.
 */
export function buildSingleDispatchDoc(log: Partial<DispatchLog> & {
  items: any[];
  outletNames: string[];
  date: string;
  dispatchTime: string;
  driverName: string;
  supervisor: string;
}): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const activeItems = log.items.filter(item => item.quantity > 0);
  const totalUnits = activeItems.reduce((acc, item) => acc + item.quantity, 0);
  const isAllHaccpCompliant = activeItems.every(item => item.dispatchTemp <= 5.0);

  // Top Header Banner
  doc.setFillColor(30, 27, 24);
  doc.rect(14, 12, 182, 24, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BARISTA', 20, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(240, 240, 240);
  doc.text('SRI LANKA — CENTRAL KITCHEN DISPATCH LOG', 20, 28);
  doc.text('Barista Coffee Lanka (Pvt) Ltd.', 20, 33);

  // Header Right Metadata
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  doc.text(`Doc Code: BCL/REC/HACCP/32`, 130, 20);
  doc.text(`Revision: Rev 01 | Version: 01`, 130, 25);
  doc.text(`HACCP Standard: OPRP-2 (≤5°C)`, 130, 30);

  // Logistics Box
  doc.setFillColor(248, 248, 250);
  doc.rect(14, 40, 182, 22, 'F');
  doc.setDrawColor(200, 200, 205);
  doc.rect(14, 40, 182, 22, 'S');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATION OUTLETS', 18, 46);
  doc.text('DATE & DISPATCH TIME', 85, 46);
  doc.text('ASSIGNED DRIVER', 140, 46);

  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text(log.outletNames.join(', ') || 'Retail Branches', 18, 52);
  doc.text(`${log.date} @ ${log.dispatchTime}`, 85, 52);
  doc.text(log.driverName || 'Fleet Driver', 140, 52);

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.text(`QA Supervisor: ${log.supervisor || 'QA Officer'}${log.notes ? ` • Notes: ${log.notes}` : ''}`, 18, 58);

  // Items Table
  const tableRows = activeItems.map((item, idx) => {
    const isCompliant = item.dispatchTemp <= 5.0;
    return [
      idx + 1,
      item.productName,
      item.batchNo || 'N/A',
      item.dispatchTime || log.dispatchTime,
      item.prodDate || '-',
      item.useByDate || '-',
      item.quantity,
      `${item.dispatchTemp.toFixed(1)} °C`,
      isCompliant ? 'PASS (≤5°C)' : 'FAIL (>5°C)'
    ];
  });

  autoTable(doc, {
    startY: 66,
    head: [['#', 'Product Description', 'Batch No', 'Time', 'Prod Date', 'Use-By Date', 'Qty', 'Temp', 'HACCP Check']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [35, 32, 29],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 46 },
      2: { cellWidth: 26 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      8: { halign: 'center', fontStyle: 'bold', cellWidth: 14 }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 8) {
        if (String(data.cell.raw).startsWith('PASS')) {
          data.cell.styles.textColor = [16, 120, 50];
        } else {
          data.cell.styles.textColor = [180, 20, 20];
        }
      }
    }
  });

  // Total Strip
  const finalY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(240, 240, 245);
  doc.rect(14, finalY, 182, 10, 'F');
  doc.setDrawColor(200, 200, 205);
  doc.rect(14, finalY, 182, 10, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(`TOTAL DISPATCHED OUTPUT: ${totalUnits} UNITS`, 18, finalY + 6.5);
  doc.setTextColor(isAllHaccpCompliant ? 16 : 180, isAllHaccpCompliant ? 130 : 20, 40);
  doc.text(
    isAllHaccpCompliant ? '✓ 100% Cold-Chain Compliant (≤5.0°C)' : '⚠ HACCP Temperature Breach Detected',
    115,
    finalY + 6.5
  );

  // Sign-off Matrix
  const signY = finalY + 14;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 27, 24);
  doc.rect(14, signY, 182, 34, 'S');

  doc.setFillColor(30, 27, 24);
  doc.rect(14, signY, 182, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFICATION & CUSTODY HANDOVER SIGN-OFF (STRICT HACCP AUDIT PROTOCOL)', 18, signY + 4.5);

  // Column dividers
  doc.setDrawColor(200, 200, 205);
  doc.line(74, signY + 6, 74, signY + 34);
  doc.line(134, signY + 6, 134, signY + 34);

  // 1. Dispatch Supervisor
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('1. Central Kitchen QA Supervisor', 18, signY + 11);
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text(log.supervisor || 'QA Officer', 18, signY + 17);
  doc.setFontSize(7);
  doc.setTextColor(16, 120, 50);
  doc.text('✓ Verified Electronic Signature', 18, signY + 28);

  // 2. Driver
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('2. Cold-Chain Transport Driver', 78, signY + 11);
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text(log.driverName || 'Driver', 78, signY + 17);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Signature: _______________________', 78, signY + 28);

  // 3. Retail Store
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('3. Retail Store Receiving Barista', 138, signY + 11);
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Receiving Store Staff', 138, signY + 17);
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Temp: _____ °C | Sign: ____________', 138, signY + 28);

  // Micro Footer
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 130);
  doc.text(`Barista Coffee Lanka • BCL/REC/HACCP/32 • Doc ID: ${log.docNo || log.id || 'DSP-001'}`, 14, 285);
  doc.text(`Printed: ${new Date().toLocaleString()}`, 150, 285);

  return doc;
}

/**
 * Downloads Single Dispatch PDF.
 */
export function generateSingleDispatchPDF(log: any) {
  const doc = buildSingleDispatchDoc(log);
  doc.save(`Barista_Dispatch_Sheet_${log.docNo || log.id || 'Manifest'}.pdf`);
}

/**
 * Opens Single Dispatch PDF in a new tab with device auto-print triggered.
 */
export function printSingleDispatchPDF(log: any) {
  const doc = buildSingleDispatchDoc(log);
  doc.autoPrint();
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const win = window.open(pdfUrl, '_blank');
  if (!win) {
    doc.save(`Barista_Dispatch_Sheet_${log.docNo || log.id || 'Manifest'}.pdf`);
  }
}
