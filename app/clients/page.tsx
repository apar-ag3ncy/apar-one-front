import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Clients — APAR Digital Marketing Agency",
  description: "The brands APAR works with — jewellery houses and lifestyle brands across India.",
};

const FEATURED = [
  { cls: "chheda", href: "/work/chheda", i: "01", cat: "Jewellery", h: "Chheda Jewellers", p: "Heritage gold & diamond house — identity, festive campaigns and social growth." },
  { cls: "girvaan", href: "/work/girvaan", i: "02", cat: "Jewellery", h: "Girvaan", p: "A modern jewellery label — brand identity, content engine and performance ads." },
  { cls: "diarah", href: "/work/diarah", i: "03", cat: "Jewellery", h: "Diarah", p: "Luxury fine jewellery — refined rebrand and full-funnel digital campaigns." },
];

const ROSTER = [
  { n: "01", name: "Chheda Jewellers", cat: "Jewellery", href: "/work/chheda" },
  { n: "02", name: "Girvaan", cat: "Jewellery", href: "/work/girvaan" },
  { n: "03", name: "Diarah", cat: "Jewellery", href: "/work/diarah" },
  { n: "04", name: "Silver Emporium", cat: "Jewellery" },
  { n: "05", name: "Achal", cat: "Jewellery" },
  { n: "06", name: "Maison Mireyaa", cat: "Lifestyle" },
  { n: "07", name: "Kundan Jewellers", cat: "Jewellery" },
  { n: "08", name: "Harshit Gold", cat: "Jewellery" },
  { n: "09", name: "Jatubhai Veljibhai Jewellers", cat: "Jewellery" },
  { n: "10", name: "Tarava", cat: "Lifestyle" },
  { n: "11", name: "High on Smiles", cat: "Lifestyle" },
  { n: "12", name: "Signi World", cat: "Lifestyle" },
];

export default function ClientsPage() {
  return (
    <>
      <section className="page-hero" data-screen-label="Clients — Hero">
        <div className="wrap">
          <Reveal className="eyebrow">
            <i className="dot" /> Our clients
          </Reveal>
          <Reveal as="h1" className="display d-lg" style={{ marginTop: 8 }}>
            The brands behind the <em>work.</em>
          </Reveal>
          <Reveal as="p" className="lead" i={1}>
            From heritage jewellery houses to fast-moving lifestyle brands — a focused roster we
            partner with closely. Our three featured stories lead the way.
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }} data-screen-label="Clients — Featured">
        <div className="wrap">
          <Reveal className="tag-line">
            <span>Featured stories</span>
            <i className="ln" />
          </Reveal>
          <div className="featured-clients" style={{ marginTop: 40 }}>
            {FEATURED.map((c, i) => (
              <Reveal key={c.i} i={i} as={Link} href={c.href} className={`fc-card ${c.cls}`}>
                <div className="fc-top">
                  <span className="fc-i">{c.i}</span>
                  <span className="fc-cat">{c.cat}</span>
                </div>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
                <span className="fc-go">
                  View case <i>↗</i>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }} data-screen-label="Clients — Roster">
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
                  <span className="rr-go">↗</span>
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

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="Clients — CTA">
        <div className="wrap">
          <div className="divline" />
          <div className="clients-foot">
            <Reveal as="h2" className="display d-md">
              Join the <em>roster.</em>
            </Reveal>
            <Reveal i={1}>
              <Link className="btn" href="/#contact">
                <span>Start a project</span>
                <span className="arr">↗</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
