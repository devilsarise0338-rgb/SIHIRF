import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase'
import { Badge } from '@/src/components/ui/Badge'
import { Link } from 'react-router-dom'
import { Button } from '@/src/components/ui/Button'

export default function MyTeamPage() {
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeam = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: teamData } = await supabase
        .from('teams')
        .select('*, problem_statements(title, organization)')
        .eq('leader_auth_id', user.id)
        .single()

      if (teamData) {
        setTeam(teamData)
        const { data: membersData } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamData.id)
        
        if (membersData) setMembers(membersData)
      }
      setLoading(false)
    }
    fetchTeam()
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  
  if (!team) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="mb-4">No team found.</div>
      <Link to="/register"><Button>Register a team</Button></Link>
    </div>
  )

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-2xl font-bold">My Team</h1>
        <Badge variant={team.status === 'registered' ? 'neutral' : team.status === 'shortlisted' ? 'success' : 'danger'}>
          {team.status}
        </Badge>
      </div>

      <div className="bg-white border border-neutral/20 rounded-xl p-6 shadow-sm mb-8 space-y-6">
        <div>
          <div className="text-xs text-neutral uppercase tracking-wider mb-1">Team Code</div>
          <div className="font-mono text-xl font-bold text-pine">{team.team_code}</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-neutral uppercase tracking-wider mb-1">Team Name</div>
            <div className="font-medium">{team.team_name}</div>
          </div>
          <div>
            <div className="text-xs text-neutral uppercase tracking-wider mb-1">Category</div>
            <div className="font-medium capitalize">{team.category}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-neutral uppercase tracking-wider mb-1">Problem Statement</div>
            <div className="font-mono text-sm mb-1">{team.ps_id}</div>
            <div className="font-medium">{team.problem_statements?.title}</div>
            <div className="text-sm text-neutral">{team.problem_statements?.organization}</div>
          </div>
        </div>
      </div>

      <h2 className="font-display text-xl font-bold mb-4">Members</h2>
      <div className="bg-white border border-neutral/20 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral/5 border-b border-neutral/20 text-neutral font-medium">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Reg No</th>
              <th className="p-4 hidden md:table-cell">Email</th>
              <th className="p-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral/10">
            {members.map(m => (
              <tr key={m.id}>
                <td className="p-4">{m.name}</td>
                <td className="p-4 font-mono text-xs">{m.reg_no}</td>
                <td className="p-4 hidden md:table-cell">{m.college_email}</td>
                <td className="p-4">{m.is_leader ? <Badge variant="success">Leader</Badge> : 'Member'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
