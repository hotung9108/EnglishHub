import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. search query).
 *
 * @param value The value to debounce
 * @param delayMs The delay in milliseconds (default: 350ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
