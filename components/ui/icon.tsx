import type { SVGProps } from "react";

export type IconName =
    "arrow-down-right"
  | "arrow-right"
  | "arrow-left"
  | "arrow-down"
  | "arrow-up"
  | "arrow-left-right"
  | "rotate-ccw"
  | "corner-up-left"
  | "chevron-left"
  | "chevron-right"
  | "zap"
  | "close"
  | "menu"
  | "plus"
  | "star"
  | "grid";

// Decorative SVG icons inherit the existing control's size and brand colour.
// Definitions arrive with the root layout, without fonts or extra requests.
export function UiIcon({ name, className = "", ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg {...props} className={`ui-icon ${className}`.trim()} width="1em" height="1em"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <use href={`#apar-ui-${name}`} />
  </svg>;
}
