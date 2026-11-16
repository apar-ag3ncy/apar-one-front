"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { nextStory } from "@/lib/motion/story-playback";

export function useStoryGallery(count: number) {
  const track = useRef<HTMLDivElement>(null);
  const offsets = useRef<number[]>([]);
  const current = useRef(0);
  const [active, setActive] = useState(0);
  const direction = useRef(1);
  const drag = useRef<{ pointer: number; x: number; left: number; index: number; moved: boolean } | null>(null);

  const select = useCallback((index: number) => {
    const next = Math.max(0, Math.min(count - 1, index));
    const left = offsets.current[next];
    if (left === undefined) return;
    track.current?.scrollTo({ left, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [count]);

  const advance = useCallback(() => {
    const next = nextStory(current.current, direction.current, count);
    direction.current = next.direction;
    select(next.index);
  }, [count, select]);

  useEffect(() => {
    const root = track.current;
    if (!root || !count) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const x = root.scrollLeft;
      let nearest = 0;
      for (let i = 1; i < offsets.current.length; i++) {
        if (Math.abs(offsets.current[i] - x) < Math.abs(offsets.current[nearest] - x)) nearest = i;
      }
      current.current = nearest;
      setActive(nearest);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      const cards = Array.from(root.children) as HTMLElement[];
      const start = cards[0]?.offsetLeft ?? 0;
      offsets.current = cards.map(card => card.offsetLeft - start);
      const index = Math.min(current.current, count - 1);
      root.scrollTo({ left: offsets.current[index] ?? 0, behavior: "instant" });
      current.current = index;
      setActive(index);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    root.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); root.removeEventListener("scroll", onScroll); };
  }, [count]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? count - 1
      : event.key === "ArrowLeft" ? active - 1 : event.key === "ArrowRight" ? active + 1 : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    drag.current = { pointer: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, index: current.current, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const distance = event.clientX - start.x;
    if (!start.moved && Math.abs(distance) < 5) return;
    start.moved = true;
    event.currentTarget.dataset.dragging = "true";
    event.currentTarget.scrollLeft = start.left - distance;
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const distance = event.currentTarget.scrollLeft - start.left;
    if (start.moved) select(start.index + (Math.abs(distance) > 48 ? Math.sign(distance) : 0));
  };

  return { track, active, advance, onKeyDown, onPointerDown, onPointerMove, onPointerEnd };
}
