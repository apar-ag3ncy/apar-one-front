import { notFound, redirect } from "next/navigation";

export default function JourneyPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  redirect("/#journey");
}
