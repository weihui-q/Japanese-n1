import type { Progress, QuizResult } from '../types';

const DB_NAME = 'jlpt-n1-study';
const DB_VERSION = 1;
const PROGRESS_STORE = 'progress';
const QUIZ_STORE = 'quizResults';

let db: IDBDatabase | null = null;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(PROGRESS_STORE)) {
        const store = database.createObjectStore(PROGRESS_STORE, { keyPath: 'itemId' });
        store.createIndex('itemType', 'itemType', { unique: false });
        store.createIndex('nextReview', 'nextReview', { unique: false });
      }
      if (!database.objectStoreNames.contains(QUIZ_STORE)) {
        const store = database.createObjectStore(QUIZ_STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('itemId', 'itemId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export function saveProgress(progress: Progress): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const tx = db.transaction([PROGRESS_STORE], 'readwrite');
    const request = tx.objectStore(PROGRESS_STORE).put(progress);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getProgress(itemId: string): Promise<Progress | undefined> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const tx = db.transaction([PROGRESS_STORE], 'readonly');
    const request = tx.objectStore(PROGRESS_STORE).get(itemId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getAllProgress(): Promise<Progress[]> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const tx = db.transaction([PROGRESS_STORE], 'readonly');
    const request = tx.objectStore(PROGRESS_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function saveQuizResult(result: QuizResult): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const tx = db.transaction([QUIZ_STORE], 'readwrite');
    const request = tx.objectStore(QUIZ_STORE).add(result);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function getDueItems(): Promise<Progress[]> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const now = new Date().toISOString();
    const tx = db.transaction([PROGRESS_STORE], 'readonly');
    const index = tx.objectStore(PROGRESS_STORE).index('nextReview');
    const request = index.openCursor(IDBKeyRange.upperBound(now));
    const results: Progress[] = [];
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export function deleteProgress(itemId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const tx = db.transaction([PROGRESS_STORE], 'readwrite');
    const request = tx.objectStore(PROGRESS_STORE).delete(itemId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function clearDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!db) { reject(new Error('DB not initialized')); return; }
    const tx = db.transaction([PROGRESS_STORE, QUIZ_STORE], 'readwrite');
    tx.objectStore(PROGRESS_STORE).clear();
    tx.objectStore(QUIZ_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
