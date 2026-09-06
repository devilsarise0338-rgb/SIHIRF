import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/src/hooks/useAuth'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/src/components/ui/Input'
import { Select } from '@/src/components/ui/Select'
import { SearchSelect } from '@/src/components/ui/SearchSelect'
import { Progress } from '@/src/components/ui/Progress'
import { Badge } from '@/src/components/ui/Badge'
import { supabase } from '@/src/lib/supabase'

interface Member {
  name: string;
  gender: string;
  phone: string;
  college_email: string;
  reg_no: string;
}

interface FormState {
  leaderMobile: string;
  leaderRegNo: string;
  teamName: string;
  members: Member[];
  category: 'software' | 'hardware' | '';
  psId: string;
}

const emptyMember = (): Member => ({ name: '', gender: '', phone: '', college_email: '', reg_no: '' })

export default function RegistrationWizard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<FormState>(() => {
    const saved = localStorage.getItem('sih_registration_draft')
    if (saved) return JSON.parse(saved)
    return {
      leaderMobile: '',
      leaderRegNo: '',
      teamName: '',
      members: [emptyMember(), emptyMember(), emptyMember(), emptyMember(), emptyMember()],
      category: '',
      psId: ''
    }
  })

  useEffect(() => {
    localStorage.setItem('sih_registration_draft', JSON.stringify(formData))
  }, [formData])

  const [problemStatements, setProblemStatements] = useState<any[]>([])
  useEffect(() => {
    if (step === 5) {
      supabase.from('problem_statements').select('*').eq('category', formData.category).then(({ data }) => {
        if (data) setProblemStatements(data)
      })
    }
  }, [step, formData.category])

  const validateRegNo = (regNo: string) => /^PIET\d{2}[A-Z]{2}\d{3}$/.test(regNo)
  const validateEmail = (email: string) => email.endsWith('@piet.ac.in')

  const hasFemale = () => {
    return formData.members.some(m => m.gender === 'female')
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 6))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Create team
      const { data: teamNumData, error: rpcError } = await supabase.rpc('assign_team_number')
      if (rpcError) throw rpcError
      
      const { data: teamData, error: teamError } = await supabase.from('teams').insert({
        team_name: formData.teamName,
        ps_id: formData.psId,
        category: formData.category,
        leader_auth_id: user?.id,
        leader_name: user?.user_metadata?.name || user?.email?.split('@')[0],
        leader_email: user?.email,
        leader_mobile: formData.leaderMobile,
        leader_reg_no: formData.leaderRegNo
      }).select('id, team_code').single()

      if (teamError) throw teamError

      const membersToInsert = [
        {
          team_id: teamData.id,
          name: user?.user_metadata?.name || user?.email?.split('@')[0],
          gender: 'unknown', // Leader gender could be asked or inferred
          phone: formData.leaderMobile,
          college_email: user?.email,
          reg_no: formData.leaderRegNo,
          is_leader: true
        },
        ...formData.members.map(m => ({
          team_id: teamData.id,
          name: m.name,
          gender: m.gender,
          phone: m.phone,
          college_email: m.college_email,
          reg_no: m.reg_no,
          is_leader: false
        }))
      ]

      const { error: memberError } = await supabase.from('team_members').insert(membersToInsert)
      if (memberError) throw memberError

      localStorage.removeItem('sih_registration_draft')
      navigate('/confirm', { state: { teamCode: teamData.team_code, teamName: formData.teamName, category: formData.category, psId: formData.psId } })

    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold">Team Registration</h1>
        <Progress current={step} total={6} />
      </div>

      <div className="bg-white border border-neutral/20 rounded-xl p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Leader Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input value={user?.user_metadata?.name || user?.email?.split('@')[0]} readOnly className="bg-neutral/5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input value={user?.email || ''} readOnly className="bg-neutral/5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Number</label>
                <Input 
                  value={formData.leaderMobile} 
                  onChange={e => setFormData({ ...formData, leaderMobile: e.target.value })} 
                  placeholder="10-digit number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Registration Number</label>
                <Input 
                  value={formData.leaderRegNo} 
                  onChange={e => setFormData({ ...formData, leaderRegNo: e.target.value.toUpperCase() })} 
                  placeholder="PIET24CS001"
                  className={formData.leaderRegNo && !validateRegNo(formData.leaderRegNo) ? 'border-ember' : ''}
                />
                {formData.leaderRegNo && !validateRegNo(formData.leaderRegNo) && (
                  <p className="text-xs text-ember mt-1">Format: PIET[YY][Branch][000]</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Team Name</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Choose a unique team name</label>
              <Input 
                value={formData.teamName} 
                onChange={e => setFormData({ ...formData, teamName: e.target.value })} 
                placeholder="e.g. TechTitans"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Team Members (5 remaining)</h2>
              {hasFemale() ? (
                <Badge variant="success">✓ Gender requirement met</Badge>
              ) : (
                <Badge variant="warning">! Needs 1 female member</Badge>
              )}
            </div>
            
            <div className="space-y-8">
              {formData.members.map((member, idx) => (
                <div key={idx} className="p-4 border border-neutral/10 rounded-lg space-y-4 bg-neutral/5">
                  <div className="font-medium text-sm text-neutral">Member {idx + 2}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input placeholder="Full Name" value={member.name} onChange={e => {
                        const newMembers = [...formData.members]
                        newMembers[idx].name = e.target.value
                        setFormData({ ...formData, members: newMembers })
                      }} />
                    </div>
                    <div>
                      <Select value={member.gender} onChange={e => {
                        const newMembers = [...formData.members]
                        newMembers[idx].gender = e.target.value
                        setFormData({ ...formData, members: newMembers })
                      }}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                    <div>
                      <Input placeholder="Mobile Number" value={member.phone} onChange={e => {
                        const newMembers = [...formData.members]
                        newMembers[idx].phone = e.target.value
                        setFormData({ ...formData, members: newMembers })
                      }} />
                    </div>
                    <div>
                      <Input placeholder="Reg. No (PIET24CS...)" value={member.reg_no} onChange={e => {
                        const newMembers = [...formData.members]
                        newMembers[idx].reg_no = e.target.value.toUpperCase()
                        setFormData({ ...formData, members: newMembers })
                      }} />
                    </div>
                    <div className="md:col-span-2">
                      <Input placeholder="College Email (@piet.ac.in)" type="email" value={member.college_email} onChange={e => {
                        const newMembers = [...formData.members]
                        newMembers[idx].college_email = e.target.value
                        setFormData({ ...formData, members: newMembers })
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                className={`p-6 text-left border rounded-xl transition-colors ${formData.category === 'software' ? 'border-pine bg-pine/5 ring-1 ring-pine' : 'border-neutral/30 hover:border-pine/50'}`}
                onClick={() => setFormData({ ...formData, category: 'software', psId: '' })}
              >
                <h3 className="font-display text-xl font-semibold mb-2">Software</h3>
                <p className="text-sm text-neutral">Web, App, AI, ML, Blockchain, and cloud solutions.</p>
              </button>
              <button 
                className={`p-6 text-left border rounded-xl transition-colors ${formData.category === 'hardware' ? 'border-pine bg-pine/5 ring-1 ring-pine' : 'border-neutral/30 hover:border-pine/50'}`}
                onClick={() => setFormData({ ...formData, category: 'hardware', psId: '' })}
              >
                <h3 className="font-display text-xl font-semibold mb-2">Hardware</h3>
                <p className="text-sm text-neutral">IoT, Robotics, Drones, Sensors, and physical products.</p>
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Problem Statement</h2>
            <SearchSelect 
              value={formData.psId}
              onChange={(val) => setFormData({ ...formData, psId: val })}
              options={problemStatements}
              placeholder="Search by ID or Title..."
            />
            
            {formData.psId && (
              <div className="p-4 bg-neutral/5 rounded-lg border border-neutral/20 mt-4">
                <div className="font-mono text-sm text-pine font-medium mb-1">{formData.psId}</div>
                <div className="font-medium mb-2">{problemStatements.find(p => p.id === formData.psId)?.title}</div>
                <div className="text-sm text-neutral">{problemStatements.find(p => p.id === formData.psId)?.organization}</div>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review & Submit</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral">Team Name</span>
                <span className="font-medium">{formData.teamName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral">Category</span>
                <span className="font-medium capitalize">{formData.category}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral">Problem Statement</span>
                <span className="font-medium">{formData.psId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral">Leader</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-neutral">Members</span>
                <span className="font-medium">{formData.members.filter(m => m.name).length + 1} / 6</span>
              </div>
            </div>
            
            <div className="bg-ember/10 text-ember text-sm p-4 rounded-lg">
              Check everything carefully. You cannot edit members after submission.
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between pt-6 border-t border-neutral/10">
          <Button variant="ghost" onClick={prevStep} disabled={step === 1 || saving}>Back</Button>
          
          {step < 6 ? (
            <Button onClick={nextStep}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting...' : 'Confirm Registration'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
