"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

/**
 * The brand/case-study pages (/work/<slug>) intentionally have no footer -
 * their "Next case" line is the end, flowing into the scroll-to-next
 * transition. Every other route keeps the footer.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  const isCasePage = /^\/work\/[^/]+$/.test(pathname);
  if (isCasePage) return null;
  return <Footer />;
}
