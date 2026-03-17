export function startDynamicFavicon() {
  let angle = 0;

  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

  setInterval(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext("2d");

    const centerX = 16;
    const centerY = 16;

    // const ringColor = "#39FF14";
    // const arcColor = "#00FFA6";
    // const coreColor = "#C7FFE8";

    const ringColor = isDarkMode ? "#39FF14" : "#1E7F1E";
    const arcColor = isDarkMode ? "#00FFA6" : "#2c9e2c";
    const coreColor = isDarkMode ? "#C7FFE8" : "#8FD88F";

    ctx.clearRect(0, 0, 32, 32);

    ctx.shadowBlur = 12;
    ctx.shadowColor = ringColor;

    // outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // rotating arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, 9, angle, angle + Math.PI / 1.3);
    ctx.strokeStyle = arcColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // center core
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.fill();

    angle += 0.6;

    const link = document.querySelector("link[rel='icon']") || document.createElement("link");
    link.rel = "icon";
    link.href = canvas.toDataURL("image/png");

    document.head.appendChild(link);

  }, 120);   // faster update
}