-- Migration 0007: is_admin() helper + role-lock trigger + admin policy rebuild
-- Applied directly via Supabase Management API on 2026-06-27.
-- Run in: https://supabase.com/dashboard/project/rhunwsldjqyvtksyzvvy/sql/new

-- ─────────────────────────────────────────────────────────────────
-- 1. Role-lock: tighten profiles UPDATE WITH CHECK to prevent
--    a user from self-promoting their own role column.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ─────────────────────────────────────────────────────────────────
-- 2. Trigger function — belt-and-suspenders: raises an exception
--    if anything tries to change the role column at the DB level.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Profile role cannot be changed via direct UPDATE.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_profile_role ON public.profiles;
CREATE TRIGGER lock_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- ─────────────────────────────────────────────────────────────────
-- 3. is_admin() SECURITY DEFINER helper — breaks RLS recursion.
--    Admin policies previously used inline subqueries on profiles,
--    which could recurse because profiles itself has RLS.
--    This function runs as definer (bypasses RLS on profiles),
--    eliminating the recursion and improving query planning.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path TO public AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- ─────────────────────────────────────────────────────────────────
-- 4. Rebuild all admin policies to use is_admin()
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins full access to events" ON public.events;
CREATE POLICY "Admins full access to events" ON public.events FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to event products" ON public.event_products;
CREATE POLICY "Admins full access to event products" ON public.event_products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to products" ON public.products;
CREATE POLICY "Admins full access to products" ON public.products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to orders" ON public.orders;
CREATE POLICY "Admins full access to orders" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to order items" ON public.order_items;
CREATE POLICY "Admins full access to order items" ON public.order_items FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update settings" ON public.site_settings;
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (public.is_admin());
