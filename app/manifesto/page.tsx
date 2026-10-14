import type { Metadata } from "next";
import { Manifesto } from "@/components/manifesto";
import "./manifesto.css";

export const metadata: Metadata = {
  title: "Manifesto — APAR AGENTIVE CREACY",
  description: "Limitless. Beyond Culture. How APĀR brings meaning, identity and interaction together to build a brand world.",
};

export default function ManifestoPage() {
  return <Manifesto />;
}
