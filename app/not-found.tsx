import type { Metadata } from "next";
import Link from "next/link";
import { HoverText } from "@/components/hover-text";

export const metadata: Metadata = {
  title: "Page not found - APAR",
};

/**
 * 404 - rendered for any unknown URL and for `notFound()` (e.g. /work/<unknown>).
 * Uses the site's own page-hero styles so it reads as part of the site rather
 * than Next's bare default screen.
 */
export default function NotFound() {
  return (
    <section className="page-hero" data-screen-label="404">
      <div className="wrap">
        <span className="eyebrow">
          <i className="dot" /> 404
        </span>
        <h1 className="display d-lg" style={{ marginTop: 8 }}>
          This page doesn&apos;t <em>exist.</em>
        </h1>
        <p className="lead">
          The link may be old, or the address mistyped. The work, the clients and the studio are all
          one click away.
        </p>
        <div className="chip-row" style={{ marginTop: 34 }}>
          <Link className="btn" href="/">
            <HoverText>Back to home</HoverText>
            <span className="arr" aria-hidden="true">↗</span>
          </Link>
          <Link className="btn-ghost" href="/work">
            <HoverText>See the work</HoverText>
          </Link>
        </div>
      </div>
    </section>
  );
}
