/*
  # Fix user_access_status RLS Policy

  1. Changes
    - Add new RLS policy to allow users to query their own access status by email
    - This fixes the authentication flow where AuthContext queries by email
  
  2. Security
    - Policy ensures users can only read their own data
    - Uses auth.email() to match the email column
*/

-- Drop existing policy and recreate with both id and email support
DROP POLICY IF EXISTS "Users can read own access status" ON user_access_status;

CREATE POLICY "Users can read own access status"
  ON user_access_status
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    auth.jwt() ->> 'email' = email
  );
