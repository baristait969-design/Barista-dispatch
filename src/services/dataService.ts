import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { InventoryBatch, BatchLog, Outlet, DispatchLog, Driver, UserProfile, UserRole } from '../types';
import { INITIAL_BATCHES, INITIAL_OUTLETS, INITIAL_DRIVERS, INITIAL_USERS } from '../data/seedData';

// Collections
const BATCHES_COL = 'inventory';
const LOGS_COL = 'batch_logs';
const OUTLETS_COL = 'outlets';
const DISPATCH_COL = 'dispatch_logs';
const DRIVERS_COL = 'drivers';
const USERS_COL = 'users';

// Seed Database with initial Barista Central Kitchen items if empty
export async function seedInitialDataIfNeeded(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, BATCHES_COL));
    if (snap.empty) {
      console.log('Seeding initial central kitchen inventory and outlets...');
      
      // Seed Batches
      for (const b of INITIAL_BATCHES) {
        await setDoc(doc(db, BATCHES_COL, b.id), b);
      }
      // Seed Outlets
      for (const o of INITIAL_OUTLETS) {
        await setDoc(doc(db, OUTLETS_COL, o.id), o);
      }
      // Seed Drivers
      for (const d of INITIAL_DRIVERS) {
        await setDoc(doc(db, DRIVERS_COL, d.id), d);
      }
      // Seed Demo Users
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, USERS_COL, u.id), u);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Seeding note (offline or permission fallback):', error);
    return false;
  }
}

// ----------------- INVENTORY BATCHES -----------------
export function subscribeBatches(callback: (batches: InventoryBatch[]) => void) {
  const q = query(collection(db, BATCHES_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: InventoryBatch[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as InventoryBatch);
      });
      // Sort newest batch first (FIFO/freshness display)
      items.sort((a, b) => b.batchNo.localeCompare(a.batchNo));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, BATCHES_COL);
    }
  );
}

export async function addInventoryBatch(batch: Omit<InventoryBatch, 'id' | 'createdAt'>): Promise<string> {
  const id = `batch-${Date.now()}`;
  try {
    const newBatch: InventoryBatch = { ...batch, id, createdAt: new Date().toISOString() };
    await setDoc(doc(db, BATCHES_COL, id), newBatch);

    // Create creation log
    await addBatchLog({
      batchId: id,
      batchNo: batch.batchNo,
      productName: batch.productName,
      action: 'batch_created',
      quantityChanged: batch.initialQuantity,
      previousQty: 0,
      newQty: batch.initialQuantity,
      recordedBy: batch.createdBy || 'Central Kitchen Staff',
      timestamp: new Date().toISOString()
    });

    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${BATCHES_COL}/${id}`);
    throw error;
  }
}

export async function updateInventoryBatch(id: string, updates: Partial<InventoryBatch>, userEmail: string): Promise<void> {
  try {
    const ref = doc(db, BATCHES_COL, id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (updates.quantity !== undefined) {
      await addBatchLog({
        batchId: id,
        batchNo: updates.batchNo || id,
        productName: updates.productName,
        action: 'manual_adjustment',
        quantityChanged: 0,
        previousQty: updates.quantity,
        newQty: updates.quantity,
        recordedBy: userEmail,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BATCHES_COL}/${id}`);
    throw error;
  }
}

export async function deleteInventoryBatch(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BATCHES_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BATCHES_COL}/${id}`);
    throw error;
  }
}

// ----------------- BATCH AUDIT LOGS -----------------
export function subscribeBatchLogs(callback: (logs: BatchLog[]) => void) {
  const q = query(collection(db, LOGS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs: BatchLog[] = [];
      snapshot.forEach((d) => {
        logs.push({ id: d.id, ...d.data() } as BatchLog);
      });
      // Sort newest timestamp first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(logs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, LOGS_COL);
    }
  );
}

export async function addBatchLog(log: Omit<BatchLog, 'id'>): Promise<void> {
  const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  try {
    await setDoc(doc(db, LOGS_COL, id), { ...log, id });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${LOGS_COL}/${id}`);
  }
}

// ----------------- OUTLETS -----------------
export function subscribeOutlets(callback: (outlets: Outlet[]) => void) {
  const q = query(collection(db, OUTLETS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Outlet[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Outlet);
      });
      items.sort((a, b) => a.outletId.localeCompare(b.outletId));
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, OUTLETS_COL);
    }
  );
}

