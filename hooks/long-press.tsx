import { useCallback, useRef } from "react";

export function useLongPress(onLongPress: () => void, delay: number = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const blockUntilRef = useRef<number>(0);

  const start = useCallback(
    (e: React.TouchEvent) => {
      if (Date.now() < blockUntilRef.current) return;

      firedRef.current = false;
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        blockUntilRef.current = Date.now() + 600;
        onLongPress();
      }, delay);
    },
    [onLongPress, delay],
  );

  const cancel = useCallback((reason: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      cancel("touchend");
      if (firedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        firedRef.current = false;
      }
    },
    [cancel],
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    const isBlocked = Date.now() < blockUntilRef.current;
    if (isBlocked) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: handleTouchEnd,
    onTouchMove: () => cancel("touchmove"),
    onClick: handleClick,
  };
}
