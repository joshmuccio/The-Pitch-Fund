-- Create Admin User Script
-- Run this in Supabase SQL Editor after the user has signed up via magic link

-- First, find the user ID from the auth.users table
-- SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Then update their profile to admin role
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'USER_ID_HERE';

-- Or if the profile doesn't exist yet, insert it
INSERT INTO profiles (id, role) 
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (id) 
DO UPDATE SET role = 'admin';

-- Verify the admin user was created
SELECT p.id, p.role, u.email 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE p.role = 'admin'; 