export async function addOutlet(outlet: Omit<Outlet, 'id'>): Promise<string> {
  const id = `outlet-${Date.now()}`;
  try {
    await setDoc(doc(db, OUTLETS_COL, id), { ...outlet, id });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${OUTLETS_COL}/${id}`);
    throw error;
  }
}

export async function updateOutlet(id: string, updates: Partial<Outlet>): Promise<void> {
  try {
    await updateDoc(doc(db, OUTLETS_COL, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${OUTLETS_COL}/${id}`);
    throw error;
  }
}

export async function deleteOutlet(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, OUTLETS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OUTLETS_COL}/${id}`);
    throw error;
  }
}

// ----------------- DRIVERS -----------------
export function subscribeDrivers(callback: (drivers: Driver[]) => void) {
  const q = query(collection(db, DRIVERS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Driver[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as Driver);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, DRIVERS_COL);
    }
  );
}

export async function addDriver(driver: Omit<Driver, 'id'>): Promise<string> {
  const id = `drv-${Date.now()}`;
  try {
    await setDoc(doc(db, DRIVERS_COL, id), { ...driver, id });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${DRIVERS_COL}/${id}`);
    throw error;
  }
}

// ----------------- DISPATCH LOGS (HACCP BCL/REC/HACCP/32) -----------------
export function subscribeDispatchLogs(callback: (logs: DispatchLog[]) => void) {
  const q = query(collection(db, DISPATCH_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: DispatchLog[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as DispatchLog);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, DISPATCH_COL);
    }
  );
}

/**
 * Creates dispatch log and automatically adjusts inventory batches in real-time,
 * generating deduction logs for every batch dispatched!
 */
export async function createDispatchLogWithDeduction(
  dispatchData: Omit<DispatchLog, 'id' | 'createdAt'>,
  batches: InventoryBatch[]
): Promise<string> {
  const dispatchId = `disp-${Date.now()}`;
  try {
    const fullLog: DispatchLog = {
      ...dispatchData,
      id: dispatchId,
      createdAt: new Date().toISOString()
    };

    // 1. Save Dispatch Document
    await setDoc(doc(db, DISPATCH_COL, dispatchId), fullLog);

    // 2. Adjust inventory quantities for each item dispatched
    for (const item of dispatchData.items) {
      if (!item.batchNo || !item.quantity || item.quantity <= 0) continue;

      // Find matching batch
      const targetBatch = batches.find(b => b.batchNo === item.batchNo || b.id === item.batchId);
      if (targetBatch) {
        const prevQty = targetBatch.quantity;
        const newQty = Math.max(0, prevQty - item.quantity);

        // Update batch quantity
        const batchRef = doc(db, BATCHES_COL, targetBatch.id);
        await updateDoc(batchRef, {
          quantity: newQty,
          updatedAt: new Date().toISOString()
        });

        // Add audit deduction log
        await addBatchLog({
          batchId: targetBatch.id,
          batchNo: targetBatch.batchNo,
          productName: item.productName || targetBatch.productName,
          action: 'dispatch_deduction',
          quantityChanged: -item.quantity,
          previousQty: prevQty,
          newQty: newQty,
          referenceId: dispatchId,
          outletName: dispatchData.outletNames.join(', '),
          driverName: dispatchData.driverName,
          recordedBy: dispatchData.supervisor,
          timestamp: new Date().toISOString()
        });
      }
    }

    return dispatchId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${DISPATCH_COL}/${dispatchId}`);
    throw error;
  }
}

export async function updateDispatchLog(
  id: string, 
  updates: Partial<DispatchLog>
): Promise<void> {
  try {
    await updateDoc(doc(db, DISPATCH_COL, id), {
      ...updates,
      status: 'edited',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${DISPATCH_COL}/${id}`);
    throw error;
  }
}

// ----------------- USERS & ACCESS MANAGEMENT -----------------
export function subscribeUsers(callback: (users: UserProfile[]) => void) {
  const q = query(collection(db, USERS_COL));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserProfile[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...d.data() } as UserProfile);
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, USERS_COL);
    }
  );
}

export async function createNewUser(user: Omit<UserProfile, 'id'>): Promise<string> {
  const id = user.uid || `user-${Date.now()}`;
  try {
    await setDoc(doc(db, USERS_COL, id), { ...user, id, uid: id });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${USERS_COL}/${id}`);
    throw error;
  }
}

export async function updateUserRoleAndPermissions(
  userId: string,
  role: UserRole,
  permissions: any,
  userIdCode?: string
): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COL, userId), {
      role,
      permissions,
      userIdCode: userIdCode || undefined,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${USERS_COL}/${userId}`);
    throw error;
  }
}

export async function deleteUserRecord(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, USERS_COL, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${USERS_COL}/${userId}`);
    throw error;
  }
}
