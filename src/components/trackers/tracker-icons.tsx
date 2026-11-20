import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bookmark,
  Scroll,
  Cross,
  Flame,
  Sparkles,
  Heart,
  Compass,
  Sun,
  Sunrise,
  Shield,
  Crown,
  Award,
  Anchor,
  Mountain,
  TreePine,
  Star,
  Feather,
  Church,
  Lamp,
  Layers,
} from "lucide-react";

export type TrackerIconItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export const TRACKER_ICONS: ReadonlyArray<TrackerIconItem> = [
  { id: "book-open", label: "Open Scripture", icon: BookOpen },
  { id: "bookmark", label: "Bookmark", icon: Bookmark },
  { id: "scroll", label: "Ancient Scroll", icon: Scroll },
  { id: "cross", label: "Cross & Faith", icon: Cross },
  { id: "flame", label: "Spirit Fire", icon: Flame },
  { id: "sparkles", label: "Divine Inspiration", icon: Sparkles },
  { id: "heart", label: "Devotional Heart", icon: Heart },
  { id: "compass", label: "Wisdom Compass", icon: Compass },
  { id: "sun", label: "Morning Light", icon: Sun },
  { id: "sunrise", label: "Dawn & Renewal", icon: Sunrise },
  { id: "shield", label: "Shield of Faith", icon: Shield },
  { id: "crown", label: "Kingdom Crown", icon: Crown },
  { id: "award", label: "Faithful Milestone", icon: Award },
  { id: "anchor", label: "Anchor of Hope", icon: Anchor },
  { id: "mountain", label: "Holy Mountain", icon: Mountain },
  { id: "tree", label: "Tree of Life", icon: TreePine },
  { id: "star", label: "Guiding Star", icon: Star },
  { id: "feather", label: "Epistle Quill", icon: Feather },
  { id: "church", label: "Sanctuary", icon: Church },
  { id: "lamp", label: "Lamp to My Feet", icon: Lamp },
  { id: "layers", label: "Systematic Study", icon: Layers },
];

export const TRACKER_ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  bookmark: Bookmark,
  scroll: Scroll,
  cross: Cross,
  flame: Flame,
  sparkles: Sparkles,
  heart: Heart,
  compass: Compass,
  sun: Sun,
  sunrise: Sunrise,
  shield: Shield,
  crown: Crown,
  award: Award,
  anchor: Anchor,
  mountain: Mountain,
  tree: TreePine,
  star: Star,
  feather: Feather,
  church: Church,
  lamp: Lamp,
  layers: Layers,
};

export type TrackerIconProps = {
  icon?: string | null;
  className?: string;
};

export function TrackerIcon({ icon, className }: TrackerIconProps) {
  const IconComp = (icon && TRACKER_ICON_MAP[icon]) || BookOpen;
  return <IconComp className={className} />;
}
