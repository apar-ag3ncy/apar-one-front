import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getLenis } from '@/lib/scroll-state';
import { cameraAtScroll, flightStops, nextFlightStop, overlayAt } from './flight';
import { bindJourneyGestures } from './gestures';

export function useFlight(
  viewport: RefObject<HTMLElement | null>,
  screen: RefObject<HTMLElement | null>,
  limit: number,
) {
  const position = useRef(0);
  const inset = useRef(0);
  const [visible, setVisible] = useState(false);
  const destination = useRef<number | null>(null);
  const [chapter, setChapter] = useState(0);
  const [target, setTarget] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const displayedTarget = useRef(0);

  const go = useCallback((index: number) => {
    const track = viewport.current;
    const picture = screen.current;
    if (!track || !picture || !limit) return;
    const next = Math.max(0, Math.min(limit, index));
    const range = track.offsetHeight - picture.offsetHeight;
    const top = window.scrollY + track.getBoundingClientRect().top - inset.current + next * range / limit;
    destination.current = next;
    const chapterTarget = overlayAt(cameraAtScroll(next, limit, limit)).chapter;
    displayedTarget.current = chapterTarget;
    setTarget(chapterTarget);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = getLenis();
    if (lenis?.scrollTo && !reduced) {
      const duration = Math.min(.65, .34 + Math.abs(top - window.scrollY) / 3000);
      lenis.scrollTo(top, { duration, easing: t => t * t * (3 - 2 * t) });
    }
    else window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
  }, [limit, viewport, screen]);

  const nextStop = useCallback((direction: number, distance: number) => {
    const track = viewport.current, picture = screen.current;
    if (!track || !picture) return null;
    const range = track.offsetHeight - picture.offsetHeight;
    if (range <= 0) return null;
    if (destination.current !== null) return nextFlightStop(destination.current, direction, limit / range);
    const offset = inset.current - track.getBoundingClientRect().top;
    if (offset < -1) return direction > 0 && -offset <= distance ? 0 : null;
    if (offset > range + 1) return direction < 0 && offset - range <= distance ? limit : null;
    return nextFlightStop(offset * limit / range, direction, limit / range);
  }, [viewport, screen, limit]);

  const step = useCallback((direction: number) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      go(Math.round(position.current) + direction);
      return;
    }
    // A control may be clicked while the opening is only partly visible.
    const next = nextStop(direction, Infinity);
    if (next === 0 && direction > 0) go(flightStops[1]);
    else if (next !== null) go(next);
  }, [go, nextStop]);

  useEffect(() => {
    const track = viewport.current;
    const picture = screen.current;
    if (!track || !picture) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let range = 0;
    let onScreen = false;
    let previousPosition = -1;
    let previousChapter = -1;

    function sync() {
      if (!onScreen) return;
      const offset = inset.current - track!.getBoundingClientRect().top;
      const cursor = cameraAtScroll(offset, range, limit);
      const nearest = Math.round(cursor);
      if (destination.current !== null && Math.abs(offset - destination.current * range / limit) <= 1) destination.current = null;
      setAtEnd(range > 0 && offset >= range - 1);
      position.current = motion.matches ? nearest : cursor;
      // Update the navigation only when a stop changes, even during a long drag.
      const navPosition = destination.current === null ? position.current : cameraAtScroll(destination.current, limit, limit);
      const nextTarget = overlayAt(navPosition).chapter;
      if (nextTarget !== displayedTarget.current) {
        displayedTarget.current = nextTarget;
        setTarget(nextTarget);
      }
      if (position.current === previousPosition) return;
      previousPosition = position.current;

      const cue = overlayAt(position.current);
      picture!.style.setProperty('--log-opacity', String(cue.opacity));
      picture!.style.setProperty('--log-offset', (9 * (1 - cue.opacity)) + 'px');
      picture!.style.setProperty('--reel-opacity', String(cue.reel));
      if (cue.chapter !== previousChapter) {
        previousChapter = cue.chapter;
        setChapter(cue.chapter);
      }
    }

    function measure() {
      inset.current = parseFloat(getComputedStyle(picture!).top) || 0;
      range = track!.offsetHeight - picture!.offsetHeight;
      sync();
    }
    function releaseDestination() {
      destination.current = null;
    }
    function pointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse') releaseDestination();
    }
    measure();
    const bounds = new ResizeObserver(measure);
    bounds.observe(track);
    bounds.observe(picture);
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      setVisible(onScreen);
      if (onScreen) measure();
      else releaseDestination();
    });
    visibility.observe(track);
    window.addEventListener('scroll', sync, { passive: true });
    const unbind = bindJourneyGestures(track, (direction, distance) =>
      motion.matches ? null : nextStop(direction, distance), go);
    window.addEventListener('scrollend', sync);
    window.addEventListener('pointerdown', pointerDown);
    motion.addEventListener('change', sync);
    return () => {
      bounds.disconnect();
      visibility.disconnect();
      window.removeEventListener('scroll', sync);
      window.removeEventListener('scrollend', sync);
      window.removeEventListener('pointerdown', pointerDown);
      unbind();
      motion.removeEventListener('change', sync);
    };
  }, [limit, viewport, screen, nextStop, go]);

  return { chapter, target, atEnd, position, visible, go, step };
}
