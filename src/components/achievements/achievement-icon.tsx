import {
  Zap,
  Flame,
  TrendingUp,
  Shield,
  Award,
  Crown,
  Sun,
  Compass,
  Star,
  BookOpen,
  Layers,
  Bookmark,
  Archive,
  Feather,
  Sparkles,
  Heart,
  Eye,
  Flag,
  Grid,
  FolderPlus,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  flame: Flame,
  "trending-up": TrendingUp,
  shield: Shield,
  award: Award,
  crown: Crown,
  sun: Sun,
  compass: Compass,
  star: Star,
  "book-open": BookOpen,
  layers: Layers,
  bookmark: Bookmark,
  archive: Archive,
  feather: Feather,
  sparkles: Sparkles,
  heart: Heart,
  eye: Eye,
  flag: Flag,
  grid: Grid,
  "folder-plus": FolderPlus,
};

export type AchievementIconProps = {
  name: string;
  className?: string;
  style?: React.CSSProperties;
};

export function AchievementIcon({
  name,
  className = "size-5",
  style,
}: AchievementIconProps) {
  const IconComp = ICON_MAP[name] ?? Award;
  return <IconComp className={className} style={style} />;
}
