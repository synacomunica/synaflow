CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  initials text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, name, initials, created_at, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (name, initials, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'partner', 'collaborator')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_user_org_key UNIQUE (user_id, organization_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  start_date date,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  owner_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('active', 'onboarding', 'paused', 'ended')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'done', 'paused')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('process', 'routine')),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Geral',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  recurrence_label text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.process_templates TO authenticated;
GRANT ALL ON public.process_templates TO service_role;
ALTER TABLE public.process_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.process_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  template_id uuid NOT NULL REFERENCES public.process_templates(id) ON DELETE RESTRICT,
  template_name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  cancelled boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.process_executions TO authenticated;
GRANT ALL ON public.process_executions TO service_role;
ALTER TABLE public.process_executions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('inbox', 'todo', 'in_progress', 'waiting', 'done')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  context text NOT NULL CHECK (context IN ('personal', 'work')),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  client_id uuid REFERENCES public.clients(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES public.projects(id) ON DELETE RESTRICT,
  process_execution_id uuid REFERENCES public.process_executions(id) ON DELETE RESTRICT,
  process_step_id text,
  parent_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  due_date date,
  scheduled_date date,
  scheduled_order integer,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  activity jsonb NOT NULL DEFAULT '[]'::jsonb,
  resume_note text,
  last_worked_at timestamptz,
  CONSTRAINT tasks_context_boundary CHECK (
    (context = 'personal' AND owner_id IS NOT NULL AND organization_id IS NULL)
    OR (context = 'work' AND organization_id IS NOT NULL AND owner_id IS NULL)
  )
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE INDEX memberships_user_idx ON public.memberships(user_id);
CREATE INDEX memberships_org_idx ON public.memberships(organization_id);
CREATE INDEX clients_org_idx ON public.clients(organization_id);
CREATE INDEX projects_org_idx ON public.projects(organization_id);
CREATE INDEX process_executions_org_idx ON public.process_executions(organization_id);
CREATE INDEX tasks_org_status_idx ON public.tasks(organization_id, status);
CREATE INDEX tasks_owner_context_idx ON public.tasks(owner_id, context);
CREATE INDEX tasks_assignee_idx ON public.tasks(assignee_id);
CREATE INDEX tasks_scheduled_idx ON public.tasks(scheduled_date, scheduled_order);
CREATE INDEX tasks_execution_idx ON public.tasks(process_execution_id);
CREATE INDEX tasks_client_idx ON public.tasks(client_id);

CREATE FUNCTION public.auth_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.auth_user_org_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auth_user_org_ids() TO authenticated;

CREATE FUNCTION public.auth_user_role(p_org_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.memberships
  WHERE user_id = auth.uid() AND organization_id = p_org_id
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.auth_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auth_user_role(uuid) TO authenticated;

CREATE FUNCTION public.auth_can_view_profile(p_target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_target_id = auth.uid() OR EXISTS (
    SELECT 1
    FROM public.memberships self_membership
    JOIN public.memberships target_membership
      ON target_membership.organization_id = self_membership.organization_id
    WHERE self_membership.user_id = auth.uid()
      AND target_membership.user_id = p_target_id
  );
$$;
REVOKE ALL ON FUNCTION public.auth_can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auth_can_view_profile(uuid) TO authenticated;

CREATE FUNCTION public.fn_get_my_profile()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  initials text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, p.name, p.email, p.initials, p.created_at, p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.fn_get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_get_my_profile() TO authenticated;

CREATE POLICY profiles_select_scoped ON public.profiles
FOR SELECT TO authenticated
USING (public.auth_can_view_profile(id));
CREATE POLICY profiles_update_self ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY organizations_select ON public.organizations
FOR SELECT TO authenticated
USING (id IN (SELECT public.auth_user_org_ids()));
CREATE POLICY organizations_update ON public.organizations
FOR UPDATE TO authenticated
USING (public.auth_user_role(id) IN ('admin', 'partner'))
WITH CHECK (public.auth_user_role(id) IN ('admin', 'partner'));

CREATE POLICY memberships_select ON public.memberships
FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.auth_user_org_ids()));
CREATE POLICY memberships_admin_insert ON public.memberships
FOR INSERT TO authenticated
WITH CHECK (public.auth_user_role(organization_id) = 'admin');
CREATE POLICY memberships_admin_update ON public.memberships
FOR UPDATE TO authenticated
USING (public.auth_user_role(organization_id) = 'admin')
WITH CHECK (public.auth_user_role(organization_id) = 'admin');
CREATE POLICY memberships_admin_delete ON public.memberships
FOR DELETE TO authenticated
USING (public.auth_user_role(organization_id) = 'admin');

CREATE POLICY clients_select ON public.clients
FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.auth_user_org_ids()));
CREATE POLICY clients_insert ON public.clients
FOR INSERT TO authenticated
WITH CHECK (public.auth_user_role(organization_id) IN ('admin', 'partner'));
CREATE POLICY clients_update ON public.clients
FOR UPDATE TO authenticated
USING (public.auth_user_role(organization_id) IN ('admin', 'partner'))
WITH CHECK (public.auth_user_role(organization_id) IN ('admin', 'partner'));

