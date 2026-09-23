import { InventoryBatch, Outlet, Driver, UserProfile } from '../types';

export const INITIAL_PRODUCTS = [
  { name: 'Blueberry Cold Cheesecake Slices', category: 'Pastry Kitchen Items', defaultTemp: 3.5, shelfLifeDays: 5, unit: 'Slices' },
  { name: 'Brownies Cheesecake Slices', category: 'Pastry Kitchen Items', defaultTemp: 3.8, shelfLifeDays: 5, unit: 'Slices' },
  { name: 'Death By Chocolate Cake (1500gm)', category: 'Pastry Kitchen Items', defaultTemp: 4.0, shelfLifeDays: 6, unit: 'Cakes' },
  { name: 'Red velvet cake (1500gm)', category: 'Pastry Kitchen Items', defaultTemp: 3.6, shelfLifeDays: 6, unit: 'Cakes' },
  { name: 'Mocha Cake', category: 'Pastry Kitchen Items', defaultTemp: 4.1, shelfLifeDays: 6, unit: 'Cakes' },
  { name: 'Caramel Macchiato Tart', category: 'Pastry Kitchen Items', defaultTemp: 3.4, shelfLifeDays: 4, unit: 'Packs' },
  { name: 'Almond Croissant Slices', category: 'Bakery & Pastry', defaultTemp: 4.5, shelfLifeDays: 3, unit: 'Packs' },
  { name: 'Tiramisu Cold Cups', category: 'Pastry Kitchen Items', defaultTemp: 3.2, shelfLifeDays: 4, unit: 'Cups' }
];

export const INITIAL_BATCHES: InventoryBatch[] = [
  {
    id: 'batch-001',
    batchNo: 'B-2025-0101',
    productName: 'Blueberry Cold Cheesecake Slices',
    category: 'Pastry Kitchen Items',
    initialQuantity: 120,
    quantity: 94,
    prodDate: '2025-01-01',
    useByDate: '2025-01-06',
    dispatchTemp: 3.5,
    unit: 'Slices',
    createdAt: new Date().toISOString()
  },
  {
    id: 'batch-002',
    batchNo: 'B-2025-0102',
    productName: 'Brownies Cheesecake Slices',
    category: 'Pastry Kitchen Items',
    initialQuantity: 80,
    quantity: 65,
    prodDate: '2025-01-01',
    useByDate: '2025-01-06',
    dispatchTemp: 3.8,
    unit: 'Slices',
    createdAt: new Date().toISOString()
  },
  {
    id: 'batch-003',
    batchNo: 'B-2025-0103',
    productName: 'Death By Chocolate Cake (1500gm)',
    category: 'Pastry Kitchen Items',
    initialQuantity: 30,
    quantity: 18,
    prodDate: '2025-01-02',
    useByDate: '2025-01-08',
    dispatchTemp: 4.0,
    unit: 'Cakes',
    createdAt: new Date().toISOString()
  },
  {
    id: 'batch-004',
    batchNo: 'B-2025-0104',
    productName: 'Red velvet cake (1500gm)',
    category: 'Pastry Kitchen Items',
    initialQuantity: 25,
    quantity: 20,
    prodDate: '2025-01-02',
    useByDate: '2025-01-08',
    dispatchTemp: 3.6,
    unit: 'Cakes',
    createdAt: new Date().toISOString()
  },
  {
    id: 'batch-005',
    batchNo: 'B-2025-0105',
    productName: 'Mocha Cake',
    category: 'Pastry Kitchen Items',
    initialQuantity: 40,
    quantity: 32,
    prodDate: '2025-01-03',
    useByDate: '2025-01-09',
    dispatchTemp: 4.1,
    unit: 'Cakes',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_OUTLETS: Outlet[] = [
  { id: 'outlet-1', outletId: 'OUT-01', name: 'Barista Colombo Fort Branch', location: 'Chatham Street, Fort', phone: '+94 11 234 5671', active: true },
  { id: 'outlet-2', outletId: 'OUT-02', name: 'Barista Havelock Town', location: 'Havelock Road, Colombo 05', phone: '+94 11 258 8901', active: true },
  { id: 'outlet-3', outletId: 'OUT-03', name: 'Barista Kandy City Centre', location: 'Dalada Veediya, Kandy', phone: '+94 81 223 4455', active: true },
  { id: 'outlet-4', outletId: 'OUT-04', name: 'Barista Galle Face Mall', location: 'Level 2, One Galle Face', phone: '+94 11 765 4321', active: true },
  { id: 'outlet-5', outletId: 'OUT-05', name: 'Barista Negombo Coastal', location: 'Lewis Place, Negombo', phone: '+94 31 222 3344', active: true }
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'drv-1', driverId: 'DRV-101', name: 'Kamal Perera', vehicleNo: 'WP CAD-4291 (Chilled Van)', phone: '+94 77 123 4567', active: true },
  { id: 'drv-2', driverId: 'DRV-102', name: 'Nimal Silva', vehicleNo: 'WP GA-1120 (Refrigerated Transit)', phone: '+94 71 890 1234', active: true },
  { id: 'drv-3', driverId: 'DRV-103', name: 'Sunil Fernando', vehicleNo: 'WP PL-9034 (Isothermal Carrier)', phone: '+94 76 555 7890', active: true }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    uid: 'admin-barista-01',
    userIdCode: 'USR-ADM-01',
    email: 'admin@barista.lk',
    displayName: 'Tharindu Fernando (QA Executive / Admin)',
    role: 'admin',
    designation: 'QA Executive / System Administrator',
    department: 'Quality Assurance & Kitchen Logistics',
    permissions: {
      dashboard: { view: true, edit: true },
      inventory: { view: true, edit: true },
      forms: { view: true, edit: true },
      outlets: { view: true, edit: true },
      users: { view: true, edit: true },
      roles: { view: true, edit: true },
      reports: { view: true, edit: true }
    },
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'user-editor',
    uid: 'editor-barista-02',
    userIdCode: 'USR-EDT-02',
    email: 'pastrychef@barista.lk',
    displayName: 'Chef Dineth (Head Pastry Chef)',
    role: 'editor',
    designation: 'Central Kitchen Shift Supervisor',
    department: 'Pastry Production & Dispatch',
    permissions: {
      dashboard: { view: true, edit: false },
      inventory: { view: true, edit: true },
      forms: { view: true, edit: true },
      outlets: { view: true, edit: true },
      users: { view: true, edit: false },
      roles: { view: true, edit: false },
      reports: { view: true, edit: false }
    },
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'user-viewer',
    uid: 'viewer-barista-03',
    userIdCode: 'USR-VIW-03',
    email: 'auditor@barista.lk',
    displayName: 'Anura Bandara (Outlet Auditor / Store Viewer)',
    role: 'viewer',
    designation: 'Audit & Compliance Inspector',
    department: 'HACCP Audit & Outlets Review',
    permissions: {
      dashboard: { view: true, edit: false },
      inventory: { view: true, edit: false }, // Only see data
      forms: { view: true, edit: false },
      outlets: { view: true, edit: false },
      users: { view: false, edit: false },
      roles: { view: false, edit: false },
      reports: { view: true, edit: false }
    },
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];
