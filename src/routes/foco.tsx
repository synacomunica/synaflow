import { createFileRoute } from "@tanstack/react-router";
import { FocusPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/foco")({ head: () => pageMeta("Modo Foco", "Trabalhe em uma tarefa por vez e registre seu ponto de retomada."), component: FocusPage });
