import { JourneyEntry } from "@/components/journey/journey-entry";

export function WorkIndex() {
  return (
    <main className="work-page work-experience" aria-labelledby="work-title">
      <h1 id="work-title" className="sr-only">Our work</h1>
      <JourneyEntry selectedWorkHref="/clients" />
    </main>
  );
}
