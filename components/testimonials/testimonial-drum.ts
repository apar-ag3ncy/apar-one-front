/** Original cylindrical projection inspired by the reference's visible motion.
 * Only front-facing cards own strips; offscreen cards release their snapshots. */
export function createTestimonialDrum(sources: HTMLElement[], host: HTMLElement, width: number, height: number) {
  const compact = matchMedia("(max-width: 767px)").matches;
  const steps = compact ? 20 : 24, slice = width / steps, radius = width * 1.35;
  // Rotated strips are rasterized separately. Bleed only into the next strip;
  // the outer edge must end exactly where the original card image ends.
  const bleed = 3;
  const pitch = 1 / 1.35 + .09;
  const layers = sources.map((source, index) => {
    const el = document.createElement("div");
    el.className = "tc-card-layer";
    el.dataset.brand = source.dataset.brand;
    el.dataset.index = String(index);
    host.append(el);
    return { el, strips: [] as { el: HTMLElement; shade: HTMLElement }[] };
  });
  const wrap = (value: number) => ((value % sources.length) + sources.length) % sources.length;
  const build = (index: number) => {
    const layer = layers[index];
    const fragment = document.createDocumentFragment();
    for (let j = 0; j < steps; j++) {
      const strip = document.createElement("div");
      strip.className = "tc-strip";
      const stripWidth = slice + (j < steps - 1 ? bleed : 0);
      strip.style.cssText = `width:${stripWidth}px;height:${height}px;transform-origin:${slice / 2}px 50%;`;
      const print = sources[index].cloneNode(true) as HTMLElement;
      print.removeAttribute("data-brand");
      print.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      print.querySelectorAll("canvas").forEach(el => el.remove());
      print.style.cssText = `width:${width}px;height:${height}px;transform:translateX(${-j * slice}px);`;
      print.querySelectorAll<HTMLImageElement>("img").forEach(img => {
        const ready = () => {
          if (img.classList.contains("photo-slot-img") && img.naturalWidth) img.parentElement?.querySelectorAll(".case-ph,.img-slot-cap").forEach(el => el.remove());
        };
        img.addEventListener("load", ready, { once: true });
        img.addEventListener("error", () => { img.style.visibility = "hidden"; }, { once: true });
        if (img.complete) ready();
      });
      const shade = document.createElement("div");
      shade.className = "tc-edge-shade";
      strip.append(print, shade); fragment.append(strip);
      layer.strips.push({ el: strip, shade });
    }
    layer.el.append(fragment);
  };
  return {
    render(position: number) {
      for (let i = 0; i < sources.length; i++) {
        const distance = wrap(i - position + sources.length / 2) - sources.length / 2;
        const angle = distance * pitch;
        const layer = layers[i];
        const visible = Math.abs(angle) < (compact ? 1.5 : 1.95);
        layer.el.style.display = visible ? "block" : "none";
        if (!visible) {
          if (layer.strips.length) { layer.el.replaceChildren(); layer.strips = []; }
          continue;
        }
        if (!layer.strips.length) build(i);
        layer.el.dataset.offset = distance.toFixed(3);
        for (let j = 0; j < steps; j++) {
          const theta = angle + ((j + .5) * slice - width / 2) / radius;
          const x = radius * Math.sin(theta);
          const z = radius * (Math.cos(theta) - 1);
          const { el, shade } = layer.strips[j];
          el.style.transform = `translate3d(${x - slice / 2}px,0,${z}px) rotateY(${theta}rad)`;
          // The old gradient differed by at most ~.016 alpha across a strip.
          // Keep the same angle-based shading without repainting dozens of
          // CSS gradients on every drag/animation frame.
          shade.style.opacity = String(Math.min(.68, .85 * (1 - Math.cos(theta))));
        }
      }
    },
    destroy() { host.replaceChildren(); },
  };
}
