import Link from "next/link";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/clients", label: "Clients" },
  { href: "/#manifesto", label: "Manifesto" },
  { href: "/#studio", label: "Studio" },
  { href: "/start", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="footer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="footer-mark" src="/assets/apar-logo-cream.png" alt="" />
      <div className="wrap">
        <h2 className="footer-cta">
          Let&apos;s make something <em>worth remembering.</em>
        </h2>
        <Link className="footer-arrowlink" href="/start" data-magnetic>
          <span className="circ">→</span> Start a project with APAR
        </Link>
        <div className="footer-grid">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="footer-logo" src="/assets/apar-logo-cream.png" alt="APAR" />
            <p className="big">
              A digital marketing &amp; branding agency for brands that refuse to blend in.
            </p>
          </div>
          <div>
            <h4>Sitemap</h4>
            <Link href="/">Home</Link>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <h4>Social</h4>
            <a href="#" target="_blank" rel="noopener">
              Instagram
            </a>
            <a href="#" target="_blank" rel="noopener">
              LinkedIn
            </a>
            <a href="#" target="_blank" rel="noopener">
              Behance
            </a>
          </div>
          <div>
            <h4>Get in touch</h4>
            <a href="mailto:info@apar.agency">info@apar.agency</a>
            <a href="tel:+919769530750">+91 97695 30750</a>
            <p>
              Vile Parle East,
              <br />
              Mumbai, India
            </p>
          </div>
        </div>
        <div className="footer-base">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/apar-logo-cream.png" alt="APAR" />
          <span>© 2026 APAR Agency — All rights reserved.</span>
          <span>Digital Marketing · Branding · Strategy · AI Content</span>
        </div>
      </div>
    </footer>
  );
}
