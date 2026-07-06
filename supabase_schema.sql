-- ##################################################################################
-- SUPABASE SCHEMA FOR PROPPOST
-- Run this in the Supabase SQL Editor for the target project.
-- Supabase Auth is the identity provider and Supabase Postgres is the only app DB.
-- ##################################################################################

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing public policies for tables managed by this schema.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'agencies',
        'agents',
        'properties',
        'amenities',
        'property_amenities',
        'scheduled_posts',
        'schedules',
        'branding',
        'leads',
        'invites'
      ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Core profile tables
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  agency_name text,
  trading_name text,
  email text,
  office_number text,
  province text,
  city text,
  address text,
  website_url text,
  agent_count_range text,
  join_code text UNIQUE,
  plan text DEFAULT 'free',
  plan_agent_limit integer DEFAULT 3,
  plan_post_limit integer DEFAULT 5,
  plan_platform_limit integer DEFAULT 2,
  trial_ends_at timestamptz
);

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  full_name text,
  email text,
  cellphone text,
  whatsapp_number text,
  job_title text,
  ppra_number text,
  bio text,
  specialisation text,
  areas text[] DEFAULT '{}',
  instagram_url text,
  agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL,
  status text DEFAULT 'pending'
);

-- Property and marketing tables
CREATE TABLE IF NOT EXISTS properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  title text,
  price numeric DEFAULT 0,
  city text,
  area text,
  province text,
  beds integer DEFAULT 0,
  baths integer DEFAULT 0,
  parking integer DEFAULT 0,
  size numeric DEFAULT 0,
  listing_type text DEFAULT 'sale',
  description text,
  image_url text,
  images text[] DEFAULT '{}',
  image_urls text[] DEFAULT '{}',
  status text DEFAULT 'Active',
  featured boolean DEFAULT false,
  created_by_id uuid,
  created_by_role text,
  agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS amenities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_amenities (
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id uuid REFERENCES amenities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL,
  property_title text,
  agent_name text,
  platform text,
  platforms text[] DEFAULT '{}',
  caption text,
  image_url text,
  scheduled_at timestamptz DEFAULT now(),
  status text DEFAULT 'scheduled',
  template_format text,
  template_design text,
  style_overrides jsonb DEFAULT '{}'
);

-- Backward-compatible view for older references that used "schedules".
DROP VIEW IF EXISTS schedules;
CREATE VIEW schedules AS SELECT * FROM scheduled_posts;

