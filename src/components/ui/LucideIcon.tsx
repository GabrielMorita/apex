"use client";
import * as LucideIcons from "lucide-react";
import type { LucideIcon as LucideIconType } from "lucide-react";

interface LucideIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const ALL_ICONS = LucideIcons as unknown as Record<string, LucideIconType | undefined>;

// Renders a Lucide icon by its PascalCase name, e.g. name="BookOpen"
// Falls back to Circle if the icon is not found
export default function LucideIcon({ name, size = 16, color, strokeWidth = 1.5, className }: LucideIconProps) {
  // Try exact match first, then try common fixes
  const Icon =
    ALL_ICONS[name] ??
    ALL_ICONS[name + "Icon"] ??
    ALL_ICONS["Circle"];

  if (!Icon || typeof Icon !== "function") {
    const Fallback = LucideIcons.Circle;
    return <Fallback size={size} color={color} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
  }

  return <Icon size={size} color={color} strokeWidth={strokeWidth} className={className} aria-hidden="true" />;
}
