import type { Metadata } from "next";

// /work is a client component (filters), so it cannot export metadata itself -
// the segment layout carries its title/description instead. Case pages under
// /work/[slug] set their own via generateMetadata and override this.
export const metadata: Metadata = {
  title: "Work — APAR AGENTIVE CREACY",
  description:
    "Selected work by APAR - identities, campaigns and content engines for jewellery houses and ambitious lifestyle brands.",
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
