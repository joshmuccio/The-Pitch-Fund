-- Migration: Add missing write policy for profiles table
-- Date: 2025-01-04
-- Description: Prevent users from updating other users' profiles

-- Add self-only write policy for profiles
-- Users can only update their own profile data
CREATE POLICY "Profiles: self write" ON profiles
FOR ALL USING (auth.uid() = id); 