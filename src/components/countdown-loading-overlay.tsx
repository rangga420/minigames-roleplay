"use client";

import { useEffect, useRef, useState } from "react";

const COUNTDOWN_STEP_MS = 800;

type CountdownLoadingOverlayProps = {
  onComplete: () => void;
};

export function CountdownLoadingOverlay({
  onComplete,
}: CountdownLoadingOverlayProps) {
  const [display, setDisplay] = useState(3);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t2 = window.setTimeout(() => setDisplay(2), COUNTDOWN_STEP_MS);
    const t3 = window.setTimeout(() => setDisplay(1), COUNTDOWN_STEP_MS * 2);
    const tDone = window.setTimeout(() => {
      onCompleteRef.current();
    }, COUNTDOWN_STEP_MS * 3);

    return () => {
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(tDone);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-100 flex h-screen w-screen items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Hitungan mundur"
    >
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-md"
        aria-hidden
      />
      <span className="relative text-8xl font-bold tabular-nums text-white drop-shadow-lg">
        {display}
      </span>
    </div>
  );
}
