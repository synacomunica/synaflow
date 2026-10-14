import { createFileRoute } from "@tanstack/react-router";
import { ProcessDetailPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/processos/$id")({ head: () => pageMeta("Execução de processo", "Acompanhe as etapas e o progresso de uma execução."), component: ProcessRoute });
function ProcessRoute() { const { id } = Route.useParams(); return <ProcessDetailPage id={id} />; }
