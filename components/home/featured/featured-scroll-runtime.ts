import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { coverFit, mediaBend, photoPoint, planeMesh } from "@/lib/motion/media-plane";
import { createMotionProgram } from "@/lib/motion/webgl-program";
import { FeaturedPixelHover, imagePixelShader, pixelUniforms } from "./featured-pixel-hover";

const vertex = `
attribute vec2 aUv;
uniform vec4 uRect;
uniform vec2 uViewport;
uniform vec3 uMotion;
uniform vec2 uPhoto;
uniform vec2 uPointer;
varying vec2 vUv;
void main(){
  vUv=aUv;
  float entry=1.-uMotion.x;
  vec2 p=uRect.xy+uRect.zw*aUv;
  p.x+=(aUv.x-.5)*uRect.z*(-.06*entry);
  p.x+=sin(aUv.y*3.14159)*uMotion.z*entry*8.;
  p.y+=entry*24.+sin(aUv.x*3.14159)*(uMotion.y+entry*22.*(aUv.y-.5));
  p.y+=uPhoto.x*6.-uPhoto.y*3.;
  p+=uPointer*uPhoto.y*3.;
  gl_Position=vec4(p.x/uViewport.x*2.-1.,1.-p.y/uViewport.y*2.,0.,1.);
}`;
const fragment = `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uSize;
varying vec2 vUv;
${imagePixelShader}
void main(){
  vec2 q=abs((vUv-.5)*uSize)-(uSize*.5-vec2(15.));
  float distance=length(max(q,0.))+min(max(q.x,q.y),0.)-15.;
  float alpha=1.-smoothstep(-.7,.7,distance);
  if(alpha<=0.) discard;
  gl_FragColor=vec4(imagePixels(vUv,texture2D(uImage,vUv).rgb),alpha);
}`;

type Surface = {
  frame: HTMLElement; image: HTMLImageElement; logo: HTMLImageElement | null;
  texture: WebGLTexture | null; source: string; near: boolean; side: number; background: string;
  bounds: DOMRect | null;
  pixels: FeaturedPixelHover;
  state: { entry: number; parallax: number; hover: number; x: number; y: number };
};

