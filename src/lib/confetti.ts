// High-performance, zero-dependency canvas confetti celebration module

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
};

export type FireConfettiParams = {
  particleCount?: number;
  durationMs?: number;
  originX?: number;
  originY?: number;
  spread?: number;
  velocity?: number;
  colors?: ReadonlyArray<string>;
};

const CELEBRATION_COLORS: ReadonlyArray<string> = [
  "#82ADD4", // Luma accent blue
  "#DDFD2C", // Luma vibrant lime
  "#E2E8F0", // Slate light
  "#F59E0B", // Warm Amber
  "#EC4899", // Magenta pink
  "#8B5CF6", // Purple
  "#3B82F6", // Sky blue
];

export function fireConfetti({
  particleCount = 90,
  durationMs = 3200,
  originX = 0.5,
  originY = 0.6,
  spread = 1.3,
  velocity = 16,
  colors = CELEBRATION_COLORS,
}: FireConfettiParams = {}): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles: ConfettiParticle[] = [];
  const startX = width * originX;
  const startY = height * originY;

  for (let i = 0; i < particleCount; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = velocity * (0.6 + Math.random() * 0.8);
    particles.push({
      x: startX + (Math.random() - 0.5) * 40,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#DDFD2C",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.18,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.07,
      opacity: 1,
      shape: Math.random() > 0.35 ? "rect" : "circle",
    });
  }

  const startTime = performance.now();

  function render(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);

    if (progress >= 1) {
      canvas.remove();
      return;
    }

    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const fadeStart = 0.6;
    const globalFade =
      progress > fadeStart ? 1 - (progress - fadeStart) / (1 - fadeStart) : 1;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // gravity
      p.vx *= 0.985; // drag
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      const alpha = p.opacity * globalFade;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.sin(p.wobble), 1);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

export type CelebratePlanCompletionParams = {
  durationMs?: number;
};

export function celebratePlanCompletion({
  durationMs = 3600,
}: CelebratePlanCompletionParams = {}): void {
  // Center cannon
  fireConfetti({
    particleCount: 80,
    originX: 0.5,
    originY: 0.65,
    velocity: 18,
    durationMs,
  });

  // Left corner cannon
  setTimeout(() => {
    fireConfetti({
      particleCount: 50,
      originX: 0.2,
      originY: 0.75,
      spread: 0.9,
      velocity: 16,
      durationMs,
    });
  }, 220);

  // Right corner cannon
  setTimeout(() => {
    fireConfetti({
      particleCount: 50,
      originX: 0.8,
      originY: 0.75,
      spread: 0.9,
      velocity: 16,
      durationMs,
    });
  }, 440);
}
