"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AnalyticsPage() {
  const [totalDatasets, setTotalDatasets] = useState(0)
  const [publishedDatasets, setPublishedDatasets] = useState(0)
  const [downloads, setDownloads] = useState(0)
  const [views, setViews] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { count: td } = await supabase.from("datasets").select("*", { count: "exact", head: true })
      const { count: pd } = await supabase.from("datasets").select("*", { count: "exact", head: true }).eq("is_published", true)
      const { count: dv } = await supabase.from("dataset_downloads").select("*", { count: "exact", head: true })
      const { count: vw } = await supabase.from("dataset_views").select("*", { count: "exact", head: true })
      setTotalDatasets(td || 0)
      setPublishedDatasets(pd || 0)
      setDownloads(dv || 0)
      setViews(vw || 0)
    })()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold glow-text">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 rounded-xl bg-card border border-border glow-box min-h-[140px]">
          <div className="text-sm text-muted-foreground">Total Datasets</div>
          <div className="text-3xl font-bold mt-2">{totalDatasets}</div>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border glow-box min-h-[140px]">
          <div className="text-sm text-muted-foreground">Published</div>
          <div className="text-3xl font-bold mt-2">{publishedDatasets}</div>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border glow-box min-h-[140px]">
          <div className="text-sm text-muted-foreground">Downloads</div>
          <div className="text-3xl font-bold mt-2">{downloads}</div>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border glow-box min-h-[140px]">
          <div className="text-sm text-muted-foreground">Views</div>
          <div className="text-3xl font-bold mt-2">{views}</div>
        </div>
      </div>
    </div>
  )
}
