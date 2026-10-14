# Plano de Implementação — Plataforma Syna (V1 Visual)

## Objetivo desta entrega

Construir a estrutura visual completa e os fluxos principais da plataforma Syna: layout com sidebar, navegação, dashboard inicial, demandas, planejamento, modo foco, clientes e processos — com dados de demonstração claramente identificados, sem backend real nesta etapa.

## Decisões técnicas

- **Stack**: TanStack Start (React 19 + TypeScript) + Tailwind CSS v4 — já configurado no projeto.
- **Backend**: nenhum nesta etapa. O documento pede Supabase externo administrado fora do Lovable; como a conexão ainda não existe, criarei uma **camada de dados simulados** (`src/lib/data/`) claramente identificada, com tipos e serviços separados dos componentes, pronta para ser trocada pelo Supabase depois. Nenhuma tabela de produção será criada.
- **Idioma da interface**: português (BR).
- **Fontes**: Cabinet Grotesk (títulos) e Switzer (texto) — arquivos enviados, servidos localmente via `@font-face`.
- **Marca**: logo e ícone Syna enviados; o ícone vira o favicon.

## Design system

Tema escuro único (sem toggle claro/escuro), baseado na paleta do briefing:

- Background principal `#0B0D12`, secundário `#12151C`, superfícies `#191D26`, bordas `#292E39`
- Texto principal `#F4F5F7`, secundário `#969CAA`
- Destaque `#8B7CF6` (usado com moderação)
- Tokens semânticos em `src/styles.css` (oklch), ícones Lucide, cantos arredondados discretos, sem gradientes exagerados nem glassmorphism

## Estrutura de rotas (páginas)

```text
/                    Início (dashboard pessoal)
/demandas            Minhas demandas (lista + filtros + painel lateral de detalhes)
/planejamento        Visão Hoje / Semana + tarefas não planejadas
/foco                Modo Foco (tarefa em destaque, cronômetro, "onde parei?")
/ideias              Captura e organização de ideias
/syna                Dashboard da agência
/syna/clientes       Lista de clientes + página do cliente (/syna/clientes/$id)
/syna/demandas       Demandas da agência
/syna/projetos       Projetos
/syna/processos      Biblioteca de processos + execução (/syna/processos/$id)
/syna/calendario     Calendário
/syna/equipe         Equipe
/configuracoes       Configurações
/perfil              Meu perfil
```

## Componentes reutilizáveis

`AppShell`, `Sidebar` (recolhível, estado persistido, busca global no topo), `Topbar`, `PageHeader`, `TaskCard`, `TaskList`, `TaskDetails` (painel lateral), `QuickCapture` (captura rápida global, só título obrigatório, "Mais opções" expansível, atalho de teclado), `SearchCommand` (CMD+K), `PriorityBadge`, `StatusBadge`, `ClientCard`, `ProcessCard`, `ProcessStep`, `EmptyState`, `ConfirmDialog`, `FocusSession` — todos com estados de loading, vazio, erro e sucesso.

## Funcionalidades da V1

1. **Início**: saudação contextual + data, 3 ações principais (Começar a trabalhar, Planejar meu dia, Registrar demanda), Minhas prioridades (até 3), Continuar de onde parei (com botão Retomar), Próximas entregas, Caixa de entrada.
2. **Minhas demandas**: lista com filtros (Todas, Caixa de entrada, Hoje, Próximas, Em andamento, Aguardando, Concluídas) e filtros por cliente/prioridade/prazo/contexto; checkbox de conclusão com feedback imediato e desfazer; painel lateral de detalhes (título editável, descrição, status, prioridade, prazo, cliente, checklist, comentários); criação rápida só com título.
3. **Planejamento**: visões Hoje e Semana, mover tarefas entre dias, área de não planejadas, botão "Reorganizar meu planejamento" (reorganização manual, sem IA).
4. **Modo Foco**: interface simplificada, tarefa em destaque, checklist, anotações rápidas, cronômetro opcional, ações Concluir/Pausar/Sair; ao pausar, registro "Onde parei?" que alimenta o "Continuar de onde parei".
5. **Clientes**: lista (nome, status, responsável, serviços, demandas pendentes, próxima entrega), botão "Novo cliente", página do cliente com abas (Visão geral, Demandas, Projetos, Processos, Histórico) e ação "Iniciar processo".
6. **Processos e Rotinas**: biblioteca de modelos (cards discretos), criador de processos com etapas ordenadas, visualização de execução com progresso e etapas concluídas/pendentes.
7. **Captura rápida global**: acessível de qualquer página, atalho de teclado, salva só com o título.

## Fora de escopo nesta etapa (identificados como "em breve")

- Autenticação e perfis de acesso (Administrador/Sócio/Colaborador)
- Conexão real com Supabase, RLS e permissões
- IA, automações, etapas condicionais, integrações (WhatsApp etc.)
- Anexos reais e notificações

## Ordem de execução

1. Design system em `src/styles.css` + fontes + favicon/logo
2. Camada de dados simulados (tipos, serviços, dados demo marcados)
3. AppShell + Sidebar + Topbar + QuickCapture + SearchCommand
4. Páginas na ordem: Início → Demandas → Planejamento → Foco → Ideias → Clientes → Processos → demais páginas Syna → Configurações/Perfil
5. Metadados de head por página, verificação de build e teste visual no navegador
