-- ##################################################################################
-- SUPABASE SCHEMA FOR PROPPOST
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
-- ##################################################################################

-- 1. CLEANUP EXISITING POLICIES (Safety first)
DO $$ 
DECLARE 
    pol record;
BEGIN 
    -- Drop all policies on properties
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'properties' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON properties', pol.policyname); 
    END LOOP;
END $$;

-- 2. TABLES ENFORCEMENT
CREATE TABLE IF NOT EXISTS properties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

-- ENSURE ALL COLUMNS EXIST WITH CORRECT TYPES
ALTER TABLE properties 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS beds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS baths integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parking integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS size numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listing_type text DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_role text,
  ADD COLUMN IF NOT EXISTS agency_id uuid,
  ADD COLUMN IF NOT EXISTS agent_id uuid;

-- 3. RLS POLICIES FOR PROPERTIES
-- Ultra-permissive for troubleshooting to ensure we can actually use the app
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_authenticated_all" ON properties;
CREATE POLICY "properties_authenticated_all" ON properties
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "properties_public_read" ON properties;
CREATE POLICY "properties_public_read" ON properties
    FOR SELECT TO public
    USING (true);

-- 4. AGENTS & AGENCIES TABLES & POLICIES
CREATE TABLE IF NOT EXISTS agents (
    id uuid PRIMARY KEY, -- Maps to auth.users.id
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
    agency_id uuid,
    status text DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS agencies (
    id uuid PRIMARY KEY, -- Maps to auth.users.id
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

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Polices: Allow public read of profiles
DROP POLICY IF EXISTS "agents_public_read" ON agents;
CREATE POLICY "agents_public_read" ON agents FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "agencies_read" ON agencies;
CREATE POLICY "agencies_read" ON agencies FOR SELECT TO public USING (true);

-- Policies: Allow users to manage their own profiles
DROP POLICY IF EXISTS "agents_update_own" ON agents;
CREATE POLICY "agents_update_own" ON agents FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "agencies_update_own" ON agencies;
CREATE POLICY "agencies_update_own" ON agencies FOR UPDATE TO authenticated USING (auth.uid() = id);

-- INSERT policies (previously missing — without these, self-heal in the app
-- and any authenticated insert would be silently rejected by RLS)
DROP POLICY IF EXISTS "agents_insert_own" ON agents;
CREATE POLICY "agents_insert_own" ON agents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "agencies_insert_own" ON agencies;
CREATE POLICY "agencies_insert_own" ON agencies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ── Trigger: fires on new user signup (INSERT) ────────────────────────────────
-- Creates the profile row immediately so it exists before email confirmation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    role_name text;
    agency_id_text text;
    agency_uuid uuid;
BEGIN
  role_name := new.raw_user_meta_data->>'role';

  IF (role_name = 'agency') THEN
    BEGIN
      INSERT INTO public.agencies (id, agency_name, email, join_code, plan)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'agencyName', new.raw_user_meta_data->>'agency_name', 'New Agency'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'joinCode', new.raw_user_meta_data->>'join_code', upper(substring(gen_random_uuid()::text from 1 for 8))),
        COALESCE(new.raw_user_meta_data->>'plan', 'free')
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN others THEN
      RETURN new;
    END;

  ELSIF (role_name = 'agent') THEN
    agency_id_text := COALESCE(
      new.raw_user_meta_data->>'agency_id',
      new.raw_user_meta_data->>'agencyId'
    );
    IF (agency_id_text IS NOT NULL AND agency_id_text <> '' AND agency_id_text <> 'null') THEN
      BEGIN
        agency_uuid := agency_id_text::uuid;
      EXCEPTION WHEN others THEN
        agency_uuid := NULL;
      END;
    ELSE
      agency_uuid := NULL;
    END IF;

    BEGIN
      INSERT INTO public.agents (id, full_name, email, agency_id, status)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New Agent'),
        new.email,
        agency_uuid,
        COALESCE(new.raw_user_meta_data->>'status', 'active')
      )
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN others THEN
      RETURN new;
    END;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Trigger: fires on email confirmation (UPDATE) ─────────────────────────────
-- Safety-net: ensures the profile row exists when the user confirms their email,
-- in case the INSERT trigger missed it (e.g. metadata not yet propagated).
-- CRITICAL: the EXCEPTION block always returns new — this trigger must NEVER
-- block the email confirmation flow.
CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS trigger AS $$
DECLARE
  agency_id_text text;
  agency_uuid uuid;
