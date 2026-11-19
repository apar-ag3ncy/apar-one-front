import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getLenis } from '@/lib/scroll-state';
import { cameraAtScroll, easeCamera, nextFlightStop, overlayAt } from './flight';

export function useFlight(
  viewport: RefObject<HTMLElement | null>,
  screen: RefObject<HTMLElement | null>,
  limit: number,
) {
  const position = useRef(0);
  const inset = useRef(0);
  const destination = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  const go = useCallback((index: number) => {
    const track = viewport.current;
    const picture = screen.current;
    if (!track || !picture || !limit) return;
    const next = Math.max(0, Math.min(limit, index));
    const range = track.offsetHeight - picture.offsetHeight;
    const top = window.scrollY + track.getBoundingClientRect().top - inset.current + next * range / limit;
    destination.current = next;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = getLenis();
    if (lenis?.scrollTo && !reduced) {
      const duration = Math.min(.65, .34 + Math.abs(top - window.scrollY) / 3000);
      lenis.scrollTo(top, { duration, easing: t => t * t * (3 - 2 * t) });
    } else {
      window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
    }
  }, [limit, viewport, screen]);

  const step = useCallback((direction: number) => {
    const track = viewport.current;
    const picture = screen.current;
    if (!track || !picture) return false;
    const range = track.offsetHeight - picture.offsetHeight;
    if (range <= 0) return false;
    const offset = inset.current - track.getBoundingClientRect().top;
    const raw = destination.current ?? Math.max(0, Math.min(limit, offset * limit / range));
    const next = matchMedia('(prefers-reduced-motion: reduce)').matches
      ? Math.round(raw) + direction
      : nextFlightStop(raw, direction, limit / range);
    if (next === null || next < 0 || next > limit) return false;
    go(next);
    return true;
  }, [viewport, screen, go, limit]);

  useEffect(() => {
    const track = viewport.current;
    const picture = screen.current;
    if (!track || !picture) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let range = 0;
    let onScreen = false;
    let frame = 0;
    let lastTime = 0;
    let targetPosition = 0;
    let lastPainted = -1;
    let lastChapter = -1;

    function paint(value: number) {
      if (value === lastPainted) return;
      lastPainted = position.current = value;
      const cue = overlayAt(value);
      picture!.style.setProperty('--caption', String(cue.opacity));
      picture!.style.setProperty('--flight-progress', String(value / limit));
      picture!.style.setProperty('--reel-opacity', String(cue.reel));
      if (cue.chapter !== lastChapter) {
        lastChapter = cue.chapter;
        setChapter(cue.chapter);
      }
    }

    function tick(now: number) {
      frame = 0;
      paint(easeCamera(position.current, targetPosition, Math.max(0, now - lastTime)));
      lastTime = now;
      if (position.current !== targetPosition) frame = requestAnimationFrame(tick);
    }

    function stopFrame() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    function sync(immediate = false) {
      if (!onScreen) return;
      const offset = inset.current - track!.getBoundingClientRect().top;
      const cursor = cameraAtScroll(offset, range, limit);
      targetPosition = motion.matches ? Math.round(cursor) : cursor;
      if (destination.current !== null && Math.abs(offset - destination.current * range / limit) <= 1) {
        destination.current = null;
      }
      setAtEnd(range > 0 && offset >= range - 1);

      // Desktop Lenis already eases the document offset. On native scroll only
      // the picture settles; the user's finger always owns the page position.
      if (immediate || motion.matches || getLenis() || offset <= 0 || offset >= range) {
        stopFrame();
        paint(targetPosition);
      } else if (!frame && position.current !== targetPosition) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    function measure() {
      inset.current = parseFloat(getComputedStyle(picture!).top) || 0;
      range = track!.offsetHeight - picture!.offsetHeight;
      // Match roomShot's canvas-aspect cutoff, including the space taken by the site nav.
      picture!.toggleAttribute('data-portrait', picture!.clientWidth < .85 * picture!.clientHeight);
      sync(true);
    }
    function releaseDestination() { destination.current = null; }
    function scroll() { sync(); }
    const bounds = new ResizeObserver(measure);
    bounds.observe(track);
    bounds.observe(picture);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      setVisible(onScreen);
      if (onScreen) measure();
      else { stopFrame(); releaseDestination(); }
    });
    visibility.observe(track);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('scrollend', releaseDestination);
    window.addEventListener('wheel', releaseDestination, { passive: true });
    window.addEventListener('pointerdown', releaseDestination, { passive: true });
    motion.addEventListener('change', measure);
    return () => {
      stopFrame();
      bounds.disconnect();
      visibility.disconnect();
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('scrollend', releaseDestination);
      window.removeEventListener('wheel', releaseDestination);
      window.removeEventListener('pointerdown', releaseDestination);
      motion.removeEventListener('change', measure);
    };
  }, [limit, viewport, screen]);

  return { chapter, atEnd, position, visible, go, step };
}
