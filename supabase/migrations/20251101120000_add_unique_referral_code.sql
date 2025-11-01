-- 20251101120000_add_unique_referral_code.sql

-- 1. Add the referral_code column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN referral_code TEXT UNIQUE;

-- 2. Create a function to generate a unique, short referral code
-- We will use a combination of characters and numbers for a short, human-readable code.
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
        -- Using a mix of uppercase letters and numbers to increase space
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

-- 3. Update the handle_new_user function to generate and insert the referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_student_name TEXT;
  v_referral_code TEXT;
BEGIN
  -- Extract student_name from metadata, default to empty string if not present
  v_student_name := COALESCE(NEW.raw_user_meta_data->>'student_name', '');
  
  -- Generate a unique referral code
  v_referral_code := public.generate_unique_referral_code();

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
      referral_code -- New column
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
      v_referral_code -- New value
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
      student_name = CASE 
        WHEN EXCLUDED.student_name != '' THEN EXCLUDED.student_name 
        ELSE user_profiles.student_name 
      END,
      email = EXCLUDED.email,
      referral_code = COALESCE(user_profiles.referral_code, EXCLUDED.referral_code) -- Ensure code is only set once
    RETURNING referral_code INTO v_referral_code; -- Retrieve the code in case of update

  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but continue to allow the user to sign up
      RAISE WARNING 'Error inserting user profile for user %: %', NEW.id, SQLERRM;
  END;

  -- If a referrer ID is passed in the metadata, record the referral
  -- This part assumes the referrer's code is passed in the signup metadata, e.g., 'referrer_code'
  IF NEW.raw_user_meta_data->>'referrer_code' IS NOT NULL THEN
    INSERT INTO public.referrals (
      referrer_id,
      referred_id,
      referred_email
    )
    SELECT 
      up.id,
      NEW.id,
      NEW.email
    FROM public.user_profiles up
    WHERE up.referral_code = NEW.raw_user_meta_data->>'referrer_code'
    ON CONFLICT DO NOTHING; -- Prevent duplicate referral entries
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill existing users with a referral code
-- This is important for existing users to have a code to share.
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
