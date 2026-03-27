import { useEffect, useState } from "react";



export default function ArcCursor() {
    const isMobile = window.innerWidth < 768;
    if (isMobile) return null;
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      className="arc-cursor"
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
  );
}