CREATE POLICY projects_select ON public.projects
FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.auth_user_org_ids()));
CREATE POLICY projects_insert ON public.projects
FOR INSERT TO authenticated
WITH CHECK (public.auth_user_role(organization_id) IN ('admin', 'partner'));
CREATE POLICY projects_update ON public.projects
FOR UPDATE TO authenticated
USING (public.auth_user_role(organization_id) IN ('admin', 'partner'))
WITH CHECK (public.auth_user_role(organization_id) IN ('admin', 'partner'));
CREATE POLICY projects_delete ON public.projects
FOR DELETE TO authenticated
USING (public.auth_user_role(organization_id) = 'admin');

CREATE POLICY process_templates_select ON public.process_templates
FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.auth_user_org_ids()));
CREATE POLICY process_templates_insert ON public.process_templates
FOR INSERT TO authenticated
WITH CHECK (public.auth_user_role(organization_id) IN ('admin', 'partner'));
CREATE POLICY process_templates_update ON public.process_templates
FOR UPDATE TO authenticated
USING (public.auth_user_role(organization_id) IN ('admin', 'partner'))
WITH CHECK (public.auth_user_role(organization_id) IN ('admin', 'partner'));
CREATE POLICY process_templates_delete ON public.process_templates
FOR DELETE TO authenticated
USING (public.auth_user_role(organization_id) = 'admin');

CREATE POLICY process_executions_select ON public.process_executions
FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.auth_user_org_ids()));

CREATE POLICY tasks_select ON public.tasks
FOR SELECT TO authenticated
USING (
  (context = 'personal' AND owner_id = auth.uid())
  OR (context = 'work' AND organization_id IN (SELECT public.auth_user_org_ids()))
);
CREATE POLICY tasks_insert ON public.tasks
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    (context = 'personal' AND owner_id = auth.uid())
    OR (context = 'work' AND organization_id IN (SELECT public.auth_user_org_ids()))
  )
);
CREATE POLICY tasks_update ON public.tasks
FOR UPDATE TO authenticated
USING (
  (context = 'personal' AND owner_id = auth.uid())
  OR (
    context = 'work'
    AND organization_id IN (SELECT public.auth_user_org_ids())
    AND (
      public.auth_user_role(organization_id) IN ('admin', 'partner')
      OR assignee_id = auth.uid()
      OR created_by = auth.uid()
    )
  )
)
WITH CHECK (
  (context = 'personal' AND owner_id = auth.uid())
  OR (
    context = 'work'
    AND organization_id IN (SELECT public.auth_user_org_ids())
    AND (
      public.auth_user_role(organization_id) IN ('admin', 'partner')
      OR assignee_id = auth.uid()
      OR created_by = auth.uid()
    )
  )
);
CREATE POLICY tasks_delete ON public.tasks
FOR DELETE TO authenticated
USING (
  (context = 'personal' AND owner_id = auth.uid())
  OR (context = 'work' AND public.auth_user_role(organization_id) IN ('admin', 'partner'))
  OR (context = 'work' AND created_by = auth.uid() AND status = 'inbox')
);

