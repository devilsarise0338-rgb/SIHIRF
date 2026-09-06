-- Problem Statements
CREATE TABLE problem_statements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('software', 'hardware')) NOT NULL,
    organization TEXT,
    theme TEXT
);

-- Sequence for team number
CREATE SEQUENCE team_number_seq START 1;

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_number INTEGER UNIQUE NOT NULL DEFAULT nextval('team_number_seq'),
    team_code TEXT UNIQUE,
    team_name TEXT NOT NULL,
    ps_id TEXT REFERENCES problem_statements(id),
    category TEXT CHECK (category IN ('software', 'hardware')),
    leader_auth_id UUID REFERENCES auth.users(id),
    leader_name TEXT NOT NULL,
    leader_email TEXT NOT NULL,
    leader_mobile TEXT NOT NULL,
    leader_reg_no TEXT NOT NULL CHECK (leader_reg_no ~ '^PIET\d{2}[A-Z]{2}\d{3}$'),
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'shortlisted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Generate team code on insert using a trigger
CREATE OR REPLACE FUNCTION generate_team_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.team_code := 'SIH-' || 
                     CASE WHEN NEW.category = 'software' THEN 'CS' ELSE 'HW' END || 
                     '-' || 
                     LPAD(NEW.team_number::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_team_code
BEFORE INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION generate_team_code();

-- Team Members
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_email TEXT UNIQUE NOT NULL CHECK (college_email LIKE '%@piet.ac.in'),
    reg_no TEXT UNIQUE NOT NULL CHECK (reg_no ~ '^PIET\d{2}[A-Z]{2}\d{3}$'),
    is_leader BOOLEAN DEFAULT false
);

-- Admin Emails
CREATE TABLE admin_emails (
    email TEXT PRIMARY KEY
);

-- RPC for assigning team number
CREATE OR REPLACE FUNCTION assign_team_number()
RETURNS INTEGER AS $$
BEGIN
    RETURN nextval('team_number_seq');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX idx_teams_ps_id ON teams(ps_id);
CREATE INDEX idx_teams_category ON teams(category);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- Row Level Security (RLS)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Problem statements are readable by everyone
CREATE POLICY "Problem statements are public" ON problem_statements
    FOR SELECT TO authenticated, anon USING (true);

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_emails WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams Policies
-- Students can insert/select/update their own team
CREATE POLICY "Users can manage their own team" ON teams
    FOR ALL TO authenticated
    USING (leader_auth_id = auth.uid())
    WITH CHECK (leader_auth_id = auth.uid());

-- Admins can manage all teams
CREATE POLICY "Admins can view and manage all teams" ON teams
    FOR ALL TO authenticated
    USING (is_admin(auth.jwt() ->> 'email'))
    WITH CHECK (is_admin(auth.jwt() ->> 'email'));

-- Team Members Policies
-- Students can read/manage members of their own team
CREATE POLICY "Users can manage members of their own team" ON team_members
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.leader_auth_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.leader_auth_id = auth.uid()));

-- Admins can manage all team members
CREATE POLICY "Admins can view and manage all team members" ON team_members
    FOR ALL TO authenticated
    USING (is_admin(auth.jwt() ->> 'email'))
    WITH CHECK (is_admin(auth.jwt() ->> 'email'));

-- Auth hook to restrict signup to @piet.ac.in domain
-- Assuming usage of auth.users
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email NOT LIKE '%@piet.ac.in' THEN
        RAISE EXCEPTION 'Only @piet.ac.in emails are allowed to register';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_email_domain
BEFORE INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION check_email_domain();
