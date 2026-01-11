"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UsagePage() {
  const supabase = createClient()
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0)
  const [storageUsedMb, setStorageUsedMb] = useState<number>(0)
  const [totalDatasets, setTotalDatasets] = useState<number>(0)
  const [publishedDatasets, setPublishedDatasets] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Fetch user profile through API route
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const profile = await response.json();
          setCreditsRemaining(profile?.credits_remaining || 0);
          setStorageUsedMb(profile?.storage_used_mb || 0);
        } else {
          console.error('Failed to fetch profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      
      const { count: td } = await supabase.from("datasets").select("*", { count: "exact", head: true }).eq("user_id", user.id)
      const { count: pd } = await supabase.from("datasets").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_published", true)
      setTotalDatasets(td || 0)
      setPublishedDatasets(pd || 0)
    })()
  }, [supabase])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="glow-box bg-card/50 border-muted">
        <CardHeader>
          <CardTitle>Credits Remaining</CardTitle>
          <CardDescription>Your available plan credits.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{creditsRemaining}</div>
        </CardContent>
      </Card>

      <Card className="glow-box bg-card/50 border-muted">
        <CardHeader>
          <CardTitle>Storage Used</CardTitle>
          <CardDescription>Total data uploaded.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{storageUsedMb} MB</div>
        </CardContent>
      </Card>

      <Card className="glow-box bg-card/50 border-muted">
        <CardHeader>
          <CardTitle>Your Datasets</CardTitle>
          <CardDescription>Total vs Published.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{totalDatasets}</div>
          <div className="text-sm text-muted-foreground mt-1">{publishedDatasets} published</div>
        </CardContent>
      </Card>
    </div>
  )
}
