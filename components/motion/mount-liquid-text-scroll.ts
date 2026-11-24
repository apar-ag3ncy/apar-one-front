import { collectLiquidText, createLiquidFilter, createTextArrival, textLiquidAmount } from "@/lib/motion/text-liquid";

type Filter = ReturnType<typeof createLiquidFilter>;
type Target = { el: HTMLElement; fontSize: number; original: string; arrival: ReturnType<typeof createTextArrival>; filter?: Filter; last: number };

export function mountLiquidTextScroll(root: HTMLElement, defs: SVGDefsElement) {
  if (!("IntersectionObserver" in window)) return () => {};
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const compact = window.matchMedia("(max-width: 900px), (pointer: coarse)");
  const targets = new Map<HTMLElement, Target>();
  const active = new Set<Target>();
  const pool: Filter[] = [];
  let frame = 0;
  let scanFrame = 0;
  let running = false;
  let hasScrolled = false;
  let direction = 1;
  let lastScrollY = window.scrollY;

  const release = (target: Target) => {
    if (!target.filter) return;
    target.el.style.filter = target.original;
    pool.push(target.filter);
    target.filter = undefined;
    target.last = -1;
  };
  const render = () => {
    frame = 0;
    if (!running || document.hidden) return;
    const height = document.documentElement.clientHeight;
    const now = performance.now();
    let revealing = false;
    // Finish layout reads before filter writes. There is no perpetual RAF loop.
    const boxes = [...active].map(target => ({ target, box: target.el.getBoundingClientRect() }));
    for (const { target, box } of boxes) {
      // A stationary cursor must not cancel arrivals of ordinary headings or
      // paragraphs. Only interactive hover and keyboard focus bypass the blur.
      const protectedText = target.el.matches(":focus-within") || target.el.closest('a:hover,button:hover,[role="button"]:hover,[hidden],[inert]');
      // The expanded observer already tracks text before it crosses either
      // edge. Entry starts on the first visible frame; leaving stays clear.
      const visible = box.width > 3 && box.height > 3 && box.bottom > -height * 0.18 && box.top < height * 1.18 && box.right > 0 && box.left < window.innerWidth;
      const inViewport = visible && box.bottom > 0 && box.top < height;
      const wanted = visible && !protectedText ? textLiquidAmount(box.top, box.bottom, height, direction) : 0;
      // Fast downward scrolls must not start/continue a reveal on copy that
      // has already reached the upper reading area. Returning from above can
      // still reveal, but this visit can never become blurry again once clear.
      const canReveal = hasScrolled && !protectedText && (direction < 0 || box.top >= height * 0.35);
      const arrival = target.arrival.sample(wanted, inViewport, canReveal, now);
      const amount = arrival.amount;
      revealing ||= arrival.moving;
      if (amount < 0.002) { release(target); continue; }
      // Small body copy uses the same shape, with gentler distortion. Phones
      // keep native scroll and use a lighter filter, with no per-letter work.
      const strength = (target.fontSize < 28 ? 0.65 : 1) * (compact.matches ? 0.65 : 1);
      const level = Math.round(amount * strength * 100) / 100;
      if (target.last === level) continue;
      if (!target.filter) target.filter = pool.pop() ?? createLiquidFilter(defs);
      target.filter.update(level, target.fontSize);
      target.el.style.filter = `url("#${target.filter.id}")`;
      target.last = level;
    }
    // Keep only a small reuse pool; old routes don't accumulate SVG filters.
    while (pool.length > 12) pool.pop()?.remove();
    if (revealing) queue();
  };
  const queue = () => {
    if (running && !document.hidden && active.size && !frame) frame = requestAnimationFrame(render);
  };
  const scroll = () => {
    const delta = window.scrollY - lastScrollY;
    if (Math.abs(delta) > 0.1) { hasScrolled = true; direction = Math.sign(delta); }
    lastScrollY = window.scrollY;
    queue();
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const target = targets.get(entry.target as HTMLElement);
      if (!target) continue;
      if (entry.isIntersecting) active.add(target);
      else { active.delete(target); release(target); target.arrival.reset(); }
    }
    queue();
  }, { rootMargin: "20% 0px" });

  const scan = () => {
    scanFrame = 0;
    if (!running) return;
    const current = new Set(collectLiquidText(root));
    for (const [el, target] of targets) if (!current.has(el)) {
      observer.unobserve(el); active.delete(target); release(target); targets.delete(el);
    }
    for (const el of current) if (!targets.has(el)) {
      targets.set(el, { el, fontSize: parseFloat(getComputedStyle(el).fontSize), original: el.style.filter, arrival: createTextArrival(), last: -1 });
      observer.observe(el);
    }
    queue();
  };
  const rescan = () => {
    if (running && !scanFrame) scanFrame = requestAnimationFrame(scan);
  };
  const mutations = new MutationObserver(records => {
    // Ignore filter updates and embedded SVGs; observe text/route changes only.
    if (records.some(record => !(record.target instanceof Element && record.target.closest("svg")))) rescan();
  });
  const resize = () => {
    for (const target of targets.values()) {
      target.fontSize = parseFloat(getComputedStyle(target.el).fontSize);
      target.last = -1;
    }
    queue();
  };
  const visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0;
      active.forEach(target => {
        release(target);
        target.arrival.sample(0, true, false, performance.now());
      });
    } else queue();
  };
  const stop = () => {
    running = false;
    observer.disconnect(); mutations.disconnect();
    cancelAnimationFrame(frame); cancelAnimationFrame(scanFrame); frame = 0; scanFrame = 0;
    targets.forEach(release); targets.clear(); active.clear();
    pool.splice(0).forEach(filter => filter.remove());
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    root.removeEventListener("focusin", queue); root.removeEventListener("focusout", queue);
    root.removeEventListener("pointerover", queue); root.removeEventListener("pointerout", queue);
    document.fonts?.removeEventListener("loadingdone", resize);
  };
  const sync = () => {
    stop();
    if (!motion.matches) return;
    running = true;
    hasScrolled = false;
    direction = 1;
    lastScrollY = window.scrollY;
    scan();
    mutations.observe(root, { childList: true, subtree: true, characterData: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", visibility);
    root.addEventListener("focusin", queue); root.addEventListener("focusout", queue);
    root.addEventListener("pointerover", queue); root.addEventListener("pointerout", queue);
    document.fonts?.addEventListener("loadingdone", resize);
  };
  sync();
  motion.addEventListener("change", sync);
  return () => { stop(); motion.removeEventListener("change", sync); };
}
