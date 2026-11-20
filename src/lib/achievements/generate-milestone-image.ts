import type { UserAchievementItem } from "@/actions/achievements";

export type GenerateMilestoneImageParams = {
  achievement: UserAchievementItem;
  iconSvgHtml?: string;
  theme?: "light" | "dark";
};

export async function generateMilestoneImageBlob({
  achievement,
  iconSvgHtml,
  theme,
}: GenerateMilestoneImageParams): Promise<Blob | null> {
  if (typeof window === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const isDark =
    theme === "dark" ||
    (theme === undefined &&
      document.documentElement.classList.contains("dark"));

  const {
    title,
    description,
    category,
    isUnlocked,
    current,
    total,
    percentage,
  } = achievement;

  // Theme palette mapping
  const bgCanvas = isDark ? "#10110c" : "#f8f9fa";
  const bgCard = isDark ? "#181a13" : "#ffffff";
  const borderCard = isDark ? "#2e3324" : "#e1e5ea";
  const orbitColor = isDark ? "#363c2b" : "#e1e5ea";
  const starsColor = isDark ? "#94968c" : "#b0bac5";
  const brandColor = isDark ? "#94968c" : "#5c6b7e";
  const iconBoxBg = isDark ? "#dadad6" : "#1a212d";
  const iconBoxBorder = isDark ? "#ffffff" : "#1a212d";
  const iconStroke = isDark ? "#10110c" : "#ffffff";
  const pillBg = isDark ? "#dadad6" : "#1a212d";
  const pillText = isDark ? "#10110c" : "#ffffff";
  const categoryColor = isDark ? "#94968c" : "#5c6b7e";
  const titleColor = isDark ? "#ffffff" : "#1a212d";
  const descColor = isDark ? "#9e9f97" : "#4f5d6e";
  const statsBg = isDark ? "#24271d" : "#f1f3f5";
  const statsBorder = isDark ? "#363a2b" : "#e1e5ea";
  const statNumberColor = isDark ? "#ffffff" : "#1a212d";
  const statLabelColor = isDark ? "#94968c" : "#5c6b7e";
  const footerColor = isDark ? "#94968c" : "#5c6b7e";

  // 1. Full Canvas Background
  ctx.fillStyle = bgCanvas;
  ctx.fillRect(0, 0, 1080, 1080);

  // 2. Card Container
  ctx.beginPath();
  ctx.roundRect(70, 70, 940, 940, 44);
  ctx.fillStyle = bgCard;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = borderCard;
  ctx.stroke();

  // 3. Ambient Celestial Glow
  const glow = ctx.createRadialGradient(540, 390, 0, 540, 390, 360);
  glow.addColorStop(
    0,
    isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(26, 33, 45, 0.05)"
  );
  glow.addColorStop(
    0.5,
    isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(26, 33, 45, 0.01)"
  );
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(540, 390, 360, 0, Math.PI * 2);
  ctx.fill();

  // 4. Orbit Rings
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = orbitColor;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.arc(540, 390, 210, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(540, 390, 140, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. Star sparkles
  ctx.fillStyle = starsColor;
  const stars: ReadonlyArray<[number, number, number]> = [
    [360, 260, 2.5],
    [720, 270, 3],
    [320, 500, 2],
    [760, 480, 2.5],
    [540, 180, 2],
  ];
  for (const [sx, sy, sr] of stars) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Header Branding
  ctx.textAlign = "center";
  ctx.fillStyle = brandColor;
  ctx.font =
    "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("L U M A   B I B L E   T R A C K E R", 540, 145);

  // 7. Icon Container Box
  ctx.beginPath();
  ctx.roundRect(465, 315, 150, 150, 36);
  ctx.fillStyle = iconBoxBg;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = iconBoxBorder;
  ctx.stroke();

  // 8. Draw Icon
  if (iconSvgHtml) {
    try {
      const adaptedSvg = iconSvgHtml
        .replace(/stroke="[^"]*"/g, `stroke="${iconStroke}"`)
        .replace(/width="[^"]*"/, 'width="76"')
        .replace(/height="[^"]*"/, 'height="76"');

      const blob = new Blob([adaptedSvg], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = url;
      });
      ctx.drawImage(img, 502, 352, 76, 76);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: draw award circle
      ctx.fillStyle = iconStroke;
      ctx.beginPath();
      ctx.arc(540, 390, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 9. Status Pill
  ctx.beginPath();
  ctx.roundRect(405, 495, 270, 36, 18);
  ctx.fillStyle = pillBg;
  ctx.fill();
  ctx.fillStyle = pillText;
  ctx.font =
    "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(
    isUnlocked ? "★ ACHIEVEMENT UNLOCKED" : "🔒 MILESTONE IN PROGRESS",
    540,
    518
  );

  // 10. Category
  ctx.fillStyle = categoryColor;
  ctx.font =
    "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(category.toUpperCase(), 540, 565);

  // 11. Title
  ctx.fillStyle = titleColor;
  ctx.font =
    "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(title, 540, 630);

  // 12. Description
  ctx.fillStyle = descColor;
  ctx.font =
    "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(description, 540, 675);

  // 13. Stats Container
  ctx.beginPath();
  ctx.roundRect(160, 735, 760, 115, 24);
  ctx.fillStyle = statsBg;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = statsBorder;
  ctx.stroke();

  // Dividers
  ctx.beginPath();
  ctx.moveTo(413, 750);
  ctx.lineTo(413, 835);
  ctx.moveTo(666, 750);
  ctx.lineTo(666, 835);
  ctx.strokeStyle = statsBorder;
  ctx.stroke();

  // Stat 1: Completed
  ctx.fillStyle = statNumberColor;
  ctx.font =
    "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(String(current), 286, 785);
  ctx.fillStyle = statLabelColor;
  ctx.font =
    "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("COMPLETED", 286, 818);

  // Stat 2: Target
  ctx.fillStyle = statNumberColor;
  ctx.font =
    "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(String(total), 540, 785);
  ctx.fillStyle = statLabelColor;
  ctx.font =
    "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("TARGET", 540, 818);

  // Stat 3: Progress
  ctx.fillStyle = statNumberColor;
  ctx.font =
    "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`${percentage}%`, 793, 785);
  ctx.fillStyle = statLabelColor;
  ctx.font =
    "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("PROGRESS", 793, 818);

  // 14. Footer
  ctx.fillStyle = footerColor;
  ctx.font =
    "500 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Tracked with Luma  ·  lumabible.app", 540, 930);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
}
