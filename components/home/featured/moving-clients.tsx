import Link from "next/link";
import { FEATURED_CLIENTS } from "@/lib/cases";

// These supplied marks are white-only artwork. Reveal their case palette on
// hover while preserving the original logo silhouette and monochrome rest state.
const MONOCHROME_LOGO_COLORS: Record<string, string> = {
  chheda: "#D8B65B",
  "maison-mireyaa": "#F5D0CE",
  "a-paramount": "#A28E4F",
  "kundan-jewellers": "#C9A062",
  "jatubhai-velji": "#A0544A",
  signi: "#3C3073",
};

export function MovingClients() {
  const clients = FEATURED_CLIENTS.filter(client => client.slug !== "manish-jewellers");
  const rows = [clients.slice(0, 4), clients.slice(4, 8), clients.slice(8, 12)];
  return <section id="clients" className="flow-clients flow-section" aria-labelledby="flow-clients-title" data-no-pixel-trail>
    <div className="wrap flow-client-heading">
      <h2 id="flow-clients-title">Recommended by the best.</h2>
    </div>
    <div className="flow-logo-rows">{rows.map((row, i) => <div className="flow-logo-window" key={i}><div className={`flow-logo-track row-${i}`}>
      {[0, 1, 2].map(copy => <div className="flow-logo-group" key={copy} aria-hidden={copy ? true : undefined}>{row.map(client => <Link href={client.href} tabIndex={copy ? -1 : undefined} aria-label={client.name} data-colorized={Boolean(MONOCHROME_LOGO_COLORS[client.slug]) || undefined} key={client.slug}>
        {/* Client-owned logo assets; duplicate groups are decorative. */}
        <span className="flow-logo-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={client.logo} alt="" width={200} height={110} loading="lazy" />
          {MONOCHROME_LOGO_COLORS[client.slug] && <span className="flow-logo-tint" aria-hidden="true" style={{
            backgroundColor: MONOCHROME_LOGO_COLORS[client.slug],
            maskImage: `url("${client.logo}")`,
            WebkitMaskImage: `url("${client.logo}")`,
          }} />}
        </span>
      </Link>)}</div>)}
    </div></div>)}</div>
  </section>;
}
