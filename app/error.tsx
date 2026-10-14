"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HoverText } from "@/components/hover-text";

/**
 * Route error boundary - catches a runtime error in any page and shows an
 * explanation with a retry, instead of Next's bare "Application error" screen
 * (or, on a dark case page, a blank dark screen). The nav and footer stay.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface the real error in the console for debugging; the visitor sees the
    // friendly state below.
    console.error(error);
  }, [error]);

  return (
    <section className="page-hero" data-screen-label="Error">
      <div className="wrap">
        <span className="eyebrow">
          <i className="dot" /> Something went wrong
        </span>
        <h1 className="display d-lg" style={{ marginTop: 8 }}>
          This page hit a <em>snag.</em>
        </h1>
        <p className="lead">
          A part of the page failed to load. Reloading usually fixes it - if it keeps happening,
          write to us at info@apar.agency{error.digest ? ` (ref ${error.digest})` : ""}.
        </p>
        <div className="chip-row" style={{ marginTop: 34 }}>
          <button className="btn" type="button" onClick={() => reset()}>
            <HoverText>Try again</HoverText>
            <span className="arr" aria-hidden="true">↺</span>
          </button>
          <Link className="btn-ghost" href="/">
            <HoverText>Back to home</HoverText>
          </Link>
        </div>
      </div>
    </section>
  );
}
