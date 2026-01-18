-- Fix the permissive RLS policy on activity_logs
-- Replace the overly permissive INSERT policy with a proper one
DROP POLICY IF EXISTS "System can insert logs" ON public.activity_logs;

-- Activity logs should be insertable by authenticated users for their own actions
CREATE POLICY "Users can insert their own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);