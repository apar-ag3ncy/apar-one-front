/** Original cylindrical projection inspired by the reference's visible motion.
 * Only front-facing cards own strips; offscreen cards release their snapshots. */
export function createTestimonialDrum(sources: HTMLElement[], host: HTMLElement, width: number, height: number) {
  const steps = 24, slice = width / steps, radius = width * 1.35;
  // Rotated strips are rasterized separately. Bleed a few pixels of the same
  // card image into the next strip so subpixel rounding cannot expose seams.
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
      strip.style.cssText = `width:${slice + bleed}px;height:${height}px;`;
      const print = sources[index].cloneNode(true) as HTMLElement;
      print.removeAttribute("data-brand");
      print.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
      print.querySelectorAll("canvas").forEach(el => el.remove());
      print.style.cssText = `width:${width}px;height:${height}px;transform:translateX(${-j * slice}px);`;
      print.querySelectorAll<HTMLImageElement>("img").forEach(img => {
        img.loading = "eager";
        img.decoding = "sync";
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
        const visible = Math.abs(angle) < 1.95;
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
          // Shading follows the drum surface, so neighbours recede naturally.
          const shadeAt = (a: number) => `rgba(17,13,10,${Math.min(.68, .85 * (1 - Math.cos(a)))})`;
          shade.style.background = `linear-gradient(90deg,${shadeAt(theta - slice / radius / 2)},${shadeAt(theta + slice / radius / 2)})`;
        }
      }
    },
    destroy() { host.replaceChildren(); },
  };
}
