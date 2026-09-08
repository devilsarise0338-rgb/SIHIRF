-- Ensure team names are unique (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS teams_team_name_lower_idx ON teams (LOWER(team_name));

-- Ensure leaders can only create one team
ALTER TABLE teams ADD CONSTRAINT teams_leader_auth_id_key UNIQUE (leader_auth_id);
ALTER TABLE teams ADD CONSTRAINT teams_leader_email_key UNIQUE (leader_email);
ALTER TABLE teams ADD CONSTRAINT teams_leader_reg_no_key UNIQUE (leader_reg_no);
