const DB_NAME = "lrcsync"
const DB_VERSION = 2
const STORE = "handles"
const KEY = "musicDir"

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, DB_VERSION)

			req.onupgradeneeded = () => {
				if (!req.result.objectStoreNames.contains(STORE)) {
					req.result.createObjectStore(STORE)
				}
			}
			req.onsuccess = () => resolve(req.result)
			req.onerror = () => reject(req.error)
		})

		dbPromise.catch(() => { dbPromise = null })
	}

	return dbPromise
}

function request<T>(req: IDBRequest<T>): Promise<T | undefined> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

async function getStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
	const db = await openDB()
	return db.transaction(STORE, mode).objectStore(STORE)
}

export async function getHandle(): Promise<FileSystemDirectoryHandle | undefined> {
	const store = await getStore("readonly")
	console.log("store: ", store)
	const result = await request<FileSystemDirectoryHandle>(store.get(KEY))
	console.log("result: ", result)
	console.log(`got handle ${result?.name}`)
	return result
}

export async function setHandle(handle: FileSystemDirectoryHandle): Promise<void> {
	const store = await getStore("readwrite")
	await request(store.put(handle, KEY))
}

export async function deleteHandle(): Promise<void> {
	const store = await getStore("readwrite")
	await request(store.delete(KEY))
}