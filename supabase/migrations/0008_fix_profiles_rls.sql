-- Drop the overly permissive public profiles read policy
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;

-- Users can only read their own profile (admin read-all covered by existing admin policy)
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