CREATE TABLE IF NOT EXISTS branding (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE,
  company_name text,
  primary_color text,
  secondary_color text
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  contact_name text,
  contact_email text,
  contact_phone text,
  status text DEFAULT 'New',
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL,
  source text,
  notes jsonb DEFAULT '[]',
  tasks jsonb DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  invitee_email text,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

-- Existing projects may have older tables missing newer columns.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_by_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_role text,
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS agent_id uuid;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS notes jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tasks jsonb DEFAULT '[]';

ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS style_overrides jsonb DEFAULT '{}';

-- Auth profile triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  role_name text;
  agency_uuid uuid;
BEGIN
  role_name := new.raw_user_meta_data->>'role';

  IF role_name = 'agency' THEN
    INSERT INTO public.agencies (
      id, agency_name, trading_name, email, office_number, province, city,
      address, website_url, agent_count_range, join_code, plan,
      plan_agent_limit, plan_post_limit, plan_platform_limit, trial_ends_at
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'agencyName', new.raw_user_meta_data->>'agency_name', 'New Agency'),
      new.raw_user_meta_data->>'trading_name',
      new.email,
      new.raw_user_meta_data->>'office_number',
      new.raw_user_meta_data->>'province',
      new.raw_user_meta_data->>'city',
      new.raw_user_meta_data->>'address',
      COALESCE(new.raw_user_meta_data->>'website', new.raw_user_meta_data->>'website_url'),
      new.raw_user_meta_data->>'agent_count',
      COALESCE(new.raw_user_meta_data->>'joinCode', new.raw_user_meta_data->>'join_code', upper(substring(gen_random_uuid()::text from 1 for 8))),
      COALESCE(new.raw_user_meta_data->>'plan', 'free'),
      COALESCE(NULLIF(new.raw_user_meta_data->>'plan_agent_limit', '')::integer, 3),
      COALESCE(NULLIF(new.raw_user_meta_data->>'plan_post_limit', '')::integer, 5),
      COALESCE(NULLIF(new.raw_user_meta_data->>'plan_platform_limit', '')::integer, 2),
      NULLIF(new.raw_user_meta_data->>'trial_ends_at', '')::timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      agency_name = COALESCE(EXCLUDED.agency_name, agencies.agency_name),
      trading_name = COALESCE(EXCLUDED.trading_name, agencies.trading_name),
      email = COALESCE(EXCLUDED.email, agencies.email),
      office_number = COALESCE(EXCLUDED.office_number, agencies.office_number),
      province = COALESCE(EXCLUDED.province, agencies.province),
      city = COALESCE(EXCLUDED.city, agencies.city),
      address = COALESCE(EXCLUDED.address, agencies.address),
      website_url = COALESCE(EXCLUDED.website_url, agencies.website_url),
      agent_count_range = COALESCE(EXCLUDED.agent_count_range, agencies.agent_count_range),
      plan = COALESCE(EXCLUDED.plan, agencies.plan),
      plan_agent_limit = COALESCE(EXCLUDED.plan_agent_limit, agencies.plan_agent_limit),
      plan_post_limit = COALESCE(EXCLUDED.plan_post_limit, agencies.plan_post_limit),
      plan_platform_limit = COALESCE(EXCLUDED.plan_platform_limit, agencies.plan_platform_limit),
      trial_ends_at = COALESCE(EXCLUDED.trial_ends_at, agencies.trial_ends_at);

  ELSIF role_name = 'agent' THEN
    BEGIN
      agency_uuid := NULLIF(COALESCE(new.raw_user_meta_data->>'agency_id', new.raw_user_meta_data->>'agencyId'), '')::uuid;
    EXCEPTION WHEN others THEN
      agency_uuid := NULL;
    END;

    INSERT INTO public.agents (
      id, full_name, email, cellphone, whatsapp_number, job_title, ppra_number,
      bio, specialisation, areas, instagram_url, agency_id, status
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New Agent'),
      new.email,
      new.raw_user_meta_data->>'cellphone',
      COALESCE(new.raw_user_meta_data->>'whatsapp_number', new.raw_user_meta_data->>'whatsappNumber'),
      COALESCE(new.raw_user_meta_data->>'job_title', new.raw_user_meta_data->>'jobTitle'),
      COALESCE(new.raw_user_meta_data->>'ppra_number', new.raw_user_meta_data->>'ppraNumber'),
      new.raw_user_meta_data->>'bio',
      new.raw_user_meta_data->>'specialisation',
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(new.raw_user_meta_data->'areas')), '{}'),
      COALESCE(new.raw_user_meta_data->>'instagram_url', new.raw_user_meta_data->>'instagramUrl'),
      agency_uuid,
      COALESCE(new.raw_user_meta_data->>'status', 'active')
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, agents.full_name),
      email = COALESCE(EXCLUDED.email, agents.email),
      cellphone = COALESCE(EXCLUDED.cellphone, agents.cellphone),
      whatsapp_number = COALESCE(EXCLUDED.whatsapp_number, agents.whatsapp_number),
      job_title = COALESCE(EXCLUDED.job_title, agents.job_title),
      ppra_number = COALESCE(EXCLUDED.ppra_number, agents.ppra_number),
      bio = COALESCE(EXCLUDED.bio, agents.bio),
      specialisation = COALESCE(EXCLUDED.specialisation, agents.specialisation),
      areas = COALESCE(EXCLUDED.areas, agents.areas),
      instagram_url = COALESCE(EXCLUDED.instagram_url, agents.instagram_url),
      agency_id = COALESCE(EXCLUDED.agency_id, agents.agency_id),
      status = COALESCE(EXCLUDED.status, agents.status);
  END IF;

  RETURN new;
EXCEPTION WHEN others THEN
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (new.email_confirmed_at IS NOT NULL AND old.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- RLS helper functions. SECURITY DEFINER prevents recursive RLS checks when
-- a policy needs to inspect the current user's agency membership.
CREATE OR REPLACE FUNCTION public.current_user_agency_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id FROM public.agencies WHERE id = auth.uid()),
    (SELECT agency_id FROM public.agents WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_agency_owner(target_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND target_agency_id IS NOT NULL AND auth.uid() = target_agency_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_agency(target_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND target_agency_id IS NOT NULL
    AND public.current_user_agency_id() = target_agency_id;
$$;

CREATE OR REPLACE FUNCTION public.can_access_property(target_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = target_property_id
      AND (
        public.can_access_agency(p.agency_id)
        OR p.agent_id = auth.uid()
        OR p.created_by_id = auth.uid()
      )
  );
$$;

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Agencies
CREATE POLICY "agencies_select_self_or_member" ON agencies
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.can_access_agency(id));

CREATE POLICY "agencies_public_join_lookup" ON agencies
  FOR SELECT TO anon
  USING (join_code IS NOT NULL);

CREATE POLICY "agencies_insert_own" ON agencies
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "agencies_update_own" ON agencies
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Agents
CREATE POLICY "agents_select_same_agency_or_self" ON agents
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.can_access_agency(agency_id));

CREATE POLICY "agents_insert_own" ON agents
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "agents_update_self_or_agency_owner" ON agents
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_agency_owner(agency_id))
  WITH CHECK (id = auth.uid() OR public.is_agency_owner(agency_id));

