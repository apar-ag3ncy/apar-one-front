"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getLenis } from "@/lib/scroll-state";
import { AparLogo } from "@/components/layout/apar-logo";
import { Magnetic } from "@/components/motion/magnetic";
import { HoverText } from "@/components/motion/hover-text";
import { COMPACT_NAV_QUERY } from "@/lib/motion-policy";

// Dark landing routes use light navigation. Internal client stories now share
// white surfaces and use the normal dark navigation treatment.
const DARK_ROUTES = new Set(["/", "/team", "/start", "/creative/reel-cover", "/creative/exploded-ring"]);
const isCasePage = (path: string) => /^\/work\/[^/]+$/.test(path);

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/what-we-do", label: "What we do" },
  { href: "/clients", label: "Clients" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/#studio", label: "Studio" },
  { href: "/#contact", label: "Contact" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const onDark = DARK_ROUTES.has(pathname);

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

  // A resize must not leave desktop scrolling locked behind an invisible menu.
  useEffect(() => {
    const compact = window.matchMedia(COMPACT_NAV_QUERY);
    const closeOnDesktop = () => { if (!compact.matches) setOpen(false); };
    compact.addEventListener("change", closeOnDesktop);
    return () => compact.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const links = Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []);
    links[0]?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus({ preventScroll: true });
      }
      if (e.key !== "Tab") return;
      const stops = [toggleRef.current, ...links].filter(Boolean);
      const current = stops.indexOf(document.activeElement as HTMLAnchorElement);
      if (current < 0 || (!e.shiftKey && current === stops.length - 1) || (e.shiftKey && current === 0)) {
        e.preventDefault();
        (e.shiftKey ? stops.at(-1) : stops[0])?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className={cn("nav", onDark && "on-dark", isCasePage(pathname) && "on-case", scrolled && "scrolled", open && "menu-open")}>
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="APAR - Agentive Creacy">
            <AparLogo onDark={onDark} />
            <span className="brand-tag">
              AGENTIVE
              <br />
              CREACY
            </span>
          </Link>
          <nav className="nav-links">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={!l.href.includes("#") && (pathname === l.href || pathname.startsWith(l.href + "/")) ? "page" : undefined}>
                <HoverText>{l.label}</HoverText>
              </Link>
            ))}
          </nav>
          <Magnetic strength={0.25}>
            <Link className="nav-cta" href="/start" data-magnetic>
              <HoverText>Start a project</HoverText>
            </Link>
          </Magnetic>
          <button
            ref={toggleRef}
            className="nav-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            type="button"
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <nav
        ref={menuRef}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={cn("mobile-menu", open && "open")}
        // Closed, `inert` keeps menu links
        // out of the tab order and the accessibility tree at every viewport width.
        inert={!open}
        onClick={event => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div className="mm-links">
          <Link href="/"><HoverText>Home</HoverText></Link>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              <HoverText>{l.label}</HoverText>
            </Link>
          ))}
          <Link href="/start" className="mm-project">Start a project <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="mm-foot">
          <span>info@apar.agency</span>
          <span>Mumbai</span>
        </div>
      </nav>
    </>
  );
}
