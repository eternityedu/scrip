-- Add new tone values to the content_tone enum
ALTER TYPE public.content_tone ADD VALUE IF NOT EXISTS 'cinematic';
ALTER TYPE public.content_tone ADD VALUE IF NOT EXISTS 'bold';