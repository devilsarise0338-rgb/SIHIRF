import { useLocation, Link, Navigate } from 'react-router-dom'
import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { Button } from '@/src/components/ui/Button'

export default function ConfirmationPage() {
  const location = useLocation()
  const cardRef = useRef<HTMLDivElement>(null)
  
  if (!location.state) return <Navigate to="/" />
  
  const { teamCode, teamName, category, psId } = location.state

  const handleDownload = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `${teamCode}-SIH-PIET.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Error generating image', err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-6">
      <div className="max-w-md w-full text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Registration Complete</h1>
        <p className="text-neutral">Your team has been successfully nominated.</p>
      </div>

      <div 
        ref={cardRef} 
        className="w-full max-w-md bg-white border border-neutral/20 rounded-2xl p-8 shadow-sm relative overflow-hidden mb-8"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-pine"></div>
        <div className="text-center mb-6 pt-2">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral mb-1">PIET • SIH 2024</div>
          <div className="font-mono text-3xl font-bold text-ink">{teamCode}</div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-xs text-neutral uppercase tracking-wider mb-1">Team Name</div>
            <div className="font-medium text-lg">{teamName}</div>
          </div>
          <div>
            <div className="text-xs text-neutral uppercase tracking-wider mb-1">Category</div>
            <div className="font-medium capitalize">{category}</div>
          </div>
          <div>
            <div className="text-xs text-neutral uppercase tracking-wider mb-1">Problem Statement</div>
            <div className="font-mono text-sm font-medium">{psId}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={handleDownload} className="flex-1">
          Download Card
        </Button>
        <Link to="/my-team" className="flex-1">
          <Button variant="secondary" className="w-full">
            Back to my team
          </Button>
        </Link>
      </div>
    </div>
  )
}
