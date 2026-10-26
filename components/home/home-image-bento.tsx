import Link from "next/link";

const frames = [
  { image: "mj-ruby-necklace", alt: "Manish Jewellers ruby and diamond necklace in warm sunlight", shape: "portrait", width: 960, height: 1553, sizes: "(max-width: 560px) 70vw, 38vw", position: "50% 65%" },
  { image: "mj-bridal-portrait", alt: "Manish Jewellers bridal portrait with traditional gold, ruby and emerald jewellery", shape: "detail-one", width: 960, height: 644, sizes: "(max-width: 560px) 75vw, 44vw", position: "58% 50%" },
  { image: "mj-campaign", alt: "Three models wearing Manish Jewellers bridal collections in a heritage interior", shape: "detail-two", width: 960, height: 475, sizes: "(max-width: 560px) 95vw, 60vw", position: "60% 45%" },
  { image: "mj-blue-necklace", alt: "Manish Jewellers blue gemstone necklace with a purple centre stone", shape: "portrait-two", width: 1280, height: 1067, sizes: "(max-width: 560px) 135vw, 70vw", position: "52% 50%" },
] as const;

/** A quiet image-led interlude after the homepage's second statement. */
export function HomeImageBento() {
  return <section className="home-image-bento" aria-label="Manish Jewellers selected work">
    <div className="wrap">
      <div className="home-bento-grid">
        {frames.map(frame => <Link href="#diamond-experience" className={`home-bento-tile home-bento-${frame.shape}`} key={frame.image} aria-label="Explore the Manish Jewellers experience">
          {/* The original assets stay intact; fixed cells make the collage stable while loading. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/work/home-bento/${frame.image}-${frame.width}.webp`} srcSet={`/work/home-bento/${frame.image}-640.webp 640w, /work/home-bento/${frame.image}-${frame.width}.webp ${frame.width}w`} sizes={frame.sizes} style={{ objectPosition: frame.position }} alt={frame.alt} width={frame.width} height={frame.height} loading="lazy" decoding="async" />
          <span className="home-bento-name" aria-hidden="true">Manish Jewellers</span>
          <span className="home-bento-arrow" aria-hidden="true">↗</span>
        </Link>)}
      </div>
    </div>
  </section>;
}
