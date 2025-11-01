-- 20251101120000_add_unique_referral_code.sql

-- This migration consolidates and fixes the referral system logic.
-- It assumes the user_profiles columns (referral_count, referral_code, referred_by) and the referral_log table
-- were created in the previous migration (20251101100000_add_referral_system.sql).

-- 1. Create a function to generate a unique, short referral code
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    max_attempts CONSTANT INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    LOOP
        attempt := attempt + 1;
        -- Generate a 6-character alphanumeric code (e.g., A1B2C3)
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

        -- Check if the code already exists
        IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = new_code) THEN
            RETURN new_code;
        END IF;

        -- Exit loop if max attempts reached to prevent infinite loop
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate a unique referral code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 2. Update the handle_new_user function to generate referral code, set referred_by, and create a pending log entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_referral_code TEXT;
  v_referrer_id UUID;
  v_referrer_code_used TEXT;
BEGIN
  -- Extract student_name from metadata, default to empty string if not present
  v_student_name := COALESCE(NEW.raw_user_meta_data->>'student_name', '');
  
  -- Generate a unique referral code
  v_referral_code := public.generate_unique_referral_code();
  
  -- Check for referrer code in metadata
  v_referrer_code_used := NEW.raw_user_meta_data->>'referrer_code';

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
      temp_access_until,
      referral_code, -- New column
      referred_by    -- New column
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_student_name,
      'pending',
      false,
      false,
      'free',
      NOW() + INTERVAL '24 hours',
      v_referral_code, -- New value
      v_referrer_code_used -- Set referred_by if present
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      student_name = CASE 
        WHEN EXCLUDED.student_name != '' THEN EXCLUDED.student_name 
        ELSE user_profiles.student_name 
      END,
      email = EXCLUDED.email,
      referral_code = COALESCE(user_profiles.referral_code, EXCLUDED.referral_code), -- Ensure code is only set once
      referred_by = COALESCE(user_profiles.referred_by, EXCLUDED.referred_by) -- Ensure referred_by is only set once
    RETURNING referral_code INTO v_referral_code; -- Retrieve the code in case of update

  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but continue to allow the user to sign up
      RAISE WARNING 'Error inserting user profile for user %: %', NEW.id, SQLERRM;
  END;

  -- If a referrer code was used, create a pending entry in the referral_log
  IF v_referrer_code_used IS NOT NULL THEN
    -- Find the referrer's ID using the referral code
    SELECT id INTO v_referrer_id
    FROM public.user_profiles up
    WHERE up.referral_code = v_referrer_code_used;

    IF v_referrer_id IS NOT NULL THEN
      INSERT INTO public.referral_log (
        referrer_id,
        referred_user_id,
        referral_code_used,
        status
      )
      VALUES (
        v_referrer_id,
        NEW.id,
        v_referrer_code_used,
        'pending'
      )
      ON CONFLICT (referred_user_id) DO NOTHING; -- Prevent duplicate pending entries
    ELSE
      RAISE WARNING 'Referrer not found for code % used by user %', v_referrer_code_used, NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill existing users with a referral code (re-run this part to ensure all users have a code)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN
        SELECT id
        FROM public.user_profiles
        WHERE referral_code IS NULL
    LOOP
        UPDATE public.user_profiles
        SET referral_code = public.generate_unique_referral_code()
        WHERE id = user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;