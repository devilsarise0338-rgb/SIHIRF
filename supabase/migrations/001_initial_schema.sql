-- 1. problem_statements Table
CREATE TABLE problem_statements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware')),
    organization TEXT NOT NULL,
    theme TEXT NOT NULL
);

-- 2. teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_number INTEGER UNIQUE NOT NULL, -- Auto-assigned via sequence below
    team_code TEXT UNIQUE NOT NULL,      -- Generated from team_number and category
    team_name TEXT NOT NULL,
    ps_id TEXT NOT NULL REFERENCES problem_statements(id),
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware')),
    leader_auth_id UUID NOT NULL REFERENCES auth.users(id),
    leader_name TEXT NOT NULL,
    leader_email TEXT NOT NULL,
    leader_mobile TEXT NOT NULL,
    leader_reg_no TEXT NOT NULL CHECK (leader_reg_no ~ '^PIET\d{2}[A-Z]{2}\d{3}$'),
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'shortlisted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. team_members Table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_email TEXT UNIQUE NOT NULL CHECK (college_email LIKE '%@piet.ac.in'),
    reg_no TEXT UNIQUE NOT NULL CHECK (reg_no ~ '^PIET\d{2}[A-Z]{2}\d{3}$'),
    is_leader BOOLEAN NOT NULL DEFAULT false
);

-- 4. Sequences and RPC for team_number
CREATE SEQUENCE team_number_seq START 1;

-- SECURITY DEFINER RPC to safely get the next team number
CREATE OR REPLACE FUNCTION assign_team_number()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('team_number_seq');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle atomic insert of team and members
-- The user requested an atomic insert so a failure doesn't leave orphaned rows
CREATE OR REPLACE FUNCTION register_team(
    p_team_name TEXT,
    p_ps_id TEXT,
    p_category TEXT,
    p_leader_name TEXT,
    p_leader_email TEXT,
    p_leader_mobile TEXT,
    p_leader_reg_no TEXT,
    p_members JSONB -- Array of member objects
) RETURNS UUID AS $$
DECLARE
    v_team_id UUID;
    v_team_number INTEGER;
    v_team_code TEXT;
    v_member JSONB;
BEGIN
    -- 1. Get next team number
    v_team_number := assign_team_number();
    
    -- 2. Generate team code
    v_team_code := 'SIH-' || 
                   CASE WHEN p_category = 'software' THEN 'CS' ELSE 'HW' END || 
                   '-' || lpad(v_team_number::TEXT, 3, '0');

    -- 3. Insert team
    INSERT INTO teams (
        team_number, team_code, team_name, ps_id, category, 
        leader_auth_id, leader_name, leader_email, leader_mobile, leader_reg_no
    ) VALUES (
        v_team_number, v_team_code, p_team_name, p_ps_id, p_category, 
        auth.uid(), p_leader_name, p_leader_email, p_leader_mobile, p_leader_reg_no
    ) RETURNING id INTO v_team_id;

    -- 4. Insert members
    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
    LOOP
        INSERT INTO team_members (
            team_id, name, gender, phone, college_email, reg_no, is_leader
        ) VALUES (
            v_team_id,
            v_member->>'name',
            v_member->>'gender',
            v_member->>'phone',
            v_member->>'college_email',
            v_member->>'reg_no',
            (v_member->>'is_leader')::BOOLEAN
        );
    END LOOP;

    RETURN v_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Admin Table for Allowlist
CREATE TABLE admin_emails (
    email TEXT PRIMARY KEY
);

-- 6. Indexes
CREATE INDEX idx_teams_ps_id ON teams(ps_id);
CREATE INDEX idx_teams_category ON teams(category);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- 7. Row Level Security (RLS)
ALTER TABLE problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_emails WHERE email = auth.jwt()->>'email'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- problem_statements policies
CREATE POLICY "Anyone can read problem statements" ON problem_statements FOR SELECT USING (true);
CREATE POLICY "Admins can manage problem statements" ON problem_statements FOR ALL USING (is_admin());

-- teams policies
CREATE POLICY "Users can insert their own team" ON teams FOR INSERT WITH CHECK (leader_auth_id = auth.uid());
CREATE POLICY "Users can read their own team" ON teams FOR SELECT USING (leader_auth_id = auth.uid() OR is_admin());
CREATE POLICY "Users can update their own team" ON teams FOR UPDATE USING (leader_auth_id = auth.uid() OR is_admin());
CREATE POLICY "Admins can manage all teams" ON teams FOR ALL USING (is_admin());

-- team_members policies
-- To read a team member, the user must be the leader of that team, or an admin
CREATE POLICY "Users can read their team members" ON team_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND leader_auth_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Users can insert their team members" ON team_members FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND leader_auth_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Users can update their team members" ON team_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_members.team_id AND leader_auth_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Admins can manage all team members" ON team_members FOR ALL USING (is_admin());

-- admin_emails policies
CREATE POLICY "Admins can read admin_emails" ON admin_emails FOR SELECT USING (is_admin());

-- 8. Auth Trigger for Domain Restriction & Auto-create Profile (if needed)
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS trigger AS $$
BEGIN
    IF NEW.email NOT LIKE '%@piet.ac.in' THEN
        RAISE EXCEPTION 'Only @piet.ac.in email addresses are allowed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_email_domain_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION check_email_domain();
