'use client';

import { useEffect, useRef } from 'react';
import type { createAlpineScene } from './scene';

export function AlpineArt() {
  const artwork = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = artwork.current!;
    const canvas = el.querySelector('canvas')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let scene: Awaited<ReturnType<typeof createAlpineScene>> | undefined;
    let loading = false, disposed = false, intersecting = false, lost = false;
    let frame = 0, last = 0, elapsed = 0, progress = .5, target = .5;
    const active = () => intersecting && !document.hidden && !reduced.matches && !lost && !disposed;
    function measure() {
      const bounds = el.getBoundingClientRect();
      target = Math.max(0, Math.min(1, (innerHeight-bounds.top)/(innerHeight+bounds.height)));
    }
    function draw(now: number) {
      frame = 0;
      if (!scene || !active()) return;
      const delta = (now-last)/1000;
      if (!last || delta >= .032) {
        const dt = last ? Math.min(delta,.10) : 0;
        const lag = target-progress;
        const gust = Math.min(1,Math.abs(lag)*8);
        progress += lag*(1-Math.exp(-dt*6));
        elapsed += dt*(1+2.6*gust);
        scene.draw(elapsed,progress,gust);
        if (!el.hasAttribute('data-painted')) el.dataset.painted = '';
        last = now;
      }
      frame = requestAnimationFrame(draw);
    }
    function resize() {
      measure();
      scene?.resize(el.clientWidth, el.clientHeight);
    }
    function sync() {
      cancelAnimationFrame(frame); last = 0;
      if (!active()) {
        if (reduced.matches || lost) delete el.dataset.painted;
        return;
      }
      measure(); progress = target;
      if (scene) { frame = requestAnimationFrame(draw); return; }
      if (loading) return;
      loading = true;
      import('./scene').then(async mod => {
        if (disposed || reduced.matches) { loading = false; return; }
        const loaded = await mod.createAlpineScene(canvas);
        if (disposed) { loaded.dispose(); return; }
        scene = loaded; resize(); sync();
      }).catch(() => { loading = false; });
    }
    function onScroll() { if (intersecting) measure(); }
    function lose(e: Event) { e.preventDefault(); lost = true; sync(); }
    function restore() { lost = false; resize(); sync(); }
    const visible = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; sync(); });
    const bounds = new ResizeObserver(resize);
    bounds.observe(el); visible.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    canvas.addEventListener('webglcontextlost', lose);
    canvas.addEventListener('webglcontextrestored', restore);
    return () => {
      disposed = true; cancelAnimationFrame(frame);
      bounds.disconnect(); visible.disconnect();
      window.removeEventListener('scroll', onScroll); reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      canvas.removeEventListener('webglcontextlost', lose);
      canvas.removeEventListener('webglcontextrestored', restore);
      scene?.dispose(); delete el.dataset.painted;
    };
  }, []);
  return <div className="alpine-art" ref={artwork} aria-hidden="true"><canvas /></div>;
}
