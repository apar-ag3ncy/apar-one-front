import Link from "next/link";

const frames = [
  { src: "/work/home-bento/girvaan-campaign-900.webp", srcSet: "/work/home-bento/girvaan-campaign-640.webp 640w, /work/home-bento/girvaan-campaign-900.webp 900w", href: "/work/girvaan", brand: "Girvaan", alt: "Girvaan Father's Day jewellery campaign", shape: "portrait", width: 900, height: 1600 },
  { src: "/work/home-bento/chheda-diamond-960.webp", srcSet: "/work/home-bento/chheda-diamond-640.webp 640w, /work/home-bento/chheda-diamond-960.webp 960w", href: "/work/chheda", brand: "Chheda Jewellers", alt: "Jewellery portrait for Chheda Jewellers", shape: "detail-one", width: 960, height: 640 },
  { src: "/work/home-bento/achal-space-960.webp", srcSet: "/work/home-bento/achal-space-640.webp 640w, /work/home-bento/achal-space-960.webp 960w", href: "/work/achal", brand: "Achal One", alt: "Achal One branded interior overlooking the city", shape: "detail-two", width: 960, height: 540 },
  { src: "/work/home-bento/signi-detail-960.webp", srcSet: "/work/home-bento/signi-detail-640.webp 640w, /work/home-bento/signi-detail-960.webp 960w", href: "/work/signi", brand: "Signi", alt: "Signi lab-grown jewellery styling detail", shape: "portrait-two", width: 960, height: 1200 },
] as const;

/** A quiet image-led interlude after the homepage's second statement. */
export function HomeImageBento() {
  return <section className="home-image-bento" aria-label="More selected work">
    <div className="wrap">
      <div className="home-bento-grid">
        {frames.map(frame => <Link href={frame.href} className={`home-bento-tile home-bento-${frame.shape}`} key={frame.src} aria-label={`Explore ${frame.brand}`}>
          {/* The original assets stay intact; fixed cells make the collage stable while loading. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frame.src} srcSet={frame.srcSet} sizes="(max-width: 560px) 45vw, (max-width: 900px) 42vw, 30vw" alt={frame.alt} width={frame.width} height={frame.height} loading="lazy" decoding="async" />
          <span className="home-bento-name" aria-hidden="true">{frame.brand}</span>
          <span className="home-bento-arrow" aria-hidden="true">↗</span>
        </Link>)}
      </div>
    </div>
  </section>;
}
