"use client";

import { useRef, useState } from "react";

export interface DialOption {
  key: string;
  label: string;
  desc: string;
  /** Relatable brand types this direction suits - helps a client self-select. */
  bestFor?: string;
  /** Quick signal words the direction communicates - shown as chips. */
  traits?: string[];
}

/**
 * AestheticDial - a rotary "tyre" selector for the brand's aesthetic direction.
 * The wheel spins (drag it, use the arrows, or tap a marker/dot); on release it
 * snaps the chosen option under the top pointer, and the hub shows its name.
 * Purely controlled: parent owns the active index. Styled to the APAR palette.
 */
export function AestheticDial({
  options,
  value,
  onChange,
}: {
  options: DialOption[];
  value: number;
  onChange: (i: number) => void;
}) {
  const n = options.length;
  const step = 360 / n;
  const faceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ a0: number; r0: number } | null>(null);
  const [dragRot, setDragRot] = useState<number | null>(null);

  const baseRot = -value * step;
  const rot = dragRot ?? baseRot;

  const angleOf = (e: { clientX: number; clientY: number }) => {
    const r = faceRef.current!.getBoundingClientRect();
    return (
      (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) /
      Math.PI
    );
  };

  const onDown = (e: React.PointerEvent) => {
    faceRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = { a0: angleOf(e), r0: baseRot };
    setDragRot(baseRot);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setDragRot(dragRef.current.r0 + (angleOf(e) - dragRef.current.a0));
  };
  const onUp = () => {
    if (dragRef.current && dragRot != null) {
      const idx = ((Math.round(-dragRot / step) % n) + n) % n;
      onChange(idx);
    }
    dragRef.current = null;
    setDragRot(null);
  };
  const go = (d: number) => onChange(((value + d) % n + n) % n);

  return (
    <div className="dial" role="group" aria-label="Aesthetic direction">
      <div
        ref={faceRef}
        className={`dial-face${dragRot != null ? " dragging" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="dial-tread" style={{ transform: `rotate(${rot}deg)` }}>
          {options.map((o, i) => (
            <button
              type="button"
              key={o.key}
              className={`dial-mark${i === value ? " on" : ""}`}
              style={{ transform: `rotate(${i * step}deg) translateY(calc(var(--dr) * -1))` }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(i);
              }}
              tabIndex={-1}
              aria-hidden
            />
          ))}
        </div>
        <span className="dial-pointer" aria-hidden />
        <div className="dial-hub">
          <span className="dial-count">
            {String(value + 1).padStart(2, "0")}
            <i>/</i>
            {String(n).padStart(2, "0")}
          </span>
          <strong className="dial-name">{options[value].label}</strong>
          <span className="dial-desc">{options[value].desc}</span>
        </div>
      </div>

      <div className="dial-controls">
        <button type="button" className="dial-arrow" onClick={() => go(-1)} aria-label="Previous direction">
          ‹
        </button>
        <div className="dial-dots" role="tablist" aria-label="Aesthetic options">
          {options.map((o, i) => (
            <button
              type="button"
              key={o.key}
              role="tab"
              aria-selected={i === value}
              aria-label={o.label}
              className={`dial-dot${i === value ? " on" : ""}`}
              onClick={() => onChange(i)}
            />
          ))}
        </div>
        <button type="button" className="dial-arrow" onClick={() => go(1)} aria-label="Next direction">
          ›
        </button>
      </div>
    </div>
  );
}
