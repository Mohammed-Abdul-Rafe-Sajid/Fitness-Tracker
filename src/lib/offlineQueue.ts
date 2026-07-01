import { openDB } from 'idb';

const DB_NAME = 'habit-tracker-offline-db';
const STORE_NAME = 'pending-logs';

const isBrowser = typeof window !== 'undefined';

const dbPromise = isBrowser
  ? openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        }
      },
    })
  : null;

export interface PendingLog {
  date: string;
  entries: { habitId: string; completed: boolean }[];
}

/**
 * Queues a habit log write in IndexedDB while offline.
 * Overwrites any pending write for the same date.
 */
export async function queueOfflineLog(log: PendingLog): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.put(STORE_NAME, log);
}

/**
 * Retrieves all pending logs currently queued in IndexedDB.
 */
export async function getPendingLogs(): Promise<PendingLog[]> {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
}

/**
 * Deletes a completed/processed log from the IndexedDB queue.
 */
export async function deletePendingLog(date: string): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete(STORE_NAME, date);
}

/**
 * Clears the entire IndexedDB queue.
 */
export async function clearPendingLogs(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}
