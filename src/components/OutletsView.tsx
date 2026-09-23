import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  X,
  Building
} from 'lucide-react';
import { Outlet } from '../types';
import { addOutlet, updateOutlet, deleteOutlet } from '../services/dataService';

interface OutletsViewProps {
  outlets: Outlet[];
}

export const OutletsView: React.FC<OutletsViewProps> = ({ outlets }) => {
  const { role, hasAccess } = useAuth();
  const canEdit = hasAccess('outlets', 'edit');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New Outlet Form State
  const [formData, setFormData] = useState({
    outletId: `OUT-0${outlets.length + 1}`,
    name: '',
    location: '',
    phone: '',
    active: true
  });

  const handleCreateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSubmitting(true);
    try {
      await addOutlet({
        outletId: formData.outletId,
        name: formData.name,
        location: formData.location,
        phone: formData.phone,
        active: formData.active
      });
      setShowAddModal(false);
      setFormData({
        outletId: `OUT-0${outlets.length + 2}`,
        name: '',
        location: '',
        phone: '',
        active: true
      });
    } catch (err: any) {
      alert('Error adding outlet: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOutlet || !canEdit) return;
    setSubmitting(true);
    try {
      await updateOutlet(editingOutlet.id, {
        outletId: editingOutlet.outletId,
        name: editingOutlet.name,
        location: editingOutlet.location,
        phone: editingOutlet.phone,
        active: editingOutlet.active
      });
      setEditingOutlet(null);
    } catch (err: any) {
      alert('Error updating outlet: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOutlet = async (id: string, name: string) => {
    if (role !== 'admin') {
      alert('Only Admins can delete outlets.');
      return;
    }
    if (confirm(`Are you sure you want to remove outlet "${name}"?`)) {
      try {
        await deleteOutlet(id);
      } catch (err: any) {
        alert('Error removing outlet: ' + err.message);
      }
    }
  };

  const toggleActiveStatus = async (outlet: Outlet) => {
    if (!canEdit) return;
    try {
      await updateOutlet(outlet.id, { active: !outlet.active });
    } catch (err: any) {
      alert('Error updating outlet status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Barista Retail Outlets</h2>
            <span className="text-xs bg-stone-800 px-2 py-0.5 rounded text-amber-400 font-mono">
              {outlets.length} Branches
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Manage destination coffee shops, branch IDs, delivery addresses, and operational availability.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs transition flex items-center space-x-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Outlet</span>
          </button>
        )}
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outlets.map((outlet) => (
          <div
            key={outlet.id}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-amber-600/40 transition"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                    {outlet.outletId}
                  </span>
                  <button
                    onClick={() => toggleActiveStatus(outlet)}
                    disabled={!canEdit}
                    className={`inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded ${
                      outlet.active
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                    title={canEdit ? "Click to toggle active status" : ""}
                  >
                    {outlet.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{outlet.active ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingOutlet(outlet)}
                      className="p-1 text-stone-400 hover:text-blue-400 rounded transition cursor-pointer"
                      title="Edit Outlet"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDeleteOutlet(outlet.id, outlet.name)}
                        className="p-1 text-stone-400 hover:text-red-400 rounded transition cursor-pointer"
                        title="Delete Outlet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <h3 className="font-bold text-white text-base mb-2">
                {outlet.name}
              </h3>

              <div className="space-y-1.5 text-xs text-stone-400">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{outlet.location || 'Colombo City, Sri Lanka'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  <span>{outlet.phone || '+94 11 234 5678'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span>HACCP Transit Route</span>
              <span className="text-stone-300 font-mono">Max 2-hr transit</span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD OUTLET MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Add New Barista Outlet</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOutlet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Outlet ID Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.outletId}
                  onChange={(e) => setFormData({ ...formData, outletId: e.target.value })}
                  placeholder="e.g. OUT-06"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Outlet / Branch Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Barista One Galle Face Mall"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Location Address
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Level 3, One Galle Face, Colombo 01"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Branch Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +94 11 765 4321"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-stone-700 bg-stone-800 text-amber-500"
                />
                <label htmlFor="activeCheck" className="text-xs text-stone-300 font-medium cursor-pointer">
                  Outlet currently active and receiving dispatches
                </label>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded-lg text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OUTLET MODAL */}
      {editingOutlet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center space-x-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Edit Outlet: {editingOutlet.name}</h3>
              </div>
              <button onClick={() => setEditingOutlet(null)} className="text-stone-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateOutlet} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Outlet ID Code
                </label>
                <input
                  type="text"
                  required
                  value={editingOutlet.outletId}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, outletId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Outlet / Branch Name
                </label>
                <input
                  type="text"
                  required
                  value={editingOutlet.name}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Location Address
                </label>
                <input
                  type="text"
                  value={editingOutlet.location || ''}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, location: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={editingOutlet.phone || ''}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-xs text-stone-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="editActiveCheck"
                  checked={editingOutlet.active}
                  onChange={(e) => setEditingOutlet({ ...editingOutlet, active: e.target.checked })}
                  className="rounded border-stone-700 bg-stone-800 text-amber-500"
                />
                <label htmlFor="editActiveCheck" className="text-xs text-stone-300 font-medium cursor-pointer">
                  Outlet is active and operational
                </label>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingOutlet(null)}
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
    </div>
  );
};
