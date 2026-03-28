import { useEffect, useState } from "react";

export default function ArcCursor() {
  const [pos, setPos] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // detect mobile safely
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const move = (e) => {
        setPos({
            x: e.clientX,
            y: e.clientY,
        });
    };

    const handleEnter = (e) => {
        setPos({
            x: e.clientX,
            y: e.clientY,
        });
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseenter", handleEnter);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseenter", handleEnter);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // ❗ IMPORTANT: NO early return before hooks

  return (
    <>
      {!isMobile && pos && (
        <div className="arc-cursor"
            style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)"
            }}
        >
            <div className="arc-outer" />
            <div className="arc-inner" />
            <div className="arc-core" />
        </div>   
      )}
    </>
  );
}