import { createFileRoute } from "@tanstack/react-router";
import { ClientDetailPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/clientes/$id")({ head: () => pageMeta("Detalhes do cliente", "Consulte demandas, projetos, processos e histórico do cliente."), component: ClientRoute });
function ClientRoute() { const { id } = Route.useParams(); return <ClientDetailPage id={id} />; }