CREATE POLICY ideas_owner_select ON public.ideas
FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY ideas_owner_insert ON public.ideas
FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY ideas_owner_update ON public.ideas
FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ideas_owner_delete ON public.ideas
FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE FUNCTION public.fn_tasks_validate_tenant_coherence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_org uuid;
BEGIN
  IF NEW.context = 'work' THEN
    IF NEW.client_id IS NOT NULL THEN
      SELECT organization_id INTO v_target_org FROM public.clients WHERE id = NEW.client_id;
      IF v_target_org IS NULL OR v_target_org IS DISTINCT FROM NEW.organization_id THEN
        RAISE EXCEPTION 'O cliente não pertence à organização da demanda.';
      END IF;
    END IF;
    IF NEW.project_id IS NOT NULL THEN
      SELECT organization_id INTO v_target_org FROM public.projects WHERE id = NEW.project_id;
      IF v_target_org IS NULL OR v_target_org IS DISTINCT FROM NEW.organization_id THEN
        RAISE EXCEPTION 'O projeto não pertence à organização da demanda.';
      END IF;
    END IF;
    IF NEW.process_execution_id IS NOT NULL THEN
      SELECT organization_id INTO v_target_org FROM public.process_executions WHERE id = NEW.process_execution_id;
      IF v_target_org IS NULL OR v_target_org IS DISTINCT FROM NEW.organization_id THEN
        RAISE EXCEPTION 'A execução não pertence à organização da demanda.';
      END IF;
    END IF;
    IF NEW.assignee_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.memberships
      WHERE user_id = NEW.assignee_id AND organization_id = NEW.organization_id
    ) THEN
      RAISE EXCEPTION 'O responsável não é membro da organização.';
    END IF;
  ELSIF NEW.client_id IS NOT NULL OR NEW.project_id IS NOT NULL
     OR NEW.process_execution_id IS NOT NULL OR NEW.assignee_id IS NOT NULL THEN
    RAISE EXCEPTION 'Demandas pessoais não podem ter vínculos corporativos.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_tasks_validate_tenant_coherence() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER tasks_validate_tenant_coherence
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.fn_tasks_validate_tenant_coherence();

CREATE FUNCTION public.fn_projects_validate_tenant_coherence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_client_org uuid;
BEGIN
  IF NEW.client_id IS NOT NULL THEN
    SELECT organization_id INTO v_client_org FROM public.clients WHERE id = NEW.client_id;
    IF v_client_org IS NULL OR v_client_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'O cliente não pertence à organização do projeto.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_projects_validate_tenant_coherence() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER projects_validate_tenant_coherence
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.fn_projects_validate_tenant_coherence();

CREATE FUNCTION public.fn_process_executions_validate_tenant_coherence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_template_org uuid;
  v_client_org uuid;
BEGIN
  SELECT organization_id INTO v_template_org
  FROM public.process_templates WHERE id = NEW.template_id;
  IF v_template_org IS NULL OR v_template_org IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'O modelo não pertence à organização da execução.';
  END IF;
  IF NEW.client_id IS NOT NULL THEN
    SELECT organization_id INTO v_client_org FROM public.clients WHERE id = NEW.client_id;
    IF v_client_org IS NULL OR v_client_org IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'O cliente não pertence à organização da execução.';
    END IF;
  END IF;
  IF NEW.assignee_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = NEW.assignee_id AND organization_id = NEW.organization_id
  ) THEN
    RAISE EXCEPTION 'O responsável não é membro da organização.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_process_executions_validate_tenant_coherence() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER process_executions_validate_tenant_coherence
BEFORE INSERT OR UPDATE ON public.process_executions
FOR EACH ROW EXECUTE FUNCTION public.fn_process_executions_validate_tenant_coherence();

CREATE FUNCTION public.fn_tasks_enforce_mutation_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
BEGIN
  IF OLD.context = 'personal' THEN
    IF NEW.context IS DISTINCT FROM OLD.context OR NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
      RAISE EXCEPTION 'Não é permitido alterar o contexto ou o proprietário de uma demanda pessoal.';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.context IS DISTINCT FROM OLD.context
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Contexto, organização e criador são imutáveis.';
  END IF;

  v_role := public.auth_user_role(OLD.organization_id);
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: associação inválida.';
  END IF;

  IF v_role = 'collaborator' AND (
    NEW.title IS DISTINCT FROM OLD.title
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.priority IS DISTINCT FROM OLD.priority
    OR NEW.due_date IS DISTINCT FROM OLD.due_date
    OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id
    OR NEW.client_id IS DISTINCT FROM OLD.client_id
    OR NEW.project_id IS DISTINCT FROM OLD.project_id
    OR NEW.process_execution_id IS DISTINCT FROM OLD.process_execution_id
    OR NEW.process_step_id IS DISTINCT FROM OLD.process_step_id
    OR NEW.parent_task_id IS DISTINCT FROM OLD.parent_task_id
  ) THEN
    RAISE EXCEPTION 'Colaboradores só podem atualizar o andamento da demanda.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_tasks_enforce_mutation_rules() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER tasks_enforce_mutation_rules
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.fn_tasks_enforce_mutation_rules();

