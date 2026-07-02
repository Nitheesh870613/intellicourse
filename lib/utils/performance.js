/**
 * Performance Utilities
 * 
 * Common utilities for optimizing frontend performance:
 * - Debounce: Delay execution until user stops typing
 * - Throttle: Limit execution rate
 * - LazyLoad: Load content when visible
 */

/**
 * Debounce function - delays execution until calls stop
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds (default: 300)
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
    let timeoutId = null;

    const debounced = function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func.apply(this, args);
            timeoutId = null;
        }, wait);
    };

    debounced.cancel = function () {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced;
}

/**
 * Throttle function - limits execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in ms (default: 100)
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 100) {
    let inThrottle = false;
    let lastArgs = null;

    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    func.apply(this, lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
}

/**
 * Create a memoized version of a function
 * @param {Function} func - Function to memoize
 * @param {Function} keyFn - Optional key generator function
 * @returns {Function} - Memoized function
 */
export function memoize(func, keyFn = (...args) => JSON.stringify(args)) {
    const cache = new Map();

    return function (...args) {
        const key = keyFn(...args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Format large numbers for display (1000 -> 1K)
 * Memoized for performance
 */
export const formatNumber = memoize((num) => {
    if (!num || isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
});

/**
 * Batch multiple async operations
 * @param {Array<Function>} operations - Array of async functions
 * @param {number} batchSize - Max concurrent operations (default: 3)
 * @returns {Promise<Array>} - Results array
 */
export async function batchAsync(operations, batchSize = 3) {
    const results = [];

    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
    }

    return results;
}

/**
 * Create an abort controller with timeout
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {AbortController}
 */
export function createTimeoutController(timeoutMs = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Clear timeout when signal triggers
    controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));

    return controller;
}
