import { UiIcon } from "@/components/ui/icon";
import type { Metadata } from "next";
import "@/styles/inner-mobile.css";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { FEATURED_CLIENTS } from "@/lib/cases";
import { CLIENT_CARD_ARTWORK } from "@/lib/cases/client-card-artwork";
import { FeaturedCard } from "@/components/work/featured-card";
import { HoverText } from "@/components/motion/hover-text";
import styles from "./manish-card.module.css";

export const metadata: Metadata = {
  title: "Clients — APAR AGENTIVE CREACY",
  description: "The brands APAR works with - jewellery houses and lifestyle brands across India.",
};

const ROSTER = [
  { n: "01", name: "Chheda Jewellers", cat: "Jewellery", href: "/work/chheda" },
  { n: "02", name: "Girvaan", cat: "Jewellery", href: "/work/girvaan" },
  { n: "03", name: "Diarah", cat: "Jewellery", href: "/work/diarah" },
  { n: "04", name: "Silver Emporium", cat: "Silver", href: "/work/silver-emporium" },
  { n: "05", name: "Achal", cat: "Real Estate", href: "/work/achal" },
  { n: "06", name: "Maison Mireyaa", cat: "Florist", href: "/work/maison-mireyaa" },
  { n: "07", name: "Kundan Jewellers", cat: "Jewellery", href: "/work/kundan-jewellers" },
  { n: "08", name: "Harshit Gold", cat: "Jewellery", href: "/work/harshit-gold" },
  { n: "09", name: "Jatubhai Velji Jewellers", cat: "Jewellery", href: "/work/jatubhai-velji" },
  { n: "10", name: "Tarava", cat: "Fine Silver", href: "/work/tarava" },
  { n: "11", name: "High on Smiles", cat: "Dental", href: "/work/high-on-smiles" },
  { n: "12", name: "Signi", cat: "Lab-Grown Gems", href: "/work/signi" },
  { n: "13", name: "A Paramount", cat: "Engineering", href: "/work/a-paramount" },
  { n: "14", name: "Manish Jewellers", cat: "Jewellery", href: "/work/manish-jewellers" },
];

export default function ClientsPage() {
  return (
    <main className="clients-page">
      <section className="page-hero" data-screen-label="Clients - Hero">
        <div className="wrap">
          <Reveal className="eyebrow">
            <i className="dot" /> Our clients
          </Reveal>
          <Reveal as="h1" className="display d-lg" style={{ marginTop: 8 }}>
            The brands behind the <em>work.</em>
          </Reveal>
          <Reveal as="p" className="lead" i={1}>
            From heritage jewellery houses to fast-moving lifestyle brands - a focused roster we
            partner with closely. Explore their stories below.
          </Reveal>
        </div>
      </section>

      <section className="section clients-featured" data-screen-label="Clients - Featured">
        <div className="wrap">
          <Reveal className="tag-line">
            <span>Featured stories</span>
            <i className="ln" />
          </Reveal>
          <div className="featured-clients">
            {FEATURED_CLIENTS.filter(c => c.slug !== "manish-jewellers").map((c, i) => (
              <FeaturedCard key={c.slug} client={c} i={i} artwork={CLIENT_CARD_ARTWORK[c.slug]} />
            ))}
            <Link href="/work/manish-jewellers" className={styles.card} aria-label="Explore Manish Jewellers' case study">
              <span className={styles.media}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.base} src="/work/manish-jewellers/curated/brand-monogram.webp" alt="Manish Jewellers rose-gold monogram" width="1600" height="1195" loading="lazy" decoding="async" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.hover} src="/work/manish-jewellers/curated/trio-landscape.webp" alt="" width="1600" height="792" loading="lazy" decoding="async" />
                <span className={styles.explore}>Explore the story <span aria-hidden="true"><UiIcon name="arrow-up-right" /></span></span>
              </span>
              <span className={styles.caption}><span>Jewellery · Since 1916</span><strong>Manish Jewellers</strong></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} data-screen-label="Clients - Roster">
        <div className="wrap">
          <Reveal className="tag-line">
            <span>The full roster</span>
            <i className="ln" />
          </Reveal>
          <div className="roster">
            {ROSTER.map((r, i) =>
              r.href ? (
                <Reveal key={r.n} i={i} as={Link} href={r.href} className="roster-row">
                  <span className="rr-n">{r.n}</span>
                  <span className="rr-name">{r.name}</span>
                  <span className="rr-cat">{r.cat}</span>
                  <span className="rr-go"><UiIcon name="arrow-up-right" /></span>
                </Reveal>
              ) : (
                <Reveal key={r.n} i={i} className="roster-row static">
                  <span className="rr-n">{r.n}</span>
                  <span className="rr-name">{r.name}</span>
                  <span className="rr-cat">{r.cat}</span>
                  <span className="rr-go" />
                </Reveal>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="Clients - CTA">
        <div className="wrap">
          <div className="divline" />
          <div className="clients-foot">
            <Reveal as="h2" className="display d-md">
              Join the <em>roster.</em>
            </Reveal>
            <Reveal i={1}>
              <Link className="btn" href="/start">
                <HoverText>Start a project</HoverText>
                <span className="arr" aria-hidden="true"><UiIcon name="arrow-up-right" /></span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
