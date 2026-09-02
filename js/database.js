import { normalizeItem } from './utils.js';

const DB_NAME = 'lifehub';
const DB_VERSION = 1;
const STORE = 'items';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const database = {
  async getAll() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => { const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result.map(normalizeItem).sort((a, b) => b.updatedAt - a.updatedAt)); request.onerror = () => reject(request.error); });
  },
  async put(item) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => { const normalized = normalizeItem(item); const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(normalized); request.onsuccess = () => resolve(normalized); request.onerror = () => reject(request.error); });
  },
  async remove(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id); request.onsuccess = resolve; request.onerror = () => reject(request.error); });
  },
  async clear() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).clear(); request.onsuccess = resolve; request.onerror = () => reject(request.error); });
  }
};
