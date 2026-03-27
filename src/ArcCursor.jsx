import { useEffect, useState } from "react";



export default function ArcCursor() {
    const isMobile = window.innerWidth < 768;
  const [pos, setPos] = useState({ x: 0, y: 0 });

  if (isMobile) return null;

  useEffect(() => {
    const move = (e) => {
        setPos({ x: e.clientX, y: e.clientY })
        ;
    };
    document.body.classList.add("interacting");
    
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      document.body.classList.remove("interacting");
    };
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