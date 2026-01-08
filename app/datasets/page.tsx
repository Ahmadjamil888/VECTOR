"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PublicDatasetsPage() {
  const [items, setItems] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from("datasets")
        .select("id,publish_name,publish_tags,thumbnail_url")
        .eq("is_published", true)
        .order("publish_name", { ascending: true })
      setItems(data || [])
    })()
  }, [supabase])

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <div className="rounded-xl border bg-card">
          <div className="border-b p-3 text-xs text-muted-foreground font-mono">/public/datasets</div>
          <div className="p-6 font-mono text-sm">
            $ ls datasets
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((d) => (
          <Link key={d.id} href={`/datasets/${d.id}`}>
            <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{d.publish_name}</CardTitle>
              </CardHeader>
              <CardContent>
                {d.thumbnail_url ? (
                  <img src={d.thumbnail_url} alt={d.publish_name} className="rounded-md w-full h-32 object-cover mb-3" />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {(d.publish_tags || []).map((t: string, i: number) => (
                    <Badge key={i} variant="outline">{t}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
