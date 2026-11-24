import type { Metadata } from "next";
import { Manifesto } from "@/components/manifesto/manifesto";
import { PinnedGallery } from "@/components/work/pinned-gallery";
import { FEATURED_CLIENTS } from "@/lib/cases";
import "./manifesto.css";
import "@/styles/inner-mobile.css";

export const metadata: Metadata = {
  title: "Manifesto — APAR AGENTIVE CREACY",
  description: "Limitless. Beyond Culture. How APĀR brings meaning, identity and interaction together to build a brand world.",
};

export default function ManifestoPage() {
  return (
    <Manifesto>
      <div id="showreel"><PinnedGallery clients={FEATURED_CLIENTS} /></div>
    </Manifesto>
  );
}
