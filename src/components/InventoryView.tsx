import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Search, 
  Download, 
  Edit, 
  Trash2, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  ThermometerSnowflake, 
  X,
  Filter,
  Calendar,
  Layers,
  Lock
} from 'lucide-react';
import { InventoryBatch, BatchLog, Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/seedData';
import { addInventoryBatch, updateInventoryBatch, deleteInventoryBatch } from '../services/dataService';
import { getNextBatchNumberForProduct, getProductKeyCode } from '../utils/batchUtils';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface InventoryViewProps {
  batches: InventoryBatch[];
  batchLogs: BatchLog[];
  products?: Product[];
  onRefresh?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  batches,
  batchLogs,
  products
}) => {
  const { role, userProfile } = useAuth();
  const canEdit = role === 'admin' || role === 'editor';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);
  const [selectedBatchForLogs, setSelectedBatchForLogs] = useState<InventoryBatch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<InventoryBatch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Product-specific unique batch sequence generator
  const getNextBatchNo = (productName: string, list: InventoryBatch[] = batches) => {
    return getNextBatchNumberForProduct(productName, list, products);
  };

  const initialProductName = (products && products.length > 0 ? products[0].name : INITIAL_PRODUCTS[0].name);

  // Form State
  const [formData, setFormData] = useState(() => ({
    batchNo: getNextBatchNumberForProduct(initialProductName, batches, products),
    productName: initialProductName,
    category: (products && products.length > 0 ? products[0].category : INITIAL_PRODUCTS[0].category) || 'Pastry Kitchen Items',
    quantity: 50,
    prodDate: new Date().toISOString().split('T')[0],
    useByDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days in future
    dispatchTemp: 3.5,
    unit: 'NoS'
  }));

  // Calculate stats
  const totalQuantity = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);

  // Filtered Batches
  const filteredBatches = batches.filter(batch => {
    const matchesSearch = 
      batch.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || batch.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(batches.map(b => b.category || 'Pastry Kitchen Items')));

  const handleProductSelect = (pName: string) => {
    const activeProducts = products && products.length > 0 ? products : [];
    const found = activeProducts.find(p => p.name === pName) || INITIAL_PRODUCTS.find(p => p.name === pName);
    const autoBatchNo = getNextBatchNumberForProduct(pName, batches, products);

    if (found) {
      const shelfDays = 'shelfLifeDays' in found && found.shelfLifeDays ? found.shelfLifeDays : 5;
      const defTemp = 'dispatchTemp' in found ? found.dispatchTemp : (found as any).defaultTemp;
      const futureDate = new Date(Date.now() + shelfDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        batchNo: autoBatchNo,
        productName: found.name,
        category: found.category,
        dispatchTemp: defTemp,
        unit: found.unit || 'NoS',
        useByDate: futureDate
      }));
    } else {
      setFormData(prev => ({ ...prev, productName: pName, batchNo: autoBatchNo }));
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSubmitting(true);
    try {
      const assignedBatchNo = formData.batchNo.trim() || getNextBatchNumberForProduct(formData.productName, batches, products);
      await addInventoryBatch({
        batchNo: assignedBatchNo,
        productName: formData.productName,
        category: formData.category,
        initialQuantity: Number(formData.quantity),
        quantity: Number(formData.quantity),
        prodDate: formData.prodDate,
        useByDate: formData.useByDate,
        dispatchTemp: Number(formData.dispatchTemp),
        unit: formData.unit,
        createdBy: userProfile?.displayName || userProfile?.email || 'Central Kitchen Staff'
      });
      setShowAddModal(false);

      // Next batch for this same product automatically follows the sequence
      const updatedBatches = [...batches, { id: 'temp', batchNo: assignedBatchNo, productName: formData.productName } as any];
      const nextBatch = getNextBatchNumberForProduct(formData.productName, updatedBatches, products);

      setFormData(prev => ({
        ...prev,
        batchNo: nextBatch,
        quantity: 50,
        prodDate: new Date().toISOString().split('T')[0],
        useByDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    } catch (err) {
      alert('Error creating batch: ' + (err as any)?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || !canEdit) return;
    setSubmitting(true);
    try {
      await updateInventoryBatch(
        editingBatch.id,
        {
          batchNo: editingBatch.batchNo,
          productName: editingBatch.productName,
          quantity: Number(editingBatch.quantity),
          prodDate: editingBatch.prodDate,
          useByDate: editingBatch.useByDate,
          dispatchTemp: Number(editingBatch.dispatchTemp),
          unit: editingBatch.unit
        },
        userProfile?.displayName || userProfile?.email || 'Staff'
      );
      setEditingBatch(null);
    } catch (err) {
      alert('Error updating batch: ' + (err as any)?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (!batchToDelete) return;
    setIsDeleting(true);
    try {
      await deleteInventoryBatch(batchToDelete.id);
      setBatchToDelete(null);
    } catch (err) {
      alert('Error deleting batch: ' + (err as any)?.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = [
      'Batch No',
      'Product Name',
      'Category',
      'Remaining Qty',
      'Initial Qty',
      'Unit',
      'Production Date',
      'Use-By / Expiration Date',
      'Dispatch Temp (C)',
      'HACCP Status'
    ];

    const rows = batches.map(b => [
      `"${b.batchNo}"`,
      `"${b.productName}"`,
      `"${b.category || ''}"`,
      b.quantity,
      b.initialQuantity || b.quantity,
      `"${b.unit}"`,
      `"${b.prodDate}"`,
      `"${b.useByDate}"`,
      b.dispatchTemp,
      b.dispatchTemp <= 5.0 ? 'COMPLIANT (<=5C)' : 'EXCEEDED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barista_Central_Kitchen_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Central Kitchen Inventory</h2>
            <span className="text-xs bg-stone-800 px-2 py-0.5 rounded text-amber-400 font-mono">
              {batches.length} Batches
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Track batch numbers, current remaining stock, production dates, future expiration dates, and dispatch temperatures.
          </p>
          {!canEdit && (
            <div className="mt-2 text-xs text-emerald-400 font-medium">
              🔒 Logged in as <span className="uppercase">{role}</span>: Read-only access enabled (view data & reports).
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 font-medium rounded-lg text-xs transition flex items-center space-x-2 cursor-pointer"
            title="Download CSV for external Excel/Sheets analysis"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  batchNo: getNextBatchNumberForProduct(prev.productName, batches, products)
                }));
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Batch</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Batch No or Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-stone-300 font-medium">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-xs text-stone-100 font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all" className="bg-stone-900 text-stone-100">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-stone-900 text-stone-100">{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Batches Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-850 bg-stone-800/60 text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">Batch No</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Remaining Stock</th>
                <th className="py-3 px-4">Production Date</th>
                <th className="py-3 px-4">Use-By / Expiry</th>
                <th className="py-3 px-4">Dispatch Temp (°C)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    No batches found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isLow = batch.quantity <= 15;
                  const isTempOk = batch.dispatchTemp <= 5.0;
                  
                  // Expiration calculations
                  const diffDays = (new Date(batch.useByDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                  const isExpired = diffDays < 0;
                  const isExpiringSoon = diffDays >= 0 && diffDays <= 3;

                  return (
                    <tr key={batch.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {batch.batchNo}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>{batch.productName}</div>
                        <span className="text-[10px] text-stone-400 font-normal">{batch.category || 'Pastry'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-xs ${
                          isLow ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-stone-800 text-stone-200'
                        }`}>
                          {batch.quantity} {batch.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-300">
                        {batch.prodDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${
                          isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-stone-300'
                        }`}>
                          {batch.useByDate}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          isTempOk ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60' : 'bg-red-950/70 text-red-300 border border-red-800'
                        }`}>
                          <ThermometerSnowflake className="w-3 h-3" />
                          <span>{batch.dispatchTemp.toFixed(1)} °C</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                            EXPIRED
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            EXPIRING SOON
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            ACTIVE / GOOD
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Batch Logs Button */}
                          <button
                            onClick={() => setSelectedBatchForLogs(batch)}
                            className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded transition cursor-pointer"
                            title="View Batch Audit & Deduction Logs"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              onClick={() => setEditingBatch(batch)}
                              className="p-1.5 text-stone-400 hover:text-blue-400 hover:bg-stone-800 rounded transition cursor-pointer"
                              title="Edit Batch"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => setBatchToDelete(batch)}
                              className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded transition cursor-pointer"
                              title="Delete Batch Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={!!batchToDelete}
        title="Delete Central Kitchen Batch"
        itemName={batchToDelete ? `${batchToDelete.batchNo} (${batchToDelete.productName})` : ''}
        itemType="Inventory Batch"
        description="Are you sure you want to permanently delete this batch from Central Kitchen inventory records? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteBatch}
        onClose={() => setBatchToDelete(null)}
      />

      {/* CREATE BATCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Create Central Kitchen Batch</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Product Name
                </label>
                <select
                  value={formData.productName}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  {(products && products.length > 0 ? products : INITIAL_PRODUCTS).map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center justify-between">
                    <span>Batch Number</span>
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3" /> System Generated
                    </span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={formData.batchNo}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-amber-400 font-mono font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
                    title="Batch number is system-generated and automatically follows sequential codes per product item."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Initial Stock Quantity
                  </label>
                  <div className="flex space-x-1">
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                    <span className="px-2.5 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-400">
                      {formData.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.prodDate}
                    onChange={(e) => setFormData({ ...formData, prodDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Use-By / Expiration Date (Future Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.useByDate}
                    onChange={(e) => setFormData({ ...formData, useByDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Dispatch Temperature (°C) — Target ≤ 5.0 °C (HACCP)
                </label>
                <div className="relative">
                  <ThermometerSnowflake className="w-4 h-4 text-cyan-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.dispatchTemp}
                    onChange={(e) => setFormData({ ...formData, dispatchTemp: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                {formData.dispatchTemp > 5.0 && (
                  <p className="text-[11px] text-red-400 mt-1">
                    ⚠️ Warning: Temperature exceeds HACCP maximum limit of 5.0 °C.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving Batch...' : 'Register Batch in Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BATCH MODAL */}
      {editingBatch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Edit Batch: {editingBatch.batchNo}</h3>
              </div>
              <button onClick={() => setEditingBatch(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1 flex items-center justify-between">
                  <span>Batch Number</span>
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> System Locked
                  </span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={editingBatch.batchNo}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-amber-400 font-mono font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
                  title="Batch number cannot be changed"
                />
                <p className="text-[10px] text-stone-500 mt-1">Permanent system batch identifier</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingBatch.productName}
                  onChange={(e) => setEditingBatch({ ...editingBatch, productName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Remaining Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingBatch.quantity}
                    onChange={(e) => setEditingBatch({ ...editingBatch, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Dispatch Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingBatch.dispatchTemp}
                    onChange={(e) => setEditingBatch({ ...editingBatch, dispatchTemp: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editingBatch.prodDate}
                    onChange={(e) => setEditingBatch({ ...editingBatch, prodDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Use-By / Expiration Date (Future Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={editingBatch.useByDate}
                    onChange={(e) => setEditingBatch({ ...editingBatch, useByDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH AUDIT & REDUCTION LOGS MODAL */}
      {selectedBatchForLogs && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4 shrink-0">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    Batch History & Stock Reduction Logs
                  </h3>
                  <p className="text-xs text-stone-400">
                    Batch: <span className="text-amber-400 font-mono font-bold">{selectedBatchForLogs.batchNo}</span> • {selectedBatchForLogs.productName}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedBatchForLogs(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {batchLogs.filter(l => l.batchNo === selectedBatchForLogs.batchNo || l.batchId === selectedBatchForLogs.id).length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs">
                  No automated deductions logged for this batch yet.
                </div>
              ) : (
                batchLogs
                  .filter(l => l.batchNo === selectedBatchForLogs.batchNo || l.batchId === selectedBatchForLogs.id)
                  .map((log) => (
                    <div key={log.id} className="p-3.5 bg-stone-800/70 border border-stone-700/60 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          log.action === 'dispatch_deduction' 
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {log.action === 'dispatch_deduction' ? 'Stock Deduction / Dispatched' : 'Batch Registered'}
                        </span>
                        <span className="text-[11px] text-stone-400 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-stone-900/60 p-2 rounded">
                          <span className="text-stone-400 block text-[10px]">Change</span>
                          <span className={`font-bold font-mono ${log.quantityChanged < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                          </span>
                        </div>
                        <div className="bg-stone-900/60 p-2 rounded">
                          <span className="text-stone-400 block text-[10px]">Stock Level</span>
                          <span className="text-stone-200 font-mono font-medium">
                            {log.previousQty} ➔ <strong className="text-white">{log.newQty}</strong>
                          </span>
                        </div>
                        <div className="bg-stone-900/60 p-2 rounded">
                          <span className="text-stone-400 block text-[10px]">Outlet Destination</span>
                          <span className="text-amber-400 truncate block">
                            {log.outletName || 'Central Kitchen'}
                          </span>
                        </div>
                        <div className="bg-stone-900/60 p-2 rounded">
                          <span className="text-stone-400 block text-[10px]">Authorized By</span>
                          <span className="text-stone-300 truncate block">
                            {log.recordedBy}
                          </span>
                        </div>
                      </div>

                      {log.driverName && (
                        <div className="mt-1 text-[11px] text-stone-400">
                          Assigned Driver: <span className="text-stone-200">{log.driverName}</span>
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedBatchForLogs(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
