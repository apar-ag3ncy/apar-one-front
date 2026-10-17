import Link from "next/link";

const frames = [
  { src: "/work/girvaan/1.jpg", alt: "Girvaan jewellery campaign artwork", shape: "portrait", width: 900, height: 1600 },
  { src: "/work/girvaan/curated/rose-ring.webp", alt: "Girvaan rose ring campaign photograph", shape: "detail-one", width: 1200, height: 1500 },
  { src: "/work/girvaan/curated/emerald-necklace.webp", alt: "Girvaan emerald necklace photograph", shape: "detail-two", width: 1200, height: 1500 },
  { src: "/work/girvaan/2.jpg", alt: "Girvaan collection artwork", shape: "portrait-two", width: 900, height: 1600 },
] as const;

/** A quiet image-led interlude after the homepage's second statement. */
export function HomeImageBento() {
  return <section className="home-image-bento" aria-label="Girvaan campaign imagery">
    <div className="wrap">
      <div className="home-bento-grid">
        {frames.map(frame => <Link href="/work/girvaan" className={`home-bento-tile home-bento-${frame.shape}`} key={frame.src} aria-label={`Explore Girvaan — ${frame.alt}`}>
          {/* The original assets stay intact; fixed cells make the collage stable while loading. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frame.src} alt={frame.alt} width={frame.width} height={frame.height} loading="lazy" decoding="async" />
          <span className="home-bento-arrow" aria-hidden="true">↗</span>
        </Link>)}
      </div>
      <div className="home-bento-caption"><span>Girvaan</span><span>A story of gold</span></div>
    </div>
  </section>;
}
