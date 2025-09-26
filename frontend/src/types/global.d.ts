// Global type extensions

declare global {
  interface Window {
    gc?: () => void; // For manual garbage collection (only available in some browsers/dev tools)
  }
}

export {};