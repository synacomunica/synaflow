import { createFileRoute } from "@tanstack/react-router";
import { ClientsPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/syna/clientes/")({ head: () => pageMeta("Clientes", "Consulte clientes, serviços e demandas abertas."), component: ClientsPage });
