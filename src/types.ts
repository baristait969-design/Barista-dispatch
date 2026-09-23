export type UserRole = 'admin' | 'editor' | 'viewer';

export interface ModulePermissions {
  dashboard: { view: boolean; edit: boolean };
  inventory: { view: boolean; edit: boolean };
  forms: { view: boolean; edit: boolean };
  outlets: { view: boolean; edit: boolean };
  users: { view: boolean; edit: boolean };
  roles: { view: boolean; edit: boolean };
  reports: { view: boolean; edit: boolean };
}

export interface UserProfile {
  id: string;
  uid: string;
  userIdCode?: string; // Custom employee / user ID (e.g. EMP-101)
  email: string;
  password?: string;
  displayName: string;
  role: UserRole;
  permissions?: Partial<ModulePermissions>;
  designation?: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryBatch {
  id: string;
  batchNo: string;
  productName: string;
  category: string;
  initialQuantity: number;
  quantity: number;
  prodDate: string; // YYYY-MM-DD
  useByDate: string; // YYYY-MM-DD
  dispatchTemp: number; // in Celsius e.g. 3.5, 4.0
  unit: string; // e.g. 'slices', 'cakes', 'packs'
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BatchLog {
  id: string;
  batchId: string;
  batchNo: string;
  productName?: string;
  action: 'dispatch_deduction' | 'manual_adjustment' | 'batch_created' | 'restock';
  quantityChanged: number; // e.g. -12
  previousQty: number;
  newQty: number;
  referenceId?: string; // Dispatch Log Doc ID
  outletName?: string;
  driverName?: string;
  recordedBy: string;
  timestamp: string;
}

export interface Outlet {
  id: string;
  outletId: string; // e.g. OUT-01, OUT-02
  name: string;
  location?: string;
  phone?: string;
  active: boolean;
}

export interface DispatchLineItem {
  id: string;
  productName: string;
  batchNo: string;
  batchId?: string;
  dispatchTime: string; // HH:MM
  prodDate: string;
  useByDate: string;
  dispatchTemp: number;
  quantity: number;
  availableStock?: number;
  notes?: string;
}

export interface DispatchLog {
  id: string;
  docNo: string; // "BCL/REC/HACCP/32"
  title: string; // "Central Kitchen Dispatch Log"
  revision: string; // "Rev 01"
  version: string; // "01"
  effectiveDate: string; // "01 January 2025"
  haccpLink: string; // "OPRP-2"
  approvedBy: string; // "QA Executive"
  date: string; // YYYY-MM-DD
  dispatchTime: string; // HH:MM
  outletIds: string[];
  outletNames: string[];
  driverName: string;
  vehicleNo?: string;
  supervisor: string; // Automatically selected logged in username (read-only)
  supervisorId: string;
  supervisorEmail: string;
  items: DispatchLineItem[];
  haccpCompliant: boolean;
  notes?: string;
  status: 'submitted' | 'in_transit' | 'delivered' | 'edited';
  createdAt: string;
  updatedAt?: string;
}

export interface Driver {
  id: string;
  driverId: string;
  name: string;
  vehicleNo: string;
  phone: string;
  active: boolean;
}
