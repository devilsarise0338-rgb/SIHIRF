-- Temporarily disable the @piet.ac.in email restriction
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS trigger AS $$
BEGIN
    -- IF NEW.email NOT LIKE '%@piet.ac.in' THEN
    --     RAISE EXCEPTION 'Only @piet.ac.in email addresses are allowed';
    -- END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
