import { UiIcon } from "@/components/ui/icon";
import Link from "next/link";
import { GalaxyFooterArt } from "@/components/layout/cosmic-footer";
import { HoverText } from "@/components/motion/hover-text";

import { FooterContacts } from "./footer-contacts";

/** Contact footer followed by its interactive APĀR galaxy. */
export function Footer() {
  return (
    <footer className="footer cosmic-footer">
      <div className="wrap footer-inner">
        <div className="footer-row">
          <Link className="footer-talk" href="/#contact" data-magnetic>
            <span className="circ" aria-hidden="true"><UiIcon name="arrow-right" /></span> <HoverText>Let&apos;s talk</HoverText>
          </Link>
          <FooterContacts />
        </div>

        <GalaxyFooterArt />

        <div className="footer-base">
          <span>© {new Date().getFullYear()} APAR Agency. All rights reserved.</span>
          <span>Digital Marketing · Branding · Strategy · AI Content</span>
        </div>
      </div>
    </footer>
  );
}
