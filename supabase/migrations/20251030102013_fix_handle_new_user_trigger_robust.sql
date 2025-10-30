/*
  # Fix handle_new_user trigger to be more robust

  1. Changes
    - Update trigger to handle all edge cases
    - Ensure signup completes even if profile creation has issues
    - Add better error handling
    
  2. Security
    - Maintains SECURITY DEFINER for proper permissions
*/

-- Create a more robust version of handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
BEGIN
  -- Extract student_name from metadata, default to empty string if not present
  v_student_name := COALESCE(NEW.raw_user_meta_data->>'student_name', '');
  
  -- Try to insert the user profile
  BEGIN
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
      v_student_name,
      'pending',
      false,
      false,
      'free',
      NOW() + INTERVAL '24 hours'
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      student_name = CASE 
        WHEN EXCLUDED.student_name != '' THEN EXCLUDED.student_name 
        ELSE user_profiles.student_name 
      END,
      email = EXCLUDED.email,
      updated_at = NOW();
      
  EXCEPTION 
    WHEN unique_violation THEN
      -- If there's a unique violation on email, try updating instead
      UPDATE public.user_profiles
      SET 
        student_name = CASE 
          WHEN v_student_name != '' THEN v_student_name 
          ELSE student_name 
        END,
        updated_at = NOW()
      WHERE id = NEW.id;
      
    WHEN OTHERS THEN
      -- Log the error but don't fail the signup
      RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Always return NEW to allow the auth.users insert to complete
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
