import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/calendario")({ head: () => pageMeta("Calendário", "Visualize datas planejadas e prazos das demandas da agência."), component: CalendarPage });
