import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import * as htmlToImage from 'html-to-image';

export function Confirmation() {
  const { teamId } = useParams();
  const [team, setTeam] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from('teams')
        .select(`
          team_code,
          team_name,
          category,
          problem_statements ( title )
        `)
        .eq('id', teamId)
        .single();
      
      if (data) setTeam(data);
    };
    if (teamId) fetchTeam();
  }, [teamId]);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${team?.team_code || 'team'}-sih-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    }
  };

  if (!team) return <div className="p-12">Loading...</div>;

  return (
    <div className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-display">Registration Successful!</h1>
        <p className="text-neutral-grey">Your team is now registered for the internal hackathon.</p>
      </div>

      {/* Shareable Card */}
      <div 
        ref={cardRef} 
        className="w-full max-w-md bg-paper border-2 border-pine p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-pine">
            <path d="M12 2L2 22h20L12 2zm0 4.5l7.5 15h-15L12 6.5z"/>
          </svg>
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-widest uppercase text-pine">PIET Internal Hackathon '26</p>
            <h2 className="text-3xl font-display leading-none">{team.team_name}</h2>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-neutral-grey/20">
            <div>
              <p className="text-xs text-neutral-grey uppercase tracking-wider mb-1">Team Code</p>
              <p className="font-mono text-xl text-pine">{team.team_code}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-grey uppercase tracking-wider mb-1">Category</p>
                <p className="capitalize font-medium">{team.category}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-neutral-grey uppercase tracking-wider mb-1">Problem Statement</p>
              <p className="text-sm line-clamp-3">{team.problem_statements?.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={downloadCard} className="flex-1">
          Download Card
        </Button>
        <Link to={`/my-team`} className="flex-1">
          <Button variant="secondary" className="w-full">
            Back to My Team
          </Button>
        </Link>
      </div>
    </div>
  );
}
