import { createFileRoute } from "@tanstack/react-router";
import { DemandsPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/demandas")({ head: () => pageMeta("Demandas da Syna", "Acompanhe as demandas compartilhadas de toda a agência."), component: () => <DemandsPage agency /> });
