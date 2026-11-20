import { sectionBendPath } from "@/lib/motion/section-bend";

/** Zero-area at rest: the sections retain their natural, straight boundary. */
export function SectionScrollEdge({ position }: { position: "top" | "bottom" }) {
  return <svg className="section-scroll-edge" data-edge-position={position}
    viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d={sectionBendPath(0)} />
  </svg>;
}
