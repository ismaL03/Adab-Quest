/**
 * Enregistrements faits dans le Studio, conservés dans le navigateur (IndexedDB).
 * Ils sont joués en priorité sur cet appareil, puis exportés en un fichier .zip
 * à déposer dans public/audio pour que tout le monde les entende.
 */

const DB_NAME = 'iqra-studio';
const STORE = 'recordings';

export interface StudioRecording {
  /** Chemin attendu sans extension, ex. « syllables/ba-fatha_alif-plain ». */
  stem: string;
  blob: Blob;
  /** Extension correspondant au format enregistré (webm, m4a, ogg…). */
  ext: string;
  savedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'stem' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function listRecordings(): Promise<StudioRecording[]> {
  try {
    return await tx('readonly', (s) => s.getAll() as IDBRequest<StudioRecording[]>);
  } catch {
    return []; // navigation privée, stockage bloqué…
  }
}

export function saveRecording(rec: StudioRecording): Promise<IDBValidKey> {
  return tx('readwrite', (s) => s.put(rec));
}

export function deleteRecording(stem: string): Promise<undefined> {
  return tx('readwrite', (s) => s.delete(stem));
}

export const stemOf = (src: string) => src.replace(/\.[a-z0-9]+$/i, '');

/** Format d’enregistrement pris en charge par le navigateur. */
export function pickRecordingFormat(): { mimeType: string; ext: string } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
    { mimeType: 'audio/mp4', ext: 'm4a' },
    { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
    { mimeType: 'audio/webm', ext: 'webm' },
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c.mimeType)) ?? { mimeType: '', ext: 'webm' };
}
