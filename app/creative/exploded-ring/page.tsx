import type { Metadata } from "next";
import Link from "next/link";
import { ExplodedRingStage } from "@/components/work/exploded/exploded-ring-stage";

export const metadata: Metadata = {
  title: "Exploded ring - APAR Creative Studio",
  description:
    "A scroll-driven exploded view of a solitaire ring - stone, prongs, head and band opening and closing as you scroll. Built by APAR for jewellery houses from their own CAD.",
};

/**
 * Creative-studio showcase: the exploded-view product animation. The stage
 * runs on a placeholder ring until a client's CAD-derived GLB is dropped in.
 */
export default function ExplodedRingPage() {
  return (
    <main className="xr-page">
      <section className="xr-intro" data-screen-label="Exploded ring - Intro">
        <div className="wrap">
          <span className="eyebrow on-red">
            <i className="dot" /> AI Creative Studio · Product film, live
          </span>
          <h1 className="display d-lg" style={{ marginTop: 12 }}>
            A ring, <em>opened.</em>
          </h1>
          <p className="lead xr-lead">
            Every part of the piece - stone, prongs, head, band - separates and returns as you scroll,
            rendered live in the browser from the jeweller&apos;s own CAD. Not a video: the light, the
            angle and the pace answer to the reader.
          </p>
        </div>
      </section>

      <ExplodedRingStage />

      <section className="xr-notes" data-screen-label="Exploded ring - How">
        <div className="wrap">
          <div className="tag-line xr-tagline">
            <span>How it&apos;s built</span>
            <i className="ln" />
          </div>
          <div className="xr-note-grid">
            <div className="xr-note">
              <h3>From the workshop&apos;s CAD</h3>
              <p>
                The same Rhino / Matrix file the piece is cast from, re-meshed for the web and split
                into named parts - so the model is the real design, not an artist&apos;s impression.
              </p>
            </div>
            <div className="xr-note">
              <h3>Lit like a studio shoot</h3>
              <p>
                Gold as a physically based metal, stones through a ray-traced refraction shader, both
                under a real photo-studio light map - the same setup a product photographer builds.
              </p>
            </div>
            <div className="xr-note">
              <h3>Paced by the reader</h3>
              <p>
                One scroll timeline drives the parts, the turn and the camera. It only renders while it
                moves, and falls back to a film on devices that can&apos;t run it.
              </p>
            </div>
          </div>
          <div className="xr-foot">
            <Link className="btn" href="/start">
              <span>Bring your piece</span>
              <span className="arr">↗</span>
            </Link>
            <Link className="btn-ghost light" href="/work">
              See the work
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
