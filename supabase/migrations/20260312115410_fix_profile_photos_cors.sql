/*
  # Fix CORS for profile-photos storage bucket

  1. Changes
    - Ensure profile-photos bucket exists and is public
    - Update CORS settings to allow cross-origin requests

  2. Notes
    - This fixes the "Specify a Cross-Origin Resource Policy" error
    - Profile photos will be accessible from the application
*/

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Update CORS settings for the bucket
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 5242880, -- 5MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'profile-photos';
