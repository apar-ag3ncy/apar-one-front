import { WorkIndex } from "@/components/work/work-index";
import { FEATURED_CLIENTS } from "@/lib/cases";

export default function WorkPage() {
  return <WorkIndex clients={FEATURED_CLIENTS} />;
}
