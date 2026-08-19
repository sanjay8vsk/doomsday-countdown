import { useEffect, useState } from "react";

// Only devices with a real pointing device get the custom cursor. Using
// pointer capability rather than window width means a narrow desktop window
// keeps its cursor, and touch devices never get one.
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

export default function ArcCursor() {
  const [pos, setPos] = useState(null);
  const [hasFinePointer, setHasFinePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(FINE_POINTER);
    const syncPointer = () => setHasFinePointer(mq.matches);
    syncPointer();
    mq.addEventListener("change", syncPointer);

    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    // Drop the cursor when the pointer leaves the window, so it does not
    // sit frozen against the viewport edge.
    const leave = () => setPos(null);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);

    return () => {
      mq.removeEventListener("change", syncPointer);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  const isVisible = hasFinePointer && pos !== null;

  // The native cursor is only hidden while ours is actually on screen.
  useEffect(() => {
    document.body.classList.toggle("arc-cursor-active", isVisible);
    return () => document.body.classList.remove("arc-cursor-active");
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="arc-cursor"
      style={{
        left: pos.x,
        top: pos.y
      }}
    >
      <div className="arc-outer" />
      <div className="arc-inner" />
      <div className="arc-core" />
    </div>
  );
}
