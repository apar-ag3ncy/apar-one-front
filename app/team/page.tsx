import type { Metadata } from "next";
import { PeopleOfApar } from "@/components/layout/cosmic-footer";

export const metadata: Metadata = {
  title: "Our Team — APAR AGENTIVE CREACY",
  description: "Meet the people behind APĀR.",
};

export default function TeamPage() {
  return <main className="team-page"><PeopleOfApar /></main>;
}
