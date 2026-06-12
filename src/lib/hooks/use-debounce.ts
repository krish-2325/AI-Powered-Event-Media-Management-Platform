// src/lib/hooks/use-debounce.ts

import { useState, useEffect } from "react";

/**
 * Returns a debounced version of the given value that only updates
 * after the specified delay has passed without a new value arriving.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
