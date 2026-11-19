import type { CSSProperties } from 'react';
import css from '@/styles/journey.module.css';

const endY = 32;
const controlY = -16;

export function JourneyTimeline({ names, label, chapter, go }: {
  names: string[];
  label: string;
  chapter: number;
  go: (index: number) => void;
}) {
  const halfCell = 50 / names.length;
  const arc = `M ${halfCell} ${endY} Q 50 ${controlY} ${100 - halfCell} ${endY}`;
  const number = (index: number) => String(index).padStart(2, '0');
  return <nav className={css.map} aria-label={label} style={{ '--stops': names.length } as CSSProperties}>
    <div className={css.stops}>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={arc} className={css.arc} />
        <path d={arc} className={css.trail} />
      </svg>
      {names.map((name, index) => {
        const t = index / (names.length - 1);
        // Sample the same quadratic as the stroke. With a centered control
        // point, x travels linearly through the equal-width button columns.
        const y = endY + 2 * (controlY - endY) * t * (1 - t);
        return <button key={index} type="button" onClick={() => go(index)}
          aria-label={number(index) + ' ' + name} aria-current={index === chapter ? 'step' : undefined}>
          <span style={{ top: (100 * y / 44) + '%' }} />
        </button>;
      })}
    </div>
    <span className={css.mapLabel}>{number(chapter)} · {names[chapter]}</span>
  </nav>;
}
