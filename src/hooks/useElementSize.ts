// hooks/useElementSize.ts
import { useState, useEffect, useCallback } from 'react';

export function useElementSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ height: 0 });

  const updateSize = useCallback(() => {
    if (ref.current) {
      setSize({ height: ref.current.offsetHeight });
    }
  }, [ref]);

  useEffect(() => {
    if (!ref.current) return;

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect();
  }, [ref, updateSize]);

  return size;
}