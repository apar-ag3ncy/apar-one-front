"use client";

/**
 * Last-resort boundary: catches an error thrown by the root layout itself
 * (nav, providers, fonts). It must render its own <html>/<body> and cannot rely
 * on globals.css having loaded, so the styling is inline and minimal - the
 * point is that a visitor never sees a blank white page with no explanation.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <head><style>{`@font-face{font-family:'New Title';src:url('/fonts/fontshare/NewTitle-Variable.woff2') format('woff2');font-style:normal;font-weight:200 700;font-display:swap}`}</style></head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#F4EDE2",
          color: "#1A1714",
          fontFamily: "'New Title', Georgia, serif",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: ".035em",
          wordSpacing: ".08em",
          fontSynthesis: "none",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 17, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700, color: "#EB3B25", margin: 0 }}>
            Something went wrong
          </p>
          <h1 style={{ fontFamily: "'New Title', Georgia, serif", fontWeight: 700, textTransform: "uppercase", fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1.12, letterSpacing: ".04em", wordSpacing: ".10em", margin: "14px 0 18px" }}>
            APAR couldn&apos;t load this page.
          </h1>
          <p style={{ fontSize: 22, lineHeight: 1.5, color: "#6A6056", margin: "0 0 28px" }}>
            Please reload - if it keeps happening, write to us at info@apar.agency
            {error?.digest ? ` (ref ${error.digest})` : ""}.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: "transparent", color: "#1A1714", border: 0, padding: "14px 26px", font: "inherit", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
