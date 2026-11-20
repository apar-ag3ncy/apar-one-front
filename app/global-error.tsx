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
      <head><style>{`@font-face{font-family:'Satoshi';src:url('/fonts/fontshare/Satoshi-Variable.woff2') format('woff2');font-style:normal;font-weight:300 900;font-display:swap}`}</style></head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#F4EDE2",
          color: "#1A1714",
          fontFamily: "'Satoshi', system-ui, sans-serif",
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: "normal",
          fontSynthesis: "none",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <p style={{ fontSize: 16, letterSpacing: ".02em", fontWeight: 500, color: "#EB3B25", margin: 0 }}>
            Something went wrong
          </p>
          <h1 style={{ fontFamily: "'Satoshi', system-ui, sans-serif", fontWeight: 500, fontSize: "clamp(32px, 5vw, 54px)", lineHeight: 1.12, letterSpacing: "-.02em", margin: "14px 0 18px" }}>
            APAR couldn&apos;t load this page.
          </h1>
          <p style={{ fontSize: 20, lineHeight: 1.5, color: "#6A6056", margin: "0 0 28px" }}>
            Please reload - if it keeps happening, write to us at info@apar.agency
            {error?.digest ? ` (ref ${error.digest})` : ""}.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ background: "transparent", color: "#1A1714", border: 0, padding: "14px 26px", font: "inherit", fontWeight: 500, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
