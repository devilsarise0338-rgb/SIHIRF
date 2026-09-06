import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StatusBadge } from '../components/ui/Feedback';

export function MyTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      if (!user) return;
      const { data: teamData } = await supabase
        .from('teams')
        .select(`*, problem_statements(title)`)
        .eq('leader_auth_id', user.id)
        .single();

      if (teamData) {
        setTeam(teamData);
        const { data: memberData } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamData.id);
        
        if (memberData) setMembers(memberData);
      }
      setLoading(false);
    };
    fetchTeam();
  }, [user]);

  if (loading) return <div className="p-12">Loading...</div>;
  if (!team) return <div className="p-12">No team found.</div>;

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto space-y-12">
      <header className="flex justify-between items-end border-b border-neutral-grey/20 pb-6">
        <div>
          <h1 className="text-4xl font-display">{team.team_name}</h1>
          <p className="font-mono text-pine mt-2 text-lg">{team.team_code}</p>
        </div>
        <div className="text-right">
          <StatusBadge status={team.status} />
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        <section className="space-y-6">
          <h2 className="text-xl font-display">Problem Statement</h2>
          <div className="p-6 bg-pine/5 border border-pine/20">
            <p className="font-mono text-pine mb-2">{team.ps_id}</p>
            <p className="font-medium">{team.problem_statements?.title}</p>
            <p className="text-sm text-neutral-grey mt-4 capitalize">Category: {team.category}</p>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-display">Team Members</h2>
          <div className="space-y-4">
            {members.map(m => (
              <div key={m.id} className="p-4 border border-neutral-grey/20 flex justify-between items-center">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {m.name} 
                    {m.is_leader && <span className="text-xs bg-pine text-white px-2 py-0.5 rounded-sm">LEADER</span>}
                  </p>
                  <p className="text-sm text-neutral-grey">{m.college_email}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{m.reg_no}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
