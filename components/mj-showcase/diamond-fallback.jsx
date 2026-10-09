const pieces = [
  [-110, -45, -62, -95, 0, -92],
  [0, -92, 62, -95, 110, -45],
  [-110, -45, 0, -92, -38, -38],
  [0, -92, 110, -45, 38, -38],
  [-110, -45, -38, -38, -145, 0],
  [110, -45, 145, 0, 38, -38],
  [-38, -38, 0, -92, 38, -38],
  [-38, -38, 38, -38, 0, 0],
  [-145, 0, -38, -38, 0, 0],
  [145, 0, 0, 0, 38, -38],
  [-145, 0, 0, 0, -45, 62],
  [145, 0, 45, 62, 0, 0],
  [0, 0, -45, 62, 0, 144],
  [0, 0, 0, 144, 45, 62],
  [-145, 0, -45, 62, 0, 144],
  [145, 0, 0, 144, 45, 62],
];

/** A complete lightweight scene is available before WebGL loads or when it is unavailable. */
export function DiamondFallback() {
  return (
    <svg className="diamond-experience-fallback" viewBox="-600 -360 1200 720" aria-hidden="true">
      <defs>
        <linearGradient id="experience-facet" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fffaf4" />
          <stop offset=".35" stopColor="#a48d91" />
          <stop offset=".6" stopColor="#fff" />
          <stop offset="1" stopColor="#e8ddde" />
        </linearGradient>
        <linearGradient id="experience-rock" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#81725a" />
          <stop offset=".35" stopColor="#282623" />
          <stop offset="1" stopColor="#060606" />
        </linearGradient>
        <pattern id="experience-rock-surface" width="480" height="480" patternUnits="userSpaceOnUse">
          <image href="/showcase/mj/anthracite-preview.webp" width="480" height="480" />
          <rect width="480" height="480" fill="url(#experience-rock)" opacity=".28" />
        </pattern>
      </defs>
      <g className="diamond-fallback-rocks" fill="url(#experience-rock-surface)">
        <g className="diamond-fallback-rock" style={{ "--rx": "-65px", "--ry": "-42px", "--rt": "-12deg" }}>
          <path d="M-370 165L-313 75L-221 45L-125 79L-138 169L-293 223Z" />
          <polygon points="-313,75 -221,45 -164,85 -261,134 -357,156" fill="#c3c3bf" opacity=".25" />
          <polygon points="-261,134 -164,85 -138,169 -293,223" fill="#0d0d0d" opacity=".35" />
          <polyline points="-313,75 -261,134 -293,223" fill="none" stroke="#b0b0ac" strokeWidth="2" opacity=".5" />
        </g>
        <g className="diamond-fallback-rock" style={{ "--rx": "65px", "--ry": "-55px", "--rt": "15deg" }}>
          <path d="M135 125L201 53L319 74L377 158L319 224L199 205Z" />
          <polygon points="135,125 201,53 319,74 263,153" fill="#b9b9b5" opacity=".2" />
          <polygon points="263,153 319,74 377,158 319,224" fill="#151515" opacity=".4" />
          <polyline points="201,53 263,153 199,205" fill="none" stroke="#a4a4a0" strokeWidth="2" opacity=".4" />
        </g>
        <g className="diamond-fallback-rock" style={{ "--rx": "-32px", "--ry": "-24px", "--rt": "-8deg" }}>
          <path d="M-210 232L-190 150L-86 145L-32 210L-89 267L-178 264Z" />
          <polygon points="-190,150 -86,145 -64,187 -146,230 -210,232" fill="#c0c0b8" opacity=".22" />
          <polyline points="-190,150 -146,230 -178,264" fill="none" stroke="#a4a4a0" strokeWidth="2" opacity=".4" />
        </g>
        <g className="diamond-fallback-rock" style={{ "--rx": "32px", "--ry": "-28px", "--rt": "10deg" }}>
          <path d="M43 218L103 146L221 163L239 224L160 275L74 258Z" />
          <polygon points="43,218 103,146 221,163 175,224" fill="#c3c3bf" opacity=".24" />
          <polyline points="103,146 175,224 160,275" fill="none" stroke="#a4a4a0" strokeWidth="2" opacity=".4" />
        </g>
        <g className="diamond-fallback-rock" style={{ "--rx": "5px", "--ry": "-10px", "--rt": "5deg" }}>
          <path d="M-82 282L-94 237L-19 218L72 240L89 282L9 298Z" />
          <polygon points="-94,237 -19,218 72,240 19,267 -82,282" fill="#c3c3bf" opacity=".2" />
        </g>
      </g>
      <g className="diamond-fallback-pieces" fill="url(#experience-facet)" stroke="#fffaf4" strokeWidth=".8">
        {pieces.map((piece, i) => (
          <polygon
            key={i}
            points={piece.join(" ")}
            style={{
              // Stable precision across Node and browser math implementations.
              "--dx": `${(Math.cos(i * 2.4) * (220 + i * 9)).toFixed(3)}px`,
              "--dy": `${(Math.sin(i * 2.4) * (140 + i * 10) - 80).toFixed(3)}px`,
              "--turn": `${(i % 2 ? 1 : -1) * (40 + i * 12)}deg`,
            }}
          />
        ))}
      </g>
    </svg>
  );
}
