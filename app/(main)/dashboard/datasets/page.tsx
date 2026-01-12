"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusIcon, FileIcon, Loader2Icon, DatabaseIcon } from "lucide-react"
import Link from "next/link"
import { UploadDialog } from "@/components/upload-dialog"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [publishOpen, setPublishOpen] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [pubName, setPubName] = useState("")
  const [pubTags, setPubTags] = useState("")
  const [pubDesc, setPubDesc] = useState("")
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('datasets')
          .select('id,name,created_at,source_type,file_path')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (data) {
          setDatasets(data)
        }
      } catch (error) {
        console.error('Error fetching datasets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDatasets()
  }, [supabase])

  const openPublish = (d: any) => {
    setSelected(d)
    setPubName(d.name || "")
    setPublishOpen(true)
  }
  const handlePublish = async () => {
    if (!selected) return
    let thumbnail_url: string | undefined
    if (thumbFile) {
      const path = `${selected.id}/${Date.now()}-${thumbFile.name}`
      const { data: up, error: upErr } = await supabase.storage.from("thumbnails").upload(path, thumbFile, {
        upsert: true,
      })
      if (!upErr && up) {
        const { data: pubUrl } = supabase.storage.from("thumbnails").getPublicUrl(up.path)
        thumbnail_url = pubUrl.publicUrl
      }
    }
    const tags = pubTags.split(",").map((t) => t.trim()).filter(Boolean)
    const { data, error } = await supabase
      .from("datasets")
      .update({
        is_published: true,
        publish_name: pubName,
        publish_tags: tags,
        publish_description: pubDesc,
        thumbnail_url,
      })
      .eq("id", selected.id)
      .select()
    if (!error) {
      setDatasets((list) => list.map((d) => (d.id === selected.id ? { ...d, is_published: true } : d)))
      setPublishOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight glow-text">Datasets</h2>
        <UploadDialog>
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_15px_rgba(128,149,216,0.5)]">
            <PlusIcon className="mr-2 h-4 w-4" /> Upload Dataset
          </Button>
        </UploadDialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Datasets</CardTitle>
          <CardDescription>
            Manage and edit your uploaded datasets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin" /> Loading datasets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : datasets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DatabaseIcon className="h-8 w-8 opacity-20" />
                      <p>No datasets found. Upload one to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium">
                      <FileIcon className="h-4 w-4" />
                    </TableCell>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>{dataset.source_type === 'file' ? 'Upload' : 'Import'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full border border-green-500/50 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-500">
                        Ready
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/editor/${dataset.id}`}>
                        <Button variant="ghost" size="sm">Open</Button>
                      </Link>
                      <Button variant="outline" size="sm" className="ml-2" onClick={() => openPublish(dataset)}>
                        Publish
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={async () => {
                          const confirm = window.confirm("Delete this dataset? This cannot be undone.")
                          if (!confirm) return
                          if (dataset.file_path) {
                            await supabase.storage.from("datasets").remove([dataset.file_path]).catch(() => {})
                          }
                          await supabase.from("datasets").delete().eq("id", dataset.id)
                          setDatasets((ds) => ds.filter((d) => d.id !== dataset.id))
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Dataset</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={pubName} onChange={(e) => setPubName(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={pubTags} onChange={(e) => setPubTags(e.target.value)} />
            <Textarea placeholder="Description (markdown supported)" value={pubDesc} onChange={(e) => setPubDesc(e.target.value)} />
            <div>
              <label className="text-sm">Thumbnail (required)</label>
              <Input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePublish} className="bg-primary text-primary-foreground">Publish</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
