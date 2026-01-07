"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function DatasetDetailPage() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  const [item, setItem] = useState<any | null>(null)
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from("datasets")
        .select("id,publish_name,publish_tags,publish_description,thumbnail_url,file_path")
        .eq("id", id)
        .single()
      setItem(data || null)
    })()
  }, [id])

  const download = async () => {
    if (!item?.file_path) return
    const { data, error } = await supabase.storage.from("datasets").download(item.file_path)
    if (!error && data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = item.publish_name || "dataset"
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (!item) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b p-3 text-xs text-muted-foreground font-mono">/datasets/{id}</div>
        <div className="p-6">
          <div className="flex gap-4 items-center mb-4">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={item.publish_name} className="w-24 h-24 object-cover rounded-md" />
            ) : null}
            <div>
              <h1 className="text-2xl font-bold glow-text">{item.publish_name}</h1>
              <div className="text-sm text-muted-foreground">{(item.publish_tags || []).join(", ")}</div>
            </div>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="font-mono whitespace-pre-wrap">{item.publish_description}</pre>
          </div>
          <div className="mt-6 flex gap-2">
            <Button onClick={download} className="bg-primary text-primary-foreground">Download</Button>
            <a href={`/dashboard/editor/${id}`}>
              <Button variant="outline">Edit with AI</Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
