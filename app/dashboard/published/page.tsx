"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileIcon, Loader2Icon, DatabaseIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function PublishedPage() {
  const supabase = createClient()
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDatasets([])
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from("datasets")
        .select("id,name,is_published,publish_name,publish_tags,created_at")
        .eq("user_id", user.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
      setDatasets(data || [])
      setLoading(false)
    })()
  }, [supabase])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight glow-text">Published</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Published Datasets</CardTitle>
          <CardDescription>Datasets visible to others.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Published As</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2Icon className="h-4 w-4 animate-spin" /> Loading published datasets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : datasets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DatabaseIcon className="h-8 w-8 opacity-20" />
                      <p>No published datasets found.</p>
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
                    <TableCell className="font-medium">{dataset.publish_name || "-"}</TableCell>
                    <TableCell>{(dataset.publish_tags || []).join(", ")}</TableCell>
                    <TableCell className="text-right">
                      {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/datasets/${dataset.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <Link href={`/dashboard/editor/${dataset.id}`}>
                        <Button variant="ghost" size="sm" className="ml-2">Edit</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
