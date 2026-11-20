"use client";

import { UiIcon } from "@/components/ui/icon";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { getLenis } from "@/lib/scroll-state";
import { AparLogo } from "@/components/layout/apar-logo";
import { Magnetic } from "@/components/motion/magnetic";
import { HoverText } from "@/components/motion/hover-text";
import { COMPACT_NAV_QUERY } from "@/lib/motion-policy";

// The dark homepage hero and creative exhibits use light navigation.
const DARK_ROUTES = new Set(["/", "/team", "/creative/reel-cover", "/creative/exploded-ring"]);
const isCasePage = (path: string) => /^\/work\/[^/]+$/.test(path);

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/what-we-do", label: "What we do" },
  { href: "/clients", label: "Clients" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/#studio", label: "Studio" },
  { href: "/#contact", label: "Contact" },
];
const MOBILE_PRIMARY = [{ href: "/", label: "Home" }, LINKS[0], LINKS[5]];
const MOBILE_SECONDARY = LINKS.slice(1, 5);

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const scrolledRef = useRef(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname() ?? "";
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
    const controls = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? []);
    controls[0]?.focus({ preventScroll: true });
    const dismiss = () => {
      setOpen(false);
      toggleRef.current?.focus({ preventScroll: true });
    };
    const onOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !toggleRef.current?.contains(target)) dismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key !== "Tab") return;
      const stops = [toggleRef.current, ...controls].filter(Boolean);
      const current = stops.indexOf(document.activeElement as HTMLElement);
      if (current < 0 || (!e.shiftKey && current === stops.length - 1) || (e.shiftKey && current === 0)) {
        e.preventDefault();
        (e.shiftKey ? stops.at(-1) : stops[0])?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  return (
    <>
      <header className={clsx("nav", onDark && "on-dark", isCasePage(pathname) && "on-case", scrolled && "scrolled", open && "menu-open")}>
        <div className="nav-in">
          <Link className="brand" href="/" aria-label="APAR - Agentive Creacy">
            <AparLogo responsive onDark={onDark} />
            <span className="brand-tag">
              agentive
              <br />
              creacy
            </span>
          </Link>
          <nav className="nav-links" aria-label="Main navigation">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} data-nav-label={l.label} aria-current={!l.href.includes("#") && (pathname === l.href || pathname.startsWith(l.href + "/")) ? "page" : undefined}>
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
            <span className="nav-menu-label">Menu</span>
            <UiIcon name={open ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <div className={clsx("mobile-menu-backdrop", open && "open")} aria-hidden="true" />
      <nav
        ref={menuRef}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className={clsx("mobile-menu", open && "open")}
        // Closed, `inert` keeps menu links
        // out of the tab order and the accessibility tree at every viewport width.
        inert={!open}
        data-lenis-prevent
        onClick={event => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div className="mm-body">
          <div className="mm-links">
            {MOBILE_PRIMARY.map(l => (
              <Link key={l.href} href={l.href} aria-current={!l.href.includes("#") && pathname === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mm-secondary">
            {MOBILE_SECONDARY.map(l => (
              <Link key={l.href} href={l.href} aria-current={!l.href.includes("#") && pathname === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </div>
          <Link href="/start" className="mm-project">Start a project <UiIcon name="arrow-right" /></Link>
        </div>
        <div className="mm-foot">
          <button type="button" className="mm-close" aria-label="Close navigation" onClick={() => {
            setOpen(false);
            toggleRef.current?.focus({ preventScroll: true });
          }}>
            <span>Menu</span><UiIcon name="close" />
          </button>
        </div>
      </nav>
    </>
  );
}
