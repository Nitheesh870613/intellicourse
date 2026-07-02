/**
 * Offline Library - Uses IndexedDB to store courses for offline access
 */

const DB_NAME = 'intellicourse_offline';
const DB_VERSION = 1;
const STORE_NAME = 'courses';

// Open/Create IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('IndexedDB not available'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('title', 'title', { unique: false });
                store.createIndex('savedAt', 'savedAt', { unique: false });
            }
        };
    });
}

/**
 * Save course to offline library
 */
export async function saveToOfflineLibrary(course) {
    try {
        const db = await openDB();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const offlineCourse = {
            ...course,
            savedAt: new Date().toISOString(),
            isOffline: true
        };

        return new Promise((resolve, reject) => {
            const request = store.put(offlineCourse);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Failed to save to offline library:', err);
        return false;
    }
}

/**
 * Get all offline courses
 */
export async function getOfflineCourses() {
    try {
        const db = await openDB();

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Failed to get offline courses:', err);
        return [];
    }
}

/**
 * Get single offline course by ID
 */
export async function getOfflineCourse(courseId) {
    try {
        const db = await openDB();

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.get(courseId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Failed to get offline course:', err);
        return null;
    }
}

/**
 * Remove course from offline library
 */
export async function removeFromOfflineLibrary(courseId) {
    try {
        const db = await openDB();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.delete(courseId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Failed to remove from offline library:', err);
        return false;
    }
}

/**
 * Check if course exists in offline library
 */
export async function isInOfflineLibrary(courseId) {
    const course = await getOfflineCourse(courseId);
    return !!course;
}

/**
 * Get offline library stats
 */
export async function getOfflineLibraryStats() {
    const courses = await getOfflineCourses();
    return {
        count: courses.length,
        totalModules: courses.reduce((sum, c) => sum + (c.modules?.length || 0), 0)
    };
}
