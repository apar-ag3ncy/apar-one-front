"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AparLogo } from "./apar-logo";
import { Magnetic } from "./magnetic";

// Routes with a dark hero — the nav flips to cream (matches the design's
// data-nav="dark"). Girvaan's hero is light, so it keeps the default.
const DARK_ROUTES = new Set(["/work/chheda", "/work/diarah"]);

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/clients", label: "Clients" },
  { href: "/#manifesto", label: "Manifesto" },
  { href: "/#studio", label: "Studio" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onDark = DARK_ROUTES.has(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Close the menu on route change and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={cn("nav", onDark && "on-dark", scrolled && "scrolled", open && "menu-open")}>
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="APAR — Digital Marketing Agency">
            <AparLogo onDark={onDark} />
            <span className="brand-tag">
              Digital Marketing
              <br />
              Agency
            </span>
          </Link>
          <nav className="nav-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <Magnetic strength={0.25}>
            <Link className="nav-cta" href="/#contact" data-magnetic>
              Start a project
            </Link>
          </Magnetic>
          <button
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            type="button"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div
        className={cn("mobile-menu", open && "open")}
        onClick={() => setOpen(false)}
      >
        <div className="mm-links">
          <Link href="/">Home</Link>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="mm-foot">
          <span>info@apar.agency</span>
          <span>Mumbai</span>
        </div>
      </div>
    </>
  );
}
