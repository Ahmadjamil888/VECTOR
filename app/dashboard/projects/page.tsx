"use client"

import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const supabase = createClient()

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.from("projects").select("id,name,description,created_at").order("created_at", { ascending: false })
      setProjects(data || [])
    })()
  }, [supabase])

  const createProject = async () => {
    if (!name.trim()) return
    const { data, error } = await supabase.from("projects").insert({ name, description }).select().single()
    if (!error && data) {
      setProjects((p) => [data, ...p])
      setOpen(false)
      setName("")
      setDescription("")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold glow-text">Projects</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <PlusIcon className="mr-2 h-4 w-4" /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button onClick={createProject} className="bg-primary text-primary-foreground">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed border-muted rounded-lg text-center">
            <div className="p-4 rounded-full bg-muted/20 mb-4">
              <PlusIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Create your first project to start organizing your datasets and analysis workflows.
            </p>
            <Button variant="link" className="mt-4 text-primary">Create Project</Button>
          </div>
        ) : (
          projects.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-3">
                  <Link href={`/dashboard/datasets`}>
                    <Button variant="outline" size="sm">View Datasets</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
