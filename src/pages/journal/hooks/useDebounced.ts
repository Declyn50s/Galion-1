import { useEffect, useState, startTransition } from "react";

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      startTransition(() => setDebounced(value as T));
      const timer = setTimeout(() => setShowSkeleton(true), 200);
      Promise.resolve().then(() => {
        const elapsed = performance.now() - start;
        if (elapsed < 200) {
          clearTimeout(timer);
          setShowSkeleton(false);
        }
      });
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return { debounced, showSkeleton };
}
