import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/configuracoes")({ head: () => pageMeta("Configurações", "Ajuste notificações e preferências de planejamento da Syna."), component: SettingsPage });