export function mountFeaturedScroll(grid: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "featured-media-plane";
  canvas.setAttribute("aria-hidden", "true");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true });
  if (!gl) return () => {};
  const shader = createMotionProgram(gl, vertex, fragment);
  if (!shader) return () => {};
  const mesh = planeMesh();
  const buffer = gl.createBuffer();
  if (!buffer) { shader.dispose(); return () => {}; }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(shader.program, "aUv");
  gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
  const rectUniform = shader.uniform("uRect"), viewport = shader.uniform("uViewport");
  const motion = shader.uniform("uMotion"), photo = shader.uniform("uPhoto");
  const size = shader.uniform("uSize"), pointer = shader.uniform("uPointer");
  gl.uniform1i(shader.uniform("uImage"), 0);
  const pixelLocations = pixelUniforms(gl, shader.uniform);
  const surfaces: Surface[] = Array.from(grid.querySelectorAll<HTMLElement>(".flow-project-image")).flatMap((frame, i) => {
    const image = frame.querySelector<HTMLImageElement>(".photo-slot-img");
    return image ? [{ frame, image, logo: frame.querySelector<HTMLImageElement>(".girvaan-store-sign img"),
      texture: null, source: "", near: false, bounds: null, side: i % 2 ? -1 : 1,
      pixels: new FeaturedPixelHover(gl, pixelLocations),
      background: getComputedStyle(frame).backgroundColor,
      state: { entry: 1, parallax: 0, hover: 0, x: 0, y: 0 } }] : [];
  });
  let raf = 0, previousTime = 0, bend = 0, scrollTime = 0, velocity = 0, disposed = false;
  let hovered: { surface: Surface; x: number; y: number } | null = null;
  const cleanups: (() => void)[] = [];
  const fallback = () => surfaces.forEach(surface => { delete surface.frame.dataset.motionReady; });

  const upload = (surface: Surface, width: number, height: number) => {
    const { image, logo } = surface;
    if (!image.complete || !image.naturalWidth || (logo && (!logo.complete || !logo.naturalWidth))) return;
    const rasterWidth = Math.min(1400, image.naturalWidth, Math.ceil(width * Math.min(devicePixelRatio || 1, 1.5)));
    const source = `${image.currentSrc}:${logo?.currentSrc}:${rasterWidth}:${(width / height).toFixed(4)}`;
    if (surface.source === source) return;
    // Scale the complete source to fill the frame. Five-argument drawImage avoids
    // rectangles tied to density-corrected srcset dimensions.
    // This is a one-time upload per source, never per animation frame.
    const bitmap = document.createElement("canvas");
    bitmap.width = rasterWidth;
    bitmap.height = Math.round(bitmap.width * height / width);
    const context = bitmap.getContext("2d");
    if (!context) return;
    const parsedPosition = parseFloat(getComputedStyle(image).objectPosition.split(" ")[1] || "50") / 100;
    const positionY = Number.isFinite(parsedPosition) ? Math.max(0, Math.min(1, parsedPosition)) : .5;
    const trim = Number(surface.frame.dataset.edgeTrim) || 0;
    const fit = coverFit(image.naturalWidth, image.naturalHeight, bitmap.width, bitmap.height, positionY, trim);
    context.fillStyle = surface.background;
    context.fillRect(0, 0, bitmap.width, bitmap.height);
    context.drawImage(image, fit.x, fit.y, fit.width, fit.height);
    if (logo) {
      const boxW = bitmap.width * .38, boxH = bitmap.height * .28;
      const scale = Math.min(boxW / logo.naturalWidth, boxH / logo.naturalHeight);
      const logoW = logo.naturalWidth * scale, logoH = logo.naturalHeight * scale;
      context.drawImage(logo, bitmap.width * .31 + (boxW - logoW) / 2,
        bitmap.height * .01 + (boxH - logoH) / 2, logoW, logoH);
    }
    surface.texture ??= gl.createTexture();
    if (!surface.texture) { surface.source = source; return; }
    gl.bindTexture(gl.TEXTURE_2D, surface.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
      if (gl.getError() !== gl.NO_ERROR) throw new Error("Photograph upload unavailable");
      surface.source = source;
    } catch {
      gl.deleteTexture(surface.texture); surface.texture = null; surface.source = source;
      delete surface.frame.dataset.motionReady;
    }
  };
  const draw = (now: number) => {
    raf = 0;
    if (disposed || document.hidden) return;
    const dt = Math.min(.05, (now - (previousTime || now - 16)) / 1000); previousTime = now;
    const target = now - scrollTime < 80 ? mediaBend(velocity) : 0;
    bend += (target - bend) * (1 - Math.exp(-dt * 9));
    // Read all visible frames before changing any DOM style.
    const visible = surfaces.filter(surface => surface.near).map(surface => ({ surface, rect: surface.frame.getBoundingClientRect() }));
    if (hovered && !hovered.surface.frame.contains(document.elementFromPoint(hovered.x, hovered.y))) {
      hovered.surface.pixels.leave(); hovered = null;
    }
    let fadingPixels = false;
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (const { surface, rect } of visible) {
      surface.bounds = rect;
      if (!rect.width || !rect.height || rect.bottom < -40 || rect.top > innerHeight + 40) {
        surface.pixels.clear(); continue;
      }
      upload(surface, rect.width, rect.height);
      if (!surface.texture) continue;
      gl.bindTexture(gl.TEXTURE_2D, surface.texture);
      gl.uniform4f(rectUniform, rect.left, rect.top, rect.width, rect.height);
      gl.uniform2f(size, rect.width, rect.height);
      gl.uniform3f(motion, surface.state.entry, bend, surface.side);
      gl.uniform2f(photo, surface.state.parallax, surface.state.hover);
      gl.uniform2f(pointer, surface.state.x, surface.state.y);
      // Both sampler units stay complete even before a card's first hover.
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, surface.texture);
      gl.activeTexture(gl.TEXTURE0);
      fadingPixels = surface.pixels.draw(rect.width, rect.height, now) || fadingPixels;
      gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 2);
      surface.frame.dataset.motionReady = "true";
    }
    if (fadingPixels || Math.abs(bend) > .02 || Math.abs(target) > .02) raf = requestAnimationFrame(draw);
  };
  const request = () => { if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(draw); };
  const scroll = () => { if (surfaces.some(surface => surface.near)) request(); };
  const clearPixels = () => {
    hovered = null;
    for (const surface of surfaces) surface.pixels.clear();
    request();
  };
  const resize = () => {
    clearPixels();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(viewport, innerWidth, innerHeight);
    request();
  };
  const visibility = () => {
    if (document.hidden) { clearPixels(); cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    else request();
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const surface = surfaces.find(item => item.frame === entry.target);
      if (surface) {
        surface.near = entry.isIntersecting;
        if (!surface.near) surface.pixels.clear();
      }
    }
    request();
  }, { rootMargin: "120px" });
  document.body.append(canvas);
  gsap.registerPlugin(ScrollTrigger);
  const context = gsap.context(() => {
    for (const surface of surfaces) {
      const { state, frame, image, logo } = surface;
      observer.observe(frame);
      // A restored scroll position or slow chunk must not shrink an already visible card.
      if (frame.getBoundingClientRect().top >= innerHeight) {
        gsap.fromTo(state, { entry: 0 }, { entry: 1, ease: "none", onUpdate: request,
          scrollTrigger: { trigger: frame, start: "top bottom", end: "top 65%", scrub: .35 } });
      }
      gsap.fromTo(state, { parallax: -1 }, { parallax: 1, ease: "none", onUpdate: request,
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true,
          onUpdate: self => { velocity = self.getVelocity(); scrollTime = performance.now(); request(); } } });
      const hover = gsap.quickTo(state, "hover", { duration: .75, ease: "power3.out", onUpdate: request });
      const x = gsap.quickTo(state, "x", { duration: .6, ease: "power3.out", onUpdate: request });
      const y = gsap.quickTo(state, "y", { duration: .6, ease: "power3.out", onUpdate: request });
      const card = frame.closest<HTMLElement>(".flow-project");
      let over = false, focused = false;
      const enter = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        over = true; surface.bounds = frame.getBoundingClientRect(); hover(1);
      };
      const reset = () => { if (!over && !focused) { hover(0); x(0); y(0); } };
      const leave = () => {
        over = false; surface.pixels.leave();
        if (hovered?.surface === surface) hovered = null;
        reset();
      };
      const focus = () => { focused = true; hover(1); };
      const blur = () => { focused = false; reset(); };
      const move = (event: PointerEvent) => {
        const bounds = surface.bounds;
        if (!over || !bounds || event.pointerType !== "mouse") return;
        x(gsap.utils.clamp(-.5, .5, (event.clientX - bounds.left) / bounds.width - .5));
        y(gsap.utils.clamp(-.5, .5, (event.clientY - bounds.top) / bounds.height - .5));
        if (frame.dataset.motionReady !== "true") return;
        const point = photoPoint(event.clientX - bounds.left, event.clientY - bounds.top,
          bounds.width, bounds.height, state, bend, surface.side);
        surface.pixels.move(point.x, point.y, bounds.width, bounds.height, performance.now());
        hovered = { surface, x: event.clientX, y: event.clientY };
        request();
      };
      frame.addEventListener("pointerenter", enter); frame.addEventListener("pointerleave", leave);
      frame.addEventListener("pointermove", move, { passive: true });
      frame.addEventListener("pointercancel", leave);
      card?.addEventListener("focusin", focus); card?.addEventListener("focusout", blur);
      image.addEventListener("load", request); logo?.addEventListener("load", request);
      cleanups.push(() => {
        frame.removeEventListener("pointerenter", enter); frame.removeEventListener("pointerleave", leave);
        frame.removeEventListener("pointermove", move); image.removeEventListener("load", request); logo?.removeEventListener("load", request);
        frame.removeEventListener("pointercancel", leave);
        card?.removeEventListener("focusin", focus); card?.removeEventListener("focusout", blur);
      });
    }
  }, grid);
  const contextLost = (event: Event) => { event.preventDefault(); fallback(); dispose(); };
  const dispose = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(raf); context.revert(); observer.disconnect(); fallback();
    for (const cleanup of cleanups) cleanup();
    window.removeEventListener("scroll", scroll); window.removeEventListener("resize", resize);
    window.removeEventListener("blur", clearPixels);
    document.removeEventListener("visibilitychange", visibility); canvas.removeEventListener("webglcontextlost", contextLost);
    for (const surface of surfaces) {
      surface.pixels.dispose();
      if (surface.texture) gl.deleteTexture(surface.texture);
    }
    gl.deleteBuffer(buffer); shader.dispose(); canvas.remove();
  };
  window.addEventListener("scroll", scroll, { passive: true }); window.addEventListener("resize", resize);
  window.addEventListener("blur", clearPixels);
  document.addEventListener("visibilitychange", visibility); canvas.addEventListener("webglcontextlost", contextLost);
  resize();
  return dispose;
}