BEGIN
  -- Only act when email_confirmed_at transitions from NULL → a value
  IF (new.email_confirmed_at IS NOT NULL AND old.email_confirmed_at IS NULL) THEN

    IF (new.raw_user_meta_data->>'role' = 'agent') THEN
      agency_id_text := COALESCE(
        new.raw_user_meta_data->>'agency_id',
        new.raw_user_meta_data->>'agencyId'
      );
      IF (agency_id_text IS NOT NULL AND agency_id_text <> '' AND agency_id_text <> 'null') THEN
        BEGIN
          agency_uuid := agency_id_text::uuid;
        EXCEPTION WHEN others THEN
          agency_uuid := NULL;
        END;
      ELSE
        agency_uuid := NULL;
      END IF;

      INSERT INTO public.agents (id, full_name, email, agency_id, status)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'fullName', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Agent'),
        new.email,
        agency_uuid,
        COALESCE(new.raw_user_meta_data->>'status', 'active')
      )
      ON CONFLICT (id) DO NOTHING;

    ELSIF (new.raw_user_meta_data->>'role' = 'agency') THEN
      INSERT INTO public.agencies (id, agency_name, email, join_code, plan)
      VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'agencyName', new.raw_user_meta_data->>'agency_name', 'New Agency'),
        new.email,
        COALESCE(
          new.raw_user_meta_data->>'joinCode',
          new.raw_user_meta_data->>'join_code',
          upper(substring(gen_random_uuid()::text from 1 for 8))
        ),
        COALESCE(new.raw_user_meta_data->>'plan', 'free')
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;

  END IF;

  RETURN new;
EXCEPTION WHEN others THEN
  -- Never block email confirmation regardless of what went wrong above
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmed();

-- 5. AMENITIES TABLE
CREATE TABLE IF NOT EXISTS amenities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text,
    icon text
);

ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "amenities_read" ON amenities;
CREATE POLICY "amenities_read" ON amenities FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "amenities_all_auth" ON amenities;
CREATE POLICY "amenities_all_auth" ON amenities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules 
  ADD COLUMN IF NOT EXISTS property_id uuid,
  ADD COLUMN IF NOT EXISTS agent_id uuid,
  ADD COLUMN IF NOT EXISTS property_title text,
  ADD COLUMN IF NOT EXISTS agent_name text,
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS template_format text,
  ADD COLUMN IF NOT EXISTS template_design text,
  ADD COLUMN IF NOT EXISTS style_overrides jsonb DEFAULT '{}';

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedules_authenticated_all" ON schedules;
CREATE POLICY "schedules_authenticated_all" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. BRANDING TABLE
CREATE TABLE IF NOT EXISTS branding (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid,
    company_name text,
    primary_color text,
    secondary_color text
);

ALTER TABLE branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branding_read" ON branding;
CREATE POLICY "branding_read" ON branding FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "branding_all_auth" ON branding;
CREATE POLICY "branding_all_auth" ON branding FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    contact_name text,
    contact_email text,
    contact_phone text,
    status text DEFAULT 'New',
    property_id uuid,
    agent_id uuid,
    source text
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_all_auth" ON leads;
CREATE POLICY "leads_all_auth" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "leads_public_insert" ON leads;
CREATE POLICY "leads_public_insert" ON leads FOR INSERT TO public WITH CHECK (true);
DROP POLICY IF EXISTS "leads_public_select" ON leads;
CREATE POLICY "leads_public_select" ON leads FOR SELECT TO public USING (true);

-- 9. INVITES TABLE
-- Used for agency → agent email invite flow.
-- token is a UUID generated by the agency dashboard and embedded in the invite link.
CREATE TABLE IF NOT EXISTS invites (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id   uuid NOT NULL,
    invitee_email text,
    token       text UNIQUE NOT NULL,
    created_at  timestamptz DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    used_at     timestamptz   -- NULL = pending, set when agent completes signup
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Agency can manage their own invites
DROP POLICY IF EXISTS "invites_agency_all" ON invites;
CREATE POLICY "invites_agency_all" ON invites
  FOR ALL TO authenticated
  USING  (auth.uid() = agency_id)
  WITH CHECK (auth.uid() = agency_id);

-- Anyone (including unauthenticated agents on the signup page) can look up a token
DROP POLICY IF EXISTS "invites_public_read_by_token" ON invites;
CREATE POLICY "invites_public_read_by_token" ON invites
  FOR SELECT TO public
  USING (true);

-- Authenticated agents can mark an invite as used
DROP POLICY IF EXISTS "invites_agent_mark_used" ON invites;
CREATE POLICY "invites_agent_mark_used" ON invites
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
