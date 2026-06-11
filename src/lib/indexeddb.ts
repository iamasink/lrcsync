// lib/idb.ts
const DB_NAME = "lrcsync"
const DB_VERSION = 2
const STORE = "handles"

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION)
		req.onupgradeneeded = () => {
			if (!req.result.objectStoreNames.contains(STORE)) {
				req.result.createObjectStore(STORE)
			}
		}
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

export async function getHandle<T>(key: string): Promise<T | null> {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key)
		req.onsuccess = () => resolve(req.result ?? null)
		req.onerror = () => reject(req.error)
	})
}

export async function putHandle<T>(key: string, value: T): Promise<void> {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(value, key)
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
	})
}

export async function deleteHandle(key: string): Promise<void> {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(key)
		req.onsuccess = () => resolve()
		req.onerror = () => reject(req.error)
	})
}