import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LiveCounter } from '../components/ui/LiveCounter';
import { Button } from '../components/ui/Button';

export function Landing() {
  const [counts, setCounts] = useState({ total: 0, software: 0, hardware: 0 });

  const fetchCounts = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('category');
    
    if (!error && data) {
      const software = data.filter(d => d.category === 'software').length;
      const hardware = data.filter(d => d.category === 'hardware').length;
      setCounts({ total: data.length, software, hardware });
    }
  };

  useEffect(() => {
    fetchCounts();

    const channel = supabase
      .channel('public:teams')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'teams' }, (payload) => {
        setCounts(prev => {
          const isSoftware = payload.new.category === 'software';
          return {
            total: prev.total + 1,
            software: isSoftware ? prev.software + 1 : prev.software,
            hardware: !isSoftware ? prev.hardware + 1 : prev.hardware,
          };
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to live updates');
        }
      });

    // Fallback polling
    const pollInterval = setInterval(() => {
      if (channel.state !== 'joined') {
        fetchCounts();
      }
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-4xl">
      <header className="mb-24">
        <h1 className="font-display text-2xl font-bold tracking-tight">PIET <span className="text-neutral-grey font-normal">SIH Portal</span></h1>
      </header>
      
      <main className="space-y-16">
        <section className="space-y-6 max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            Internal Hackathon 2026 Nominations
          </h2>
          <p className="text-lg text-ink/80 leading-relaxed">
            Form your team of 6, select a problem statement, and register for the internal hackathon. Only shortlisted teams will be officially nominated by PIET for the Smart India Hackathon.
          </p>
          <div className="pt-4">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8 py-4">Register your team</Button>
            </Link>
          </div>
        </section>

        <section className="pt-12 border-t border-neutral-grey/20">
          <div className="mb-8">
            <LiveCounter value={counts.total} label="Teams Registered" />
          </div>
          <div className="flex gap-12">
            <LiveCounter value={counts.software} label="Software" size="small" />
            <LiveCounter value={counts.hardware} label="Hardware" size="small" />
          </div>
        </section>
      </main>
    </div>
  );
}
