/*
  # Add student_name to user_profiles

  1. Changes
    - Add student_name column to user_profiles table
    - Update handle_new_user trigger to extract student_name from user metadata
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add student_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN student_name TEXT;
  END IF;
END $$;

-- Update the handle_new_user function to extract student_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user_profiles with student_name from metadata
  INSERT INTO public.user_profiles (
    id, 
    email,
    student_name,
    payment_status, 
    payment_verified,
    manual_override,
    subscription_status,
    temp_access_until
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'student_name', ''),
    'pending',
    false,
    false,
    'free',
    NOW() + INTERVAL '24 hours'
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    student_name = COALESCE(EXCLUDED.student_name, user_profiles.student_name),
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
