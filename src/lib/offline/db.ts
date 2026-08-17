/**
 * IndexedDB Foundation for Offline Support
 * 
 * Phase 1: Basic structure and connection helper.
 * Future phases will add:
 * - Offline transaction queue
 * - Product cache for offline POS
 * - Sync management
 */

const DB_NAME = "zain_super_mart";
const DB_VERSION = 1;

export function openLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Phase 1: Create a simple key-value store for app state
      if (!db.objectStoreNames.contains("app_state")) {
        db.createObjectStore("app_state", { keyPath: "key" });
      }

      // Future: offline_queue store for queued transactions
      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

export async function getAppState(key: string): Promise<unknown> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("app_state", "readonly");
    const store = tx.objectStore("app_state");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function setAppState(key: string, value: unknown): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("app_state", "readwrite");
    const store = tx.objectStore("app_state");
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
