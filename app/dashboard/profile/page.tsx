'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from 'sonner'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setEmail(user.email || '')
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setProfile(profile)
          setFullName(profile.full_name || '')
        }
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleUpdate = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Error updating profile')
      console.error(error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold glow-text">Your Profile</h1>
      
      <Card className="glow-box bg-card/50">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Manage your public profile and account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-primary shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-lg bg-primary/20 text-primary">
                {fullName?.[0] || email?.[0] || 'V'}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline">Change Avatar</Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullname">Full Name</Label>
            <Input 
              id="fullname" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              className="bg-background/50 border-primary/30 focus:border-primary focus:ring-primary"
            />
          </div>

          <div className="pt-4">
            <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/90 text-white dark:text-black shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/30 border-muted">
        <CardHeader>
          <CardTitle>Account Usage</CardTitle>
          <CardDescription>Your current plan usage statistics.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="text-sm font-medium text-muted-foreground">Credits Remaining</div>
            <div className="text-2xl font-bold text-primary">{profile?.credits_remaining || 0}</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <div className="text-sm font-medium text-muted-foreground">Storage Used</div>
            <div className="text-2xl font-bold text-primary">{profile?.storage_used_mb || 0} MB</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
