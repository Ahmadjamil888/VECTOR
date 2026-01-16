'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, File, X, CheckCircle } from 'lucide-react'
import { DatasetService } from '@/lib/dataset-service'
import { toast } from 'sonner'

interface FileUploadProps {
  userId: string
  onUploadComplete?: (datasetId: string) => void
  className?: string
}

export function FileUpload({ userId, onUploadComplete, className }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = [
    'text/csv',
    'application/json',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  const maxSize = 100 * 1024 * 1024 // 100MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Reset states
    setError(null)
    setSuccess(false)

    // Validate file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload CSV, JSON, or text files.')
      setFile(null)
      return
    }

    // Validate file size
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 100MB limit.')
      setFile(null)
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      const event = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFileChange(event)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const dataset = await DatasetService.createDataset({
        name: file.name.replace(/\.[^/.]+$/, ""),
        user_id: userId,
        file: file,
        source_type: 'file'
      })

      setSuccess(true)
      toast.success('Dataset uploaded successfully!')
      
      if (onUploadComplete) {
        onUploadComplete(dataset.id)
      }

      // Reset form after delay
      setTimeout(() => {
        removeFile()
        setSuccess(false)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      toast.error('Failed to upload dataset')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Dataset
        </CardTitle>
        <CardDescription>
          Upload CSV, JSON, or text files (Max 100MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
            <p className="text-sm text-muted-foreground">
              Supports CSV, JSON, and text files up to 100MB
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={removeFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>File uploaded successfully!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={uploadFile}
                disabled={uploading || success}
                className="flex-1"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
              <Button
                variant="outline"
                onClick={removeFile}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}