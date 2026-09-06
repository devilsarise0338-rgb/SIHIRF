import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/src/lib/supabase'
import { LiveCounter } from '@/src/components/ui/LiveCounter'
import { Button } from '@/src/components/ui/Button'
import { useAuth } from '@/src/hooks/useAuth'

export default function LandingPage() {
  const [teamCount, setTeamCount] = useState(0)
  const [hwCount, setHwCount] = useState(0)
  const [swCount, setSwCount] = useState(0)
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    // Initial fetch
    const fetchCounts = async () => {
      const { data, error } = await supabase.from('teams').select('category', { count: 'exact' })
      if (!error && data) {
        setTeamCount(data.length)
        setHwCount(data.filter(t => t.category === 'hardware').length)
        setSwCount(data.filter(t => t.category === 'software').length)
      }
    }
    fetchCounts()

    // Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teams' }, (payload) => {
        setTeamCount(prev => prev + 1)
        if (payload.new.category === 'hardware') setHwCount(prev => prev + 1)
        if (payload.new.category === 'software') setSwCount(prev => prev + 1)
      })
      .subscribe()

    // Fallback poll on drop could be added here

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
        PIET Internal SIH Hackathon
      </h1>
      <p className="text-neutral text-lg mb-12 max-w-xl">
        Nominate your team for the Smart India Hackathon. Form a team of 6, choose a problem statement, and compete to represent PIET.
      </p>

      <div className="bg-white border border-neutral/20 rounded-2xl p-8 mb-12 shadow-sm w-full max-w-md">
        <div className="text-sm font-medium text-neutral mb-2 uppercase tracking-wide">Live Registrations</div>
        <div className="text-6xl text-ember font-bold mb-6">
          <LiveCounter value={teamCount} />
        </div>
        
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <span className="text-neutral mr-2">Software:</span>
            <span className="font-mono font-medium"><LiveCounter value={swCount} /></span>
          </div>
          <div>
            <span className="text-neutral mr-2">Hardware:</span>
            <span className="font-mono font-medium"><LiveCounter value={hwCount} /></span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {user ? (
          <Link to="/register">
            <Button className="text-base h-12 px-8">Continue Registration</Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button className="text-base h-12 px-8">Register your team</Button>
          </Link>
        )}
        
        {isAdmin && (
          <Link to="/admin">
            <Button variant="secondary" className="text-base h-12 px-8">Admin Dashboard</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
