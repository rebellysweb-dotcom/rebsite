-- Migration 0006: Fix all 7 Supabase security linter warnings
-- Run in: https://supabase.com/dashboard/project/rhunwsldjqyvtksyzvvy/sql/new

-- ─────────────────────────────────────────────────────────────────
-- 1. Fix mutable search_path on handle_new_user (prevents search_path hijacking)
-- ─────────────────────────────────────────────────────────────────
ALTER FUNCTION public.handle_new_user() SET search_path TO public;

-- ─────────────────────────────────────────────────────────────────
-- 2. Revoke public EXECUTE from both SECURITY DEFINER functions
--    They are trigger-only / internal — no role should call them via REST.
-- ─────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()  FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────
-- 3. Tighten orders INSERT — drop the permissive "always true" policy.
--    Our API route now uses the service role key for all inserts,
--    which bypasses RLS entirely. No anon/authenticated INSERT needed.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- ─────────────────────────────────────────────────────────────────
-- 4. Tighten order_items INSERT — same reasoning as orders above.
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
