import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * A debounced search term plus the window in which the typed term has not
 * reached the server yet.
 *
 * Search is debounced and every list query keeps the previous page on screen
 * while the next one loads (`placeholderData: keepPreviousData`). Between the
 * keystroke and the response landing, the table therefore shows the *unfiltered*
 * rows with nothing to say they are stale — and since the round trip to the
 * database is slow, that window covers the first couple of keystrokes. It reads
 * as "search does nothing until the third letter".
 *
 * `pending` closes that gap: it is true from the keystroke until the debounce
 * fires, so callers can OR it into the table's `isFetching` and keep the busy
 * state continuous from the very first letter.
 */
export function useDebouncedSearch(value: string, delayMs: number = 300) {
  const debounced = useDebounce(value, delayMs);
  return { debounced, pending: value.trim() !== debounced.trim() };
}
