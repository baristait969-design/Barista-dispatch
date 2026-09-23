import React from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Lock, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types';

export const RolesView: React.FC = () => {
  const roles = [
    {
      id: 'ROL-ADM-01',
      name: 'Admin',
      title: 'QA Executive / Quality Assurance Head',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Complete operational and administrative authority. Can create users, assign roles, configure permissions, manage outlets, override batches, and sign off official HACCP compliance audits.',
      scope: 'Unrestricted System Access'
    },
    {
      id: 'ROL-EDT-02',
      name: 'Editor',
      title: 'Head Pastry Chef / Central Kitchen Supervisor',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      description: 'Central kitchen production and logistics team. Can register new production batches, adjust inventory, fill dispatch forms (BCL/REC/HACCP/32), and assign delivery drivers. Outlets list is viewable in read-only mode.',
      scope: 'Kitchen Production & Dispatches (Outlets Read-Only)'
    },
    {
      id: 'ROL-VIW-03',
      name: 'Viewer',
      title: 'Outlet Manager / External HACCP Auditor',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Inspection and auditing profile. Strictly restricted to Reports section with print capability for official dispatch logs and QA audits. All other management modules are hidden.',
      scope: 'Reports Viewing & Print Only'
    }
  ];

  const permissionsMatrix = [
    { module: 'Personalized Dashboard', admin: 'Full Access', editor: 'Full Access', viewer: 'Denied (Hidden)' },
    { module: 'Inventory - View Stock & Batches', admin: 'Full Access', editor: 'Full Access', viewer: 'Denied (Hidden)' },
    { module: 'Inventory - Create & Edit Batches', admin: 'Full Access', editor: 'Full Access', viewer: 'Denied' },
    { module: 'Inventory - Delete Batch Records', admin: 'Full Access', editor: 'Denied', viewer: 'Denied' },
    { module: 'Inventory - Export CSV Analysis', admin: 'Full Access', editor: 'Full Access', viewer: 'Denied' },
    { module: 'Dispatch Form (BCL/REC/HACCP/32) - Issue & Submit', admin: 'Full Access', editor: 'Full Access', viewer: 'Denied (Hidden)' },
    { module: 'Dispatch Form - Real-time Stock Deduction', admin: 'Automatic', editor: 'Automatic', viewer: 'Denied' },
    { module: 'Dispatch Form - Supervisor Sign-off Lock', admin: 'Authenticated ID', editor: 'Authenticated ID', viewer: 'Denied' },
    { module: 'Dispatch Logs - View & Search', admin: 'Full Access', editor: 'Full Access', viewer: 'View in Reports' },
    { module: 'Outlets - Add & Edit Branches', admin: 'Exclusive Full Access', editor: 'Denied (Read-Only)', viewer: 'Denied (Hidden)' },
    { module: 'Outlets - Active / Suspended Status Toggle', admin: 'Exclusive Full Access', editor: 'Denied', viewer: 'Denied (Hidden)' },
    { module: 'Outlets - Delete Branch', admin: 'Exclusive Full Access', editor: 'Denied', viewer: 'Denied (Hidden)' },
    { module: 'Users - Register & Assign Roles', admin: 'Full Access', editor: 'Denied', viewer: 'Denied (Hidden)' },
    { module: 'Roles & Security Matrix', admin: 'Full Access', editor: 'View Only', viewer: 'Denied (Hidden)' },
    { module: 'Reports & Audits - View & Filter', admin: 'Full Access', editor: 'Full Access', viewer: 'Full Access' },
    { module: 'Reports - Official Sheet & Audit Printing', admin: 'Full Access', editor: 'Full Access', viewer: 'Print Enabled' },
    { module: 'Reports - Export CSV', admin: 'Full Access', editor: 'Full Access', viewer: 'Denied' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Role-Based Access Control (RBAC)</h2>
        </div>
        <p className="text-xs text-stone-400 mt-1 max-w-3xl">
          Granular access control enforcing the Principle of Least Privilege across the Barista Central Kitchen. Compliant with ISO 22000 and HACCP OPRP-2 audit standards.
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((r) => (
          <div
            key={r.id}
            className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-stone-400">{r.id}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${r.badgeColor}`}>
                  {r.name}
                </span>
              </div>

              <h3 className="font-bold text-white text-base mb-1">
                {r.title}
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed mb-4">
                {r.description}
              </p>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Permission Scope:</span>
              <span className="text-stone-200 font-semibold">{r.scope}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Access Matrix Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">System Modules & Functional Access Matrix</h3>
          <span className="text-xs text-amber-400 font-mono">OPRP-2 Access Policy</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-800/60 text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">Feature / Action</th>
                <th className="py-3 px-4 text-center">Admin (QA Exec)</th>
                <th className="py-3 px-4 text-center">Editor (Pastry Chef)</th>
                <th className="py-3 px-4 text-center">Viewer (Auditor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800">
              {permissionsMatrix.map((item, index) => {
                const isAdminFull = item.admin.includes('Full') || item.admin.includes('Automatic') || item.admin.includes('Authenticated');
                const isEditorFull = item.editor.includes('Full') || item.editor.includes('Automatic') || item.editor.includes('Authenticated');
                const isViewerFull = item.viewer.includes('Full');
                const isViewerDenied = item.viewer === 'Denied';

                return (
                  <tr key={index} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-medium text-stone-200">
                      {item.module}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                        <Check className="w-3 h-3" />
                        <span>{item.admin}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isEditorFull
                          ? 'bg-blue-950/70 text-blue-300 border border-blue-800/60'
                          : 'bg-stone-800 text-stone-400'
                      }`}>
                        {isEditorFull ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{item.editor}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isViewerDenied
                          ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {isViewerDenied ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        <span>{item.viewer}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
