import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Force a deterministic, Storage.prototype-compatible implementation for tests.
// Newer Node runtimes expose experimental Web Storage globals that can shadow jsdom.
const storageState = new WeakMap<object, Map<string, string>>()
const stateFor = (target: object) => {
  let state = storageState.get(target)
  if (!state) { state = new Map<string, string>(); storageState.set(target, state) }
  return state
}

Object.defineProperties(Storage.prototype, {
  length: {
    configurable: true,
    get() { return stateFor(this).size },
  },
  clear: {
    configurable: true,
    writable: true,
    value: function () {
      for (const key of stateFor(this).keys()) delete (this as Record<string, unknown>)[key]
      stateFor(this).clear()
    },
  },
  getItem: {
    configurable: true,
    writable: true,
    value: function (key: string) { return stateFor(this).get(String(key)) ?? null },
  },
  key: {
    configurable: true,
    writable: true,
    value: function (index: number) { return Array.from(stateFor(this).keys())[index] ?? null },
  },
  removeItem: {
    configurable: true,
    writable: true,
    value: function (key: string) {
      const normalized = String(key)
      stateFor(this).delete(normalized)
      delete (this as Record<string, unknown>)[normalized]
    },
  },
  setItem: {
    configurable: true,
    writable: true,
    value: function (key: string, value: string) {
      const normalized = String(key)
      const normalizedValue = String(value)
      stateFor(this).set(normalized, normalizedValue)
      Object.defineProperty(this, normalized, { configurable: true, enumerable: true, writable: true, value: normalizedValue })
    },
  },
})

const testLocalStorage = Object.create(Storage.prototype) as Storage
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: testLocalStorage })
Object.defineProperty(window, 'localStorage', { configurable: true, value: testLocalStorage })

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