-- Properties
CREATE POLICY "properties_select_owned_scope" ON properties
  FOR SELECT TO authenticated
  USING (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR created_by_id = auth.uid()
  );

CREATE POLICY "properties_insert_owned_scope" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (
    COALESCE(agent_id, auth.uid()) = auth.uid()
    AND COALESCE(created_by_id, auth.uid()) = auth.uid()
    AND (
      agency_id IS NULL
      OR public.can_access_agency(agency_id)
      OR public.is_agency_owner(agency_id)
    )
  );

CREATE POLICY "properties_update_owned_scope" ON properties
  FOR UPDATE TO authenticated
  USING (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR created_by_id = auth.uid()
  )
  WITH CHECK (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR created_by_id = auth.uid()
  );

CREATE POLICY "properties_delete_owner_scope" ON properties
  FOR DELETE TO authenticated
  USING (public.is_agency_owner(agency_id) OR created_by_id = auth.uid());

-- Amenities are shared reference data. Authenticated users can seed missing
-- defaults from the UI; reads are public so listing forms can render.
CREATE POLICY "amenities_public_read" ON amenities
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "amenities_authenticated_insert" ON amenities
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Property amenities inherit property access.
CREATE POLICY "property_amenities_select_property_scope" ON property_amenities
  FOR SELECT TO authenticated
  USING (public.can_access_property(property_id));

CREATE POLICY "property_amenities_insert_property_scope" ON property_amenities
  FOR INSERT TO authenticated
  WITH CHECK (public.can_access_property(property_id));

CREATE POLICY "property_amenities_delete_property_scope" ON property_amenities
  FOR DELETE TO authenticated
  USING (public.can_access_property(property_id));

-- Scheduled posts
CREATE POLICY "scheduled_posts_select_owned_scope" ON scheduled_posts
  FOR SELECT TO authenticated
  USING (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR public.can_access_property(property_id)
  );

CREATE POLICY "scheduled_posts_insert_owned_scope" ON scheduled_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    COALESCE(agent_id, auth.uid()) = auth.uid()
    AND (
      agency_id IS NULL
      OR public.can_access_agency(agency_id)
      OR public.is_agency_owner(agency_id)
    )
    AND (
      property_id IS NULL
      OR public.can_access_property(property_id)
    )
  );

CREATE POLICY "scheduled_posts_update_owned_scope" ON scheduled_posts
  FOR UPDATE TO authenticated
  USING (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR public.can_access_property(property_id)
  )
  WITH CHECK (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR public.can_access_property(property_id)
  );

CREATE POLICY "scheduled_posts_delete_owner_scope" ON scheduled_posts
  FOR DELETE TO authenticated
  USING (public.is_agency_owner(agency_id) OR agent_id = auth.uid());

-- Branding
CREATE POLICY "branding_select_agency_scope" ON branding
  FOR SELECT TO authenticated
  USING (public.can_access_agency(agency_id));

CREATE POLICY "branding_write_agency_owner" ON branding
  FOR ALL TO authenticated
  USING (public.is_agency_owner(agency_id))
  WITH CHECK (public.is_agency_owner(agency_id));

-- Leads. Public inserts support external lead capture forms, but reads and
-- updates are limited to the owning agency/agent/property scope.
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "leads_authenticated_insert_owned_scope" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (
    agent_id = auth.uid()
    OR public.can_access_agency(agency_id)
    OR public.can_access_property(property_id)
  );

CREATE POLICY "leads_select_owned_scope" ON leads
  FOR SELECT TO authenticated
  USING (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR public.can_access_property(property_id)
  );

CREATE POLICY "leads_update_owned_scope" ON leads
  FOR UPDATE TO authenticated
  USING (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR public.can_access_property(property_id)
  )
  WITH CHECK (
    public.can_access_agency(agency_id)
    OR agent_id = auth.uid()
    OR public.can_access_property(property_id)
  );

-- Invites. Agencies manage their own invites; anonymous users can validate a
-- token during signup; authenticated invitees can mark only their token used.
CREATE POLICY "invites_agency_manage" ON invites
  FOR ALL TO authenticated
  USING (public.is_agency_owner(agency_id))
  WITH CHECK (public.is_agency_owner(agency_id));

CREATE POLICY "invites_public_token_read" ON invites
  FOR SELECT TO anon
  USING (used_at IS NULL AND expires_at > now());

CREATE POLICY "invites_invitee_mark_used" ON invites
  FOR UPDATE TO authenticated
  USING (used_at IS NULL AND expires_at > now())
  WITH CHECK (used_at IS NOT NULL);
