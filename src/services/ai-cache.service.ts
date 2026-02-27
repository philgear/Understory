import { Injectable } from '@angular/core';

interface CacheEntry {
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    lastUsed: number;
}

@Injectable({
    providedIn: 'root'
})
export class AiCacheService {
    private readonly DB_NAME = 'understory-cache';
    private readonly STORE_NAME = 'ai-responses';
    private readonly DB_VERSION = 1;
    private readonly MAX_ENTRIES = 50;
    private dbPromise: Promise<IDBDatabase>;
    private encryptionKeyPromise: Promise<CryptoKey>;

    constructor() {
        this.dbPromise = this.initDB();
        this.encryptionKeyPromise = this.initEncryptionKey();
    }

    private async initEncryptionKey(): Promise<CryptoKey> {
        // In production, this would be a user-specific secret or managed via Key Vault.
        const secret = 'understory-clinical-vault-key-poc';
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            enc.encode(secret),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: enc.encode('understory-static-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error('IndexedDB is not supported'));
                return;
            }

            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };

            request.onsuccess = (event: any) => {
                resolve(event.target.result);
            };

            request.onerror = (event: any) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Generates a deterministic cache key from input parameters.
     */
    async generateKey(components: any[]): Promise<string> {
        const rawString = JSON.stringify(components);
        const msgBuffer = new TextEncoder().encode(rawString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
   * Retrieves a value from the cache (Decrypted).
   */
    async get<T = any>(key: string): Promise<T | null> {
        const db = await this.dbPromise;
        const entry: CacheEntry | null = await new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });

        if (!entry) return null;

        // Update lastUsed (Async, don't block)
        this.updateLastUsed(key, entry);

        try {
            const keyObj = await this.encryptionKeyPromise;
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: entry.iv as any },
                keyObj,
                entry.encryptedData
            );
            return JSON.parse(new TextDecoder().decode(decrypted));
        } catch (e) {
            console.error('Cache decryption failed:', e);
            return null;
        }
    }

    /**
     * Stores a value in the cache (Encrypted).
     */
    async set(key: string, value: any): Promise<void> {
        const db = await this.dbPromise;
        const keyObj = await this.encryptionKeyPromise;
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const data = new TextEncoder().encode(JSON.stringify(value));

        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            keyObj,
            data
        );

        const entry: CacheEntry = {
            encryptedData,
            iv,
            lastUsed: Date.now()
        };

        await new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.put(entry, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        // Check if we need to vacuum
        this.vacuum();
    }

    private async updateLastUsed(key: string, entry: CacheEntry) {
        const db = await this.dbPromise;
        entry.lastUsed = Date.now();
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        store.put(entry, key);
    }

    /**
     * Enforces LRU policy by keeping only the MAX_ENTRIES most recently used items.
     */
    private async vacuum(): Promise<void> {
        const db = await this.dbPromise;
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        const entries: { key: string; lastUsed: number }[] = [];
        const cursorRequest = store.openCursor();

        cursorRequest.onsuccess = (event: any) => {
            const cursor = event.target.result;
            if (cursor) {
                entries.push({ key: cursor.key, lastUsed: cursor.value.lastUsed });
                cursor.continue();
            } else {
                if (entries.length > this.MAX_ENTRIES) {
                    // Sort by lastUsed ascending (oldest first)
                    entries.sort((a, b) => a.lastUsed - b.lastUsed);
                    const toDelete = entries.slice(0, entries.length - this.MAX_ENTRIES);
                    toDelete.forEach(e => store.delete(e.key));
                }
            }
        };
    }

    /**
     * Retrieves all cached entries, decrypted.
     */
    async getAllEntries(): Promise<{ key: string; value: any; lastUsed: number }[]> {
        const db = await this.dbPromise;
        const keyObj = await this.encryptionKeyPromise;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.openCursor();
            const results: { key: string; value: any; lastUsed: number }[] = [];

            request.onsuccess = async (event: any) => {
                const cursor = event.target.result;
                if (cursor) {
                    const entry: CacheEntry = cursor.value;
                    try {
                        const decrypted = await crypto.subtle.decrypt(
                            { name: 'AES-GCM', iv: entry.iv as any },
                            keyObj,
                            entry.encryptedData
                        );
                        const value = JSON.parse(new TextDecoder().decode(decrypted));
                        results.push({
                            key: cursor.key as string,
                            value,
                            lastUsed: entry.lastUsed
                        });
                    } catch (e) {
                        console.warn('Failed to decrypt entry during bulk fetch:', cursor.key);
                    }
                    cursor.continue();
                } else {
                    // Sort by lastUsed descending (newest first)
                    resolve(results.sort((a, b) => b.lastUsed - a.lastUsed));
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clears all cached entries.
     */
    async clear(): Promise<void> {
        const db = await this.dbPromise;
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
