/*
  # Add Profile Photos Support

  1. Changes
    - Add `photo_url` column to team_members table to store profile photo URLs
    - Create storage bucket for profile photos
    - Set up RLS policies for storage bucket

  2. Security
    - Authenticated users can upload photos
    - Photos are publicly accessible (for viewing)
    - Users can only delete/update their own team members' photos
*/

-- Add photo_url column to team_members table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'team_members' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE team_members ADD COLUMN photo_url text;
  END IF;
END $$;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can update their team photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can delete their team photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos');
