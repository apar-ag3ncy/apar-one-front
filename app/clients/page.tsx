import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { FEATURED_CLIENTS } from "@/lib/cases";
import { FeaturedCard } from "@/components/featured-card";

export const metadata: Metadata = {
  title: "Clients - APAR Digital Marketing Agency",
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
  { n: "08", name: "Harshit Gold", cat: "Jewellery" },
  { n: "09", name: "Jatubhai Velji Jewellers", cat: "Jewellery", href: "/work/jatubhai-velji" },
  { n: "10", name: "Tarava", cat: "Fine Silver", href: "/work/tarava" },
  { n: "11", name: "High on Smiles", cat: "Dental", href: "/work/high-on-smiles" },
  { n: "12", name: "Signi", cat: "Lab-Grown Gems", href: "/work/signi" },
  { n: "13", name: "A Paramount", cat: "Engineering", href: "/work/a-paramount" },
];

export default function ClientsPage() {
  return (
    <>
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
            partner with closely. Our twelve featured stories lead the way.
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 30 }} data-screen-label="Clients - Featured">
        <div className="wrap">
          <Reveal className="tag-line">
            <span>Featured stories</span>
            <i className="ln" />
          </Reveal>
          <div className="featured-clients" style={{ marginTop: 40 }}>
            {FEATURED_CLIENTS.map((c, i) => (
              <FeaturedCard key={c.slug} client={c} i={i} />
            ))}
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

      <section className="section-sm" style={{ paddingTop: 0 }} data-screen-label="Clients - CTA">
        <div className="wrap">
          <div className="divline" />
          <div className="clients-foot">
            <Reveal as="h2" className="display d-md">
              Join the <em>roster.</em>
            </Reveal>
            <Reveal i={1}>
              <Link className="btn" href="/start">
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