CREATE FUNCTION public.fn_start_process(
  p_template_id uuid,
  p_client_id uuid DEFAULT NULL,
  p_assignee_id uuid DEFAULT NULL,
  p_start_date date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_template record;
  v_execution_id uuid;
  v_caller_id uuid := auth.uid();
  v_caller_role text;
  v_step jsonb;
  v_step_id text;
  v_step_title text;
  v_step_description text;
  v_step_instructions text;
  v_step_due_days integer;
  v_step_checklist jsonb;
  v_suggested_assignee uuid;
  v_task_assignee uuid;
  v_steps_snapshot jsonb := '[]'::jsonb;
BEGIN
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;

  SELECT * INTO v_template FROM public.process_templates WHERE id = p_template_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Modelo de processo não encontrado.'; END IF;

  v_caller_role := public.auth_user_role(v_template.organization_id);
  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: associação inválida.';
  END IF;

  IF p_client_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = p_client_id AND organization_id = v_template.organization_id
  ) THEN
    RAISE EXCEPTION 'O cliente não pertence à organização.';
  END IF;

  IF p_assignee_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = p_assignee_id AND organization_id = v_template.organization_id
  ) THEN
    RAISE EXCEPTION 'O responsável não é membro da organização.';
  END IF;

  FOR v_step IN SELECT value FROM jsonb_array_elements(v_template.steps)
  LOOP
    v_steps_snapshot := v_steps_snapshot || jsonb_build_array(jsonb_build_object(
      'stepId', v_step->>'id',
      'order', COALESCE((v_step->>'order')::integer, 0),
      'title', v_step->>'title',
      'description', v_step->>'description',
      'instructions', v_step->>'instructions',
      'relativeDueDays', COALESCE((v_step->>'relativeDueDays')::integer, 0)
    ));
  END LOOP;

  INSERT INTO public.process_executions (
    organization_id, template_id, template_name, client_id,
    assignee_id, start_date, steps
  ) VALUES (
    v_template.organization_id, v_template.id, v_template.name, p_client_id,
    p_assignee_id, p_start_date, v_steps_snapshot
  ) RETURNING id INTO v_execution_id;

  FOR v_step IN SELECT value FROM jsonb_array_elements(v_template.steps)
  LOOP
    v_step_id := v_step->>'id';
    v_step_title := v_step->>'title';
    IF v_step_id IS NULL OR v_step_title IS NULL OR btrim(v_step_title) = '' THEN
      RAISE EXCEPTION 'Etapa inválida no modelo de processo.';
    END IF;
    v_step_description := v_step->>'description';
    v_step_instructions := v_step->>'instructions';
    v_step_due_days := COALESCE((v_step->>'relativeDueDays')::integer, 0);
    v_suggested_assignee := NULL;

    IF NULLIF(v_step->>'suggestedAssigneeId', '') IS NOT NULL THEN
      BEGIN
        v_suggested_assignee := (v_step->>'suggestedAssigneeId')::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        v_suggested_assignee := NULL;
      END;
      IF v_suggested_assignee IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.memberships
        WHERE user_id = v_suggested_assignee
          AND organization_id = v_template.organization_id
      ) THEN
        v_suggested_assignee := NULL;
      END IF;
    END IF;

    v_task_assignee := COALESCE(v_suggested_assignee, p_assignee_id, v_caller_id);
    v_step_checklist := '[]'::jsonb;
    IF jsonb_typeof(v_step->'checklist') = 'array' THEN
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', gen_random_uuid()::text,
        'text', checklist_item.value #>> '{}',
        'done', false
      )), '[]'::jsonb)
      INTO v_step_checklist
      FROM jsonb_array_elements(v_step->'checklist') AS checklist_item;
    END IF;

    INSERT INTO public.tasks (
      title, description, status, priority, context, organization_id,
      client_id, process_execution_id, process_step_id, assignee_id,
      created_by, due_date, scheduled_date, checklist, activity
    ) VALUES (
      v_step_title, COALESCE(v_step_instructions, v_step_description),
      'todo', 'medium', 'work', v_template.organization_id,
      p_client_id, v_execution_id, v_step_id, v_task_assignee,
      v_caller_id, p_start_date + v_step_due_days, p_start_date,
      v_step_checklist,
      jsonb_build_array(jsonb_build_object(
        'id', gen_random_uuid()::text,
        'actorId', v_caller_id::text,
        'message', 'Demanda gerada a partir do processo "' || v_template.name || '"',
        'createdAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ))
    );
  END LOOP;

  RETURN v_execution_id;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_start_process(uuid, uuid, uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_start_process(uuid, uuid, uuid, date) TO authenticated;

CREATE FUNCTION public.fn_cancel_process_execution(
  p_execution_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_execution record;
  v_caller_id uuid := auth.uid();
  v_caller_role text;
BEGIN
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;

  SELECT * INTO v_execution
  FROM public.process_executions
  WHERE id = p_execution_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Execução não encontrada.'; END IF;
  IF v_execution.cancelled THEN RAISE EXCEPTION 'A execução já está cancelada.'; END IF;

  SELECT role INTO v_caller_role
  FROM public.memberships
  WHERE user_id = v_caller_id
    AND organization_id = v_execution.organization_id;

  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'partner') THEN
    RAISE EXCEPTION 'Apenas administradores ou sócios podem cancelar uma execução.';
  END IF;

  UPDATE public.process_executions
  SET cancelled = true,
      cancelled_at = now(),
      cancelled_by = v_caller_id,
      cancellation_reason = NULLIF(btrim(p_reason), '')
  WHERE id = p_execution_id;

  UPDATE public.tasks
  SET status = 'waiting',
      updated_at = now(),
      activity = activity || jsonb_build_array(jsonb_build_object(
        'id', gen_random_uuid()::text,
        'actorId', v_caller_id::text,
        'message', 'Execução cancelada. Motivo: ' || COALESCE(NULLIF(btrim(p_reason), ''), 'Não especificado'),
        'createdAt', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ))
  WHERE process_execution_id = p_execution_id AND status <> 'done';

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_cancel_process_execution(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_cancel_process_execution(uuid, text) TO authenticated;

CREATE FUNCTION public.fn_idea_to_task(
  p_idea_id uuid,
  p_context text DEFAULT 'personal',
  p_organization_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idea record;
  v_task_id uuid;
  v_caller_id uuid := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Não autenticado.'; END IF;
  IF p_context NOT IN ('personal', 'work') THEN RAISE EXCEPTION 'Contexto inválido.'; END IF;

  SELECT * INTO v_idea FROM public.ideas
  WHERE id = p_idea_id AND owner_id = v_caller_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ideia não encontrada.'; END IF;

  IF p_context = 'work' AND (
    p_organization_id IS NULL OR public.auth_user_role(p_organization_id) IS NULL
  ) THEN
    RAISE EXCEPTION 'Organização inválida ou não autorizada.';
  END IF;

  INSERT INTO public.tasks (
    title, status, priority, context, owner_id, organization_id,
    created_by, assignee_id
  ) VALUES (
    v_idea.text, 'inbox', 'medium', p_context,
    CASE WHEN p_context = 'personal' THEN v_caller_id END,
    CASE WHEN p_context = 'work' THEN p_organization_id END,
    v_caller_id,
    CASE WHEN p_context = 'work' THEN v_caller_id END
  ) RETURNING id INTO v_task_id;

  DELETE FROM public.ideas WHERE id = p_idea_id;
  RETURN v_task_id;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_idea_to_task(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_idea_to_task(uuid, text, uuid) TO authenticated;

CREATE FUNCTION public.handle_syna_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_name text;
BEGIN
  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(COALESCE(NEW.email, NEW.id::text), '@', 1)
  );
  INSERT INTO public.profiles (id, name, email, initials)
  VALUES (
    NEW.id,
    v_name,
    COALESCE(NEW.email, ''),
    upper(substring(v_name FROM 1 FOR 2))
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE WHEN public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
      updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_syna_new_user() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND tgname = 'on_syna_auth_user_created'
  ) THEN
    RAISE EXCEPTION 'O trigger on_syna_auth_user_created já existe; revise-o manualmente antes de continuar.';
  END IF;

  CREATE TRIGGER on_syna_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_syna_new_user();
END;
$$;