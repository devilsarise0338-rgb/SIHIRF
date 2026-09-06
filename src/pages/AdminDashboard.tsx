import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StatusBadge } from '../components/ui/Feedback';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user?.email) return;
      
      const { data: adminData } = await supabase
        .from('admin_emails')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (adminData) {
        setIsAdmin(true);
        fetchTeams();
      } else {
        setLoading(false);
      }
    };
    
    checkAdminAndFetch();
  }, [user]);

  const fetchTeams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('teams')
      .select(`
        *,
        problem_statements ( title ),
        team_members ( id, gender, name, email:college_email )
      `)
      .order('created_at', { ascending: false });
      
    if (data) setTeams(data);
    setLoading(false);
  };

  const updateStatus = async (teamId: string, newStatus: string) => {
    const originalTeams = [...teams];
    
    // Optimistic update
    setTeams(teams.map(t => t.id === teamId ? { ...t, status: newStatus } : t));
    
    const { error } = await supabase
      .from('teams')
      .update({ status: newStatus })
      .eq('id', teamId);
      
    if (error) {
      console.error(error);
      setTeams(originalTeams); // Rollback
      alert('Failed to update status');
    }
  };

  const exportCSV = () => {
    if (!filteredTeams.length) return;
    
    const headers = ['Team Code', 'Team Name', 'Category', 'Status', 'Leader Name', 'Leader Email', 'Members'];
    const rows = filteredTeams.map(t => [
      t.team_code,
      `"${t.team_name}"`,
      t.category,
      t.status,
      `"${t.leader_name}"`,
      t.leader_email,
      `"${t.team_members?.map((m: any) => `${m.name} (${m.email})`).join(', ')}"`
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sih-teams-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="p-12">Loading...</div>;
  if (!isAdmin) return <div className="p-12 text-ember">Access Denied. Admins only.</div>;

  const filteredTeams = teams.filter(t => {
    const matchesSearch = search === '' || 
      t.team_name.toLowerCase().includes(search.toLowerCase()) || 
      t.team_code.toLowerCase().includes(search.toLowerCase()) ||
      t.ps_id.toLowerCase().includes(search.toLowerCase());
      
    const matchesCategory = category === '' || t.category === category;
    const matchesStatus = status === '' || t.status === status;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen p-6 md:p-12 mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display">Admin Dashboard</h1>
          <p className="text-neutral-grey">Manage and shortlist SIH registrations.</p>
        </div>
        <Button onClick={exportCSV}>Export CSV</Button>
      </div>

      <div className="flex gap-4 items-end bg-paper border border-neutral-grey/20 p-4">
        <div className="flex-1">
          <Input 
            label="Search" 
            placeholder="Team name, code, or PS ID" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="w-48">
          <Select 
            label="Category" 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            options={[{ label: 'All', value: '' }, { label: 'Software', value: 'software' }, { label: 'Hardware', value: 'hardware' }]}
          />
        </div>
        <div className="w-48">
          <Select 
            label="Status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { label: 'All', value: '' }, 
              { label: 'Registered', value: 'registered' }, 
              { label: 'Shortlisted', value: 'shortlisted' }, 
              { label: 'Rejected', value: 'rejected' }
            ]}
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-neutral-grey/20">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-pine/5 border-b border-neutral-grey/20 font-medium">
            <tr>
              <th className="p-4">Team</th>
              <th className="p-4">Category & PS</th>
              <th className="p-4">Leader</th>
              <th className="p-4">Members</th>
              <th className="p-4">Reqs</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-grey/10">
            {filteredTeams.map(team => {
              const hasFemale = team.team_members?.some((m: any) => m.gender === 'female') || false;
              const isShortlisted = team.status === 'shortlisted';
              
              return (
                <tr key={team.id} className="hover:bg-black/5">
                  <td className="p-4">
                    <p className="font-medium text-base">{team.team_name}</p>
                    <p className="font-mono text-pine text-xs">{team.team_code}</p>
                  </td>
                  <td className="p-4">
                    <p className="capitalize">{team.category}</p>
                    <p className="text-xs text-neutral-grey truncate w-48" title={team.problem_statements?.title}>
                      {team.ps_id}
                    </p>
                  </td>
                  <td className="p-4">
                    <p>{team.leader_name}</p>
                    <p className="text-xs text-neutral-grey">{team.leader_email}</p>
                  </td>
                  <td className="p-4 font-mono">
                    {team.team_members?.length || 0}/6
                  </td>
                  <td className="p-4">
                    {hasFemale ? <span className="text-pine">F✅</span> : <span className="text-ember">F❌</span>}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={team.status} />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => updateStatus(team.id, isShortlisted ? 'registered' : 'shortlisted')}
                      className={`text-xs font-medium px-3 py-1 border ${isShortlisted ? 'border-ember text-ember hover:bg-ember/10' : 'border-pine text-pine hover:bg-pine/10'}`}
                    >
                      {isShortlisted ? 'Revoke' : 'Shortlist'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredTeams.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-grey">No teams found matching filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
