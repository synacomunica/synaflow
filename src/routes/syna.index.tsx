import { createFileRoute } from "@tanstack/react-router";
import { AgencyOverviewPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/")({ head: () => pageMeta("Visão geral da Syna", "Acompanhe a saúde da operação, a equipe e as próximas entregas."), component: AgencyOverviewPage });
