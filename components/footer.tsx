import Link from "next/link";
import { AparLogo } from "./apar-logo";

const SOCIAL = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://linkedin.com", label: "LinkedIn" },
  { href: "https://behance.net", label: "Behance" },
];

/**
 * Footer — Lusion-style: stripped to the essentials (contact · studio · social ·
 * copyright), with a giant "APAR" wordmark spanning the full width on a solid
 * black field. No CTA block, no sitemap, no watermark — the wordmark is the
 * statement.
 */
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-row">
          <Link className="footer-talk" href="/#contact" data-magnetic>
            <span className="circ">→</span> Let&apos;s talk
          </Link>
          <div className="footer-cols">
            <div className="fcol">
              <span className="fcol-h">Contact</span>
              <a href="mailto:info@apar.agency">info@apar.agency</a>
              <a href="tel:+919769530750">+91 97695 30750</a>
            </div>
            <div className="fcol">
              <span className="fcol-h">Studio</span>
              <span>Vile Parle East,</span>
              <span>Mumbai, India</span>
            </div>
            <div className="fcol">
              <span className="fcol-h">Social</span>
              {SOCIAL.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-word">
          <AparLogo />
        </div>

        <div className="footer-base">
          <span>© 2026 APAR Agency</span>
          <span>Digital Marketing · Branding · Strategy · AI Content</span>
        </div>
      </div>
    </footer>
  );
}
