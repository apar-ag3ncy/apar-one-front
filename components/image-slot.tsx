import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type Shape = "rect" | "rounded" | "circle" | "pill";

interface ImageSlotProps {
  shape?: Shape;
  radius?: number;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Static stand-in for the design bundle's drag-and-drop <image-slot>.
 * Renders the editorial gradient placeholder (.ph-img) with an optional
 * caption — real campaign imagery drops in here later.
 */
export function ImageSlot({
  shape = "rounded",
  radius = 12,
  placeholder = "Drop an image",
  className,
  style,
}: ImageSlotProps) {
  let borderRadius = `${radius}px`;
  if (shape === "circle") borderRadius = "50%";
  else if (shape === "pill") borderRadius = "9999px";
  else if (shape === "rect") borderRadius = "0";

  return (
    <div
      className={cn("img-slot ph-img", className)}
      style={{ borderRadius, ...style }}
      aria-label={placeholder}
    >
      <span className="img-slot-cap">{placeholder}</span>
    </div>
  );
}
