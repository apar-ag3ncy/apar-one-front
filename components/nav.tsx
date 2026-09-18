"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getLenis } from "@/lib/scroll-state";
import { AparLogo } from "./apar-logo";
import { Magnetic } from "./magnetic";

// Routes with a dark hero - the nav flips to cream (matches the design's
// data-nav="dark"). Home's beam landing is dark. Every case study under
// /work/<slug> paints the page in the client's own (dark or mid-tone) palette
// with light ink, so they are matched by pattern rather than listed one by one
// - the old fixed list only knew two of the twelve and left the ink nav
// unreadable on the rest.
const DARK_ROUTES = new Set(["/", "/start", "/creative/reel-cover", "/creative/exploded-ring"]);
const isCasePage = (path: string) => /^\/work\/[^/]+$/.test(path);

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/what-we-do", label: "What we do" },
  { href: "/clients", label: "Clients" },
  { href: "/#manifesto", label: "Manifesto" },
  { href: "/#studio", label: "Studio" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onDark = DARK_ROUTES.has(pathname) || isCasePage(pathname);

  useEffect(() => {
    const onScroll = () => {
      const v = window.scrollY > 24;
      if (v !== scrolledRef.current) {
        scrolledRef.current = v;
        setScrolled(v);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page while the menu is open. body{overflow:hidden} stops native
  // scrolling; Lenis drives the window programmatically and ignores it, so it is
  // stopped explicitly too (it re-adds its own `lenis-stopped` class).
  useEffect(() => {
    // html carries overflow-x:clip, which stops body's overflow from propagating
    // to the viewport - so the lock has to sit on <html> to hold native touch
    // scrolling as well.
    document.documentElement.style.overflow = open ? "hidden" : "";
    document.body.style.overflow = open ? "hidden" : "";
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      getLenis()?.start();
    };
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
          <Link className="brand" href="/" aria-label="APAR - Digital Marketing Agency">
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
            <Link className="nav-cta" href="/start" data-magnetic>
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
        // Closed, the menu is only slid off-screen: `inert` keeps its seven links
        // out of the tab order and the accessibility tree at every viewport width.
        inert={!open}
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
