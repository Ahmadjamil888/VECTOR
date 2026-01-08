"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, UploadCloudIcon, DatabaseIcon, ActivityIcon } from "lucide-react"
import Link from "next/link"
import { UploadDialog } from "@/components/upload-dialog"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [storageUsedMb, setStorageUsedMb] = useState(0)
  const [datasetCount, setDatasetCount] = useState(0)
  const [tier, setTier] = useState<string>("free")
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: datasetsData } = await supabase
          .from('datasets')
          .select('id,name,created_at,file_size_mb,source_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (datasetsData) {
          setDatasets(datasetsData)
        }

        // Get total stats
        const { count } = await supabase
          .from('datasets')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        
        setDatasetCount(count || 0)

        // Calculate storage used (sum of file_size_mb)
        const { data: allDatasets } = await supabase
            .from('datasets')
            .select('file_size_mb')
            .eq('user_id', user.id)
        
        const totalMb = allDatasets?.reduce((acc, curr) => acc + (curr.file_size_mb || 0), 0) || 0
        setStorageUsedMb(Number(totalMb.toFixed(3)))
        await supabase.from("profiles").update({ storage_used_mb: Number(totalMb.toFixed(3)) }).eq("id", user.id)

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .single()
        setTier(profile?.subscription_tier || "free")

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const storageLimitMb = tier === "pro" ? 10240 : tier === "premium" || tier === "enterprise" ? 1048576 : 100
  const storagePercentage = Math.min((storageUsedMb / storageLimitMb) * 100, 100)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="col-span-4 glow-box bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-3xl font-bold glow-text">Welcome to Vector</CardTitle>
          <CardDescription>
            Your AI-powered data science platform. Upload your datasets and let our AI handle the cleaning and processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDialog>
             <Button className="gap-2 bg-primary hover:bg-primary/80 text-white dark:text-black shadow-[0_0_15px_rgba(128,149,216,0.5)]">
               <PlusIcon className="h-4 w-4" /> Create New Project
             </Button>
          </UploadDialog>
        </CardContent>
      </Card>
      
      <Card className="col-span-2 md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Datasets</CardTitle>
          <CardDescription>Pick up where you left off.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col gap-4">
             {loading ? (
                <>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </>
             ) : datasets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DatabaseIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>No datasets found</p>
                  <p className="text-xs">Upload your first dataset to get started</p>
                </div>
             ) : (
                datasets.map((dataset) => (
                 <Link key={dataset.id} href={`/dashboard/editor/${dataset.id}`}>
                   <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-md text-primary group-hover:bg-primary/30 transition-colors">
                          <UploadCloudIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{dataset.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                         {(dataset.file_size_mb ?? 0).toFixed(3)} MB
                      </div>
                   </div>
                 </Link>
                ))
             )}
           </div>
        </CardContent>
      </Card>
      
       <Card className="col-span-2 md:col-span-2">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Platform health and quota.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="flex items-center gap-2"><DatabaseIcon className="h-4 w-4 text-primary" /> Storage Used</span>
                <span>{storagePercentage.toFixed(1)}% ({storageUsedMb.toFixed(3)} MB)</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                   className="h-full bg-primary transition-all duration-1000 ease-out" 
                   style={{ width: `${storagePercentage}%` }} 
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">Limit: {storageLimitMb} MB ({tier})</p>
            </div>
             
             <div className="space-y-2">
               <div className="flex justify-between text-sm font-medium">
                 <span className="flex items-center gap-2"><ActivityIcon className="h-4 w-4 text-primary" /> Active Projects</span>
                 <span>{datasetCount}</span>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold">{datasetCount}</div>
                    <div className="text-xs text-muted-foreground">Total Datasets</div>
                 </div>
                 <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                    <div className="text-2xl font-bold text-black-500">99.9%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                 </div>
               </div>
             </div>
           </div>
        </CardContent>
      </Card>
    </div>
  )
}
