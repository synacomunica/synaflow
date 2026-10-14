import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/app/feature-pages";
import { pageMeta } from "@/lib/meta";
export const Route = createFileRoute("/perfil")({ head: () => pageMeta("Meu perfil", "Consulte e atualize as informações do seu perfil."), component: ProfilePage });
