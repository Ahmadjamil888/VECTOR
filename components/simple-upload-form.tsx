"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileTextIcon, UploadIcon, XIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function SimpleUploadForm() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': [".csv"],
      'application/json': [".json"],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [".xlsx"],
      'application/vnd.ms-excel': [".xls"]
    },
    maxFiles: 5
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }



  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("You must be logged in to upload datasets")
        return
      }

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

      // Upload all files
      const uploadPromises = files.map(async (file) => {
        // Upload file to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${file.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('datasets')
          .upload(fileName, file)

        if (uploadError) {
          throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`)
        }

        // Get file size
        const fileSizeMb = file.size / (1024 * 1024)

        // Insert record into datasets table
        const { data: dataset, error: dbError } = await supabase
          .from('datasets')
          .insert({
            user_id: user.id,
            project_id: projectId,
            name: file.name.replace(/\.[^/.]+$/, ""),
            file_path: uploadData.path,
            source_type: 'file',
            file_size_mb: fileSizeMb,
            row_count: 0,
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(`Database error for ${file.name}: ${dbError.message}`)
        }

        return dataset
      })

      await Promise.all(uploadPromises)
      
      toast.success(`${files.length} dataset(s) uploaded successfully!`)
      setFiles([])
      
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || "Something went wrong during upload")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5" />
          Upload Datasets
        </CardTitle>
        <CardDescription>
          Drag & drop or click to select CSV, JSON, or Excel files (max 5 files)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select files'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports CSV, JSON, XLSX, XLS files
          </p>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Files:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8"
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          className="w-full"
          disabled={loading || files.length === 0}
        >
          {loading ? "Uploading..." : `Upload ${files.length} File(s)`}
        </Button>
      </CardContent>
    </Card>
  )
}