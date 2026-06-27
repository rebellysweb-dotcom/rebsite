# Fix C-2: RLS Role Lock Migration

## Security Issue
CVSS 9.9 — Any authenticated user could previously self-promote to admin by executing:
```sql
UPDATE profiles SET role='admin' WHERE id = auth.uid();
```

## Solution
Migration `0005_rls_role_lock.sql` implements two layered defenses:

1. **RLS Policy Update** — Modified "Users can update own profile" policy adds a `WITH CHECK` constraint that verifies the new role matches the current role from the database (preventing any role change).

2. **Trigger Guard** — Added `prevent_role_change()` trigger on the profiles table that raises an exception if any UPDATE attempts to change the role field.

## Deployment Instructions

1. Open **Supabase Dashboard** → Select the Rebellys project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `0005_rls_role_lock.sql` and paste it
5. Click **Run**
6. Verify no errors appear in the output

## Verification

After running the migration, test that the fix is in place:

```sql
-- This should FAIL for non-admin users
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';

-- Expected error:
-- ERROR: Profile role cannot be changed via direct UPDATE.
```

## Rollback (if needed)

If you need to revert this migration:

```sql
DROP TRIGGER IF EXISTS lock_profile_role ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_change();
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

## References
- Issue: C-2 (Role Self-Promotion via UPDATE)
- CVSS Score: 9.9 (Critical)
- Status: Ready for deployment
