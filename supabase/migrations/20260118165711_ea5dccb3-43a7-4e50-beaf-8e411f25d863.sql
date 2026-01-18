-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for content types
CREATE TYPE public.content_type AS ENUM (
  'blog_article', 'seo_article', 'website_content', 'product_description',
  'social_media_post', 'email_campaign', 'ad_copy', 'case_study', 'story',
  'youtube_script', 'shorts_script', 'podcast_script', 'documentary_script',
  'movie_scene_script', 'commercial_script', 'voiceover_narration'
);

-- Create enum for tone
CREATE TYPE public.content_tone AS ENUM (
  'professional', 'casual', 'emotional', 'persuasive', 'authoritative',
  'friendly', 'formal', 'humorous', 'inspirational'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create content_history table
CREATE TABLE public.content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type content_type NOT NULL,
  tone content_tone NOT NULL,
  topic TEXT NOT NULL,
  target_audience TEXT,
  platform TEXT,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create analysis_reports table
CREATE TABLE public.analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_analyzed TEXT NOT NULL,
  overall_score NUMERIC(3,1) NOT NULL,
  clarity_score NUMERIC(3,1) NOT NULL,
  structure_score NUMERIC(3,1) NOT NULL,
  engagement_score NUMERIC(3,1) NOT NULL,
  grammar_score NUMERIC(3,1) NOT NULL,
  originality_score NUMERIC(3,1) NOT NULL,
  flow_score NUMERIC(3,1) NOT NULL,
  audience_relevance_score NUMERIC(3,1) NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id)
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if this is the first user (for auto-admin)
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first BOOLEAN;
BEGIN
  -- Check if this is the first user
  SELECT public.is_first_user() INTO is_first;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign role (admin if first user, otherwise regular user)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_first THEN 'admin'::app_role ELSE 'user'::app_role END);
  
  -- Log the signup
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (NEW.id, 'user_signup', jsonb_build_object('email', NEW.email, 'is_admin', is_first));
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for content_history
CREATE POLICY "Users can view their own content"
  ON public.content_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content"
  ON public.content_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content"
  ON public.content_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all content"
  ON public.content_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analysis_reports
CREATE POLICY "Users can view their own reports"
  ON public.analysis_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
  ON public.analysis_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.analysis_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.analysis_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_settings (admin only)
CREATE POLICY "Admins can view settings"
  ON public.admin_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings"
  ON public.admin_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
  ON public.admin_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for activity_logs
CREATE POLICY "Admins can view all logs"
  ON public.activity_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value) VALUES
  ('landing_page', '{"headline": "Write Powerful Content. Measure Its Quality. Instantly.", "subheadline": "Scriptora AI helps creators, writers, and marketers generate high-quality content and scripts — and analyze them with real scoring.", "cta_primary": "Start Writing Free", "cta_secondary": "Analyze Your Content"}'),
  ('ai_settings', '{"max_output_length": 2000, "quality_threshold": 7, "enabled_tools": ["content_writer", "script_writer", "analyzer"]}'),
  ('system_prompt', '{"content": "You are Scriptora AI, an expert content and script writer. Think like a professional human writer. Avoid generic phrases. No repetition. Use clear structure. Follow industry-standard writing formats. Prioritize clarity, impact, and originality."}');

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_content_history_user_id ON public.content_history(user_id);
CREATE INDEX idx_content_history_created_at ON public.content_history(created_at DESC);
CREATE INDEX idx_analysis_reports_user_id ON public.analysis_reports(user_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);