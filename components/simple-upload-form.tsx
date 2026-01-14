"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileTextIcon, UploadIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function SimpleUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile && !name) {
      setName(selectedFile.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !name) {
      toast.error("Please provide a file and name")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to upload datasets")
        return
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      // Get file size
      const fileSizeMb = file.size / (1024 * 1024)

      // First, check if user has any projects, if not create a default one
      let projectId: string;
      const { data: existingProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (projectsError || !existingProjects || existingProjects.length === 0) {
        // Create default project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: 'My First Project',
            description: 'Default project for datasets'
          })
          .select('id')
          .single();
        
        if (projectError) {
          console.error('Project creation error:', projectError);
          toast.error("Failed to create project");
          return;
        }
        
        projectId = newProject.id;
      } else {
        projectId = existingProjects[0].id;
      }

      // Insert record into datasets table
      const { data: dataset, error: dbError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          project_id: projectId,
          name: name,
          file_path: uploadData.path,
          source_type: 'file',
          file_size_mb: fileSizeMb,
          row_count: 0, // Will be updated after processing
        })
        .select()
        .single()

      if (dbError) {
        console.error('DB error:', dbError)
        toast.error("Failed to create dataset record")
        return
      }

      toast.success("Dataset uploaded successfully!")
      setFile(null)
      setName("")
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5" />
          Upload Dataset
        </CardTitle>
        <CardDescription>
          Upload CSV, JSON, or Excel files to your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dataset Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter dataset name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileChange}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Uploading..." : "Upload Dataset"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}