import { useId } from "react";

const STRANDS = [
  "M3 51C23 54 29 29 47 42S76 65 97 49",
  "M3 51C24 70 34 60 52 49S76 30 97 49",
  "M3 51C23 46 32 36 50 49S78 65 97 49",
  "M3 51C26 53 35 57 55 50S82 43 97 49",
];

/** Inline first-paint artwork: no asset request, shader compilation or timer. */
export function ContactOrbArtwork() {
  const id = useId();
  const paint = (name: string) => `url(#${id}-${name})`;

  return <svg className="ttu-orb-placeholder" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={`${id}-body`} cx="38%" cy="30%" r="76%">
        <stop stopColor="#554132" />
        <stop offset=".48" stopColor="#25170f" />
        <stop offset=".82" stopColor="#0c0a08" />
        <stop offset="1" stopColor="#81502b" />
      </radialGradient>
      <radialGradient id={`${id}-glow`}>
        <stop stopColor="#fff4d9" stopOpacity=".95" />
        <stop offset=".3" stopColor="#F6C57A" stopOpacity=".85" />
        <stop offset=".6" stopColor="#F0883B" stopOpacity=".5" />
        <stop offset="1" stopColor="#EB3B25" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-light`} x1="0" x2="1" y1="0" y2="0">
        <stop stopColor="#F0883B" />
        <stop offset=".23" stopColor="#F6C57A" />
        <stop offset=".48" stopColor="#fffbed" />
        <stop offset=".72" stopColor="#ffe6b5" />
        <stop offset="1" stopColor="#EB3B25" />
      </linearGradient>
      <linearGradient id={`${id}-rim`} x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#fff8e7" stopOpacity=".85" />
        <stop offset=".46" stopColor="#F6C57A" stopOpacity=".16" />
        <stop offset="1" stopColor="#F0883B" stopOpacity=".65" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill={paint("body")} />
    <ellipse cx="50" cy="50" rx="49" ry="32" fill={paint("glow")} />
    <g fill="none" stroke={paint("light")} strokeLinecap="round">
      {STRANDS.map(d => <path key={`glow-${d}`} d={d} strokeWidth="7" opacity=".12" />)}
      {STRANDS.map(d => <path key={d} d={d} strokeWidth="2.2" />)}
      <path d="M3 51C29 50 35 48 51 50S78 51 97 49" strokeWidth="1.2" />
    </g>
    <circle cx="50" cy="50" r="47.5" fill="none" stroke={paint("rim")} strokeWidth="1.4" />
    <path d="M9 40A43 43 0 0 1 57 8" fill="none" stroke="#fff8e7" strokeOpacity=".22" strokeWidth="1.5" strokeLinecap="round" />
  </svg>;
}
