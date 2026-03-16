import '@testing-library/jest-dom/vitest'

// Mock indexedDB for tests
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: () => ({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      result: {
        transaction: () => ({
          objectStore: () => ({
            get: () => Promise.resolve(null),
            put: () => Promise.resolve(),
            delete: () => Promise.resolve(),
          }),
        }),
      },
    }),
  },
  writable: true,
})
