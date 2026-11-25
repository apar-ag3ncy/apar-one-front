"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

export function JourneyEntry() {
  const host = useRef<HTMLElement>(null);
  const [FilmSection, setFilmSection] = useState<ComponentType | null>(null);
  useEffect(() => {
    const section = host.current;
    if (!section) return;
    let mounted = true;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      void import("./journey-section").then(({ JourneySection }) => {
        if (mounted) setFilmSection(() => JourneySection);
      }).catch(() => {
        // The opening and the link to the galaxy also work without the film.
      });
    }, { rootMargin: "700px 0px" });
    observer.observe(section);
    return () => { mounted = false; observer.disconnect(); };
  }, []);

  return <section ref={host} id="journey" className="home-journey" aria-label="APĀR film" data-no-pixel-trail>
    {FilmSection ? <FilmSection /> : <div className="home-journey-opening">
      <h2>APĀR: Beyond the Ordinary</h2>
      <a href="#apar-galaxy">Continue to the APĀR galaxy</a>
    </div>}
  </section>;
}
