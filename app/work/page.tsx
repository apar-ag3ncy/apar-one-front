import { WorkIndex } from "@/components/work/work-index";
import type { Viewport } from "next";

export const viewport: Viewport = { themeColor: "#0b0706" };

export default function WorkPage() {
  return <WorkIndex />;
}
