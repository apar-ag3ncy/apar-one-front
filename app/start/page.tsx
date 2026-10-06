import type { Metadata } from "next";
import { StartForm } from "@/components/start-form";

export const metadata: Metadata = {
  title: "Start a project - APAR",
  description:
    "Tell us about your brand and the aesthetic direction you're after. APAR takes good brands and lifts them to top-notch.",
};

export default function StartProjectPage() {
  return <StartForm />;
}
