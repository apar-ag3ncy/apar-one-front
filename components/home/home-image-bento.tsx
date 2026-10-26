import Link from "next/link";

const frames = [
  {
    image: "mj-ruby-necklace", area: "ruby", brand: "Manish Jewellers", href: "#diamond-experience",
    alt: "Manish Jewellers ruby and diamond necklace in warm sunlight",
    width: 960, height: 1553, wide: false, position: "50% 65%", background: "#e3c5cb",
  },
  {
    image: "mj-bridal-portrait", area: "bridal", brand: "Manish Jewellers", href: "#diamond-experience",
    alt: "Manish Jewellers bridal portrait with traditional gold, ruby and emerald jewellery",
    width: 960, height: 644, wide: false, position: "58% 50%", background: "#793f48",
  },
  {
    image: "mj-campaign", area: "campaign", brand: "Manish Jewellers", href: "#diamond-experience",
    alt: "Three models wearing Manish Jewellers bridal collections in a heritage interior",
    width: 960, height: 475, wide: true, position: "60% 45%", background: "#b6a48b",
  },
  {
    image: "mj-blue-necklace", area: "blue", brand: "Manish Jewellers", href: "#diamond-experience",
    alt: "Manish Jewellers blue gemstone necklace with a purple centre stone",
    width: 1280, height: 1067, wide: false, position: "52% 50%", background: "#bd8966",
  },
  {
    image: "girvaan-floral-jewel", area: "girvaan", brand: "Girvaan", href: "/work/girvaan",
    alt: "Girvaan gold and ruby jewellery arranged on a pink flower",
    width: 960, height: 1280, wide: false, position: "50% 66%", background: "#eeb9cb",
  },
  {
    image: "paramount-gold-kalash", area: "paramount", brand: "A Paramount", href: "/work/a-paramount",
    alt: "A Paramount polished gold kalash against softly draped ivory fabric",
    width: 960, height: 960, wide: false, position: "50% 50%", background: "#d1c1a2",
  },
  {
    image: "high-on-smiles-care", area: "smiles", brand: "High on Smiles", href: "/work/high-on-smiles",
    alt: "Dentist holding blue High on Smiles dental floss packaging",
    width: 1280, height: 853, wide: true, position: "50% 68%", background: "#c3c6c6",
  },
  {
    image: "chheda-red-campaign", area: "chheda", brand: "Chheda Jewellers", href: "/work/chheda",
    alt: "Model wearing Chheda Jewellers gold jewellery and a red outfit beside a vintage car",
    width: 1280, height: 898, wide: true, position: "60% 35%", background: "#53616a",
  },
] as const;

/** A quiet image-led interlude after the homepage's second statement. */
export function HomeImageBento() {
  return <section className="home-image-bento" aria-label="Selected brand imagery">
    <div className="wrap">
      <div className="home-bento-grid">
        {frames.map(frame => <Link href={frame.href} prefetch={false} className="home-bento-tile" style={{ gridArea: frame.area, backgroundColor: frame.background }} key={frame.image} aria-label={`Explore ${frame.brand}`}>
          {/* The original assets stay intact; fixed cells make the collage stable while loading. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/work/home-bento/${frame.image}-${frame.width}.webp`} srcSet={`/work/home-bento/${frame.image}-640.webp 640w, /work/home-bento/${frame.image}-${frame.width}.webp ${frame.width}w`} sizes={frame.wide ? "(max-width: 900px) 92vw, 45vw" : "(max-width: 900px) 46vw, 22vw"} style={{ objectPosition: frame.position }} alt={frame.alt} width={frame.width} height={frame.height} loading="lazy" decoding="async" />
          <span className="home-bento-name" aria-hidden="true">{frame.brand}</span>
          <span className="home-bento-arrow" aria-hidden="true">↗</span>
        </Link>)}
      </div>
    </div>
  </section>;
}
