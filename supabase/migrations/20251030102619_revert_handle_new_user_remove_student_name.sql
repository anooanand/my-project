/*
  # Revert handle_new_user trigger to original version

  1. Changes
    - Remove student_name handling from trigger
    - Revert to original simple user profile creation
    
  2. Security
    - Maintains existing RLS policies
*/

-- Revert to original handle_new_user function without student_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile without student_name
  INSERT INTO public.user_profiles (
    id, 
    email,
    payment_status, 
    payment_verified,
    manual_override,
    subscription_status,
    temp_access_until
  )
  VALUES (
    NEW.id,
    NEW.email,
    'pending',
    false,
    false,
    'free',
    NOW() + INTERVAL '24 hours'
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Always return NEW to allow the auth.users insert to complete
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
