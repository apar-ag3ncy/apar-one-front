import type { Metadata } from "next";

// Case pages under /work/[slug] override this metadata via generateMetadata.
export const metadata: Metadata = {
  title: "Our work — APAR AGENTIVE CREACY",
  description:
    "Explore the APĀR world through a continuous cinematic journey — ideas, identities and experiences for ambitious brands.",
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
