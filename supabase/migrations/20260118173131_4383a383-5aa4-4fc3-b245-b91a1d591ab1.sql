-- Fix security issue: Add INSERT policy on profiles table to block direct inserts
-- (profiles are created by the handle_new_user trigger with SECURITY DEFINER)
CREATE POLICY "Block direct profile inserts" 
ON public.profiles 
FOR INSERT 
WITH CHECK (false);

-- Add a comment explaining the security design
COMMENT ON TABLE public.profiles IS 'User profiles created automatically by handle_new_user trigger. Direct inserts are blocked for security.';