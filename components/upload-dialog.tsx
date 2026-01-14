"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloudIcon, LinkIcon, Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Papa from "papaparse"

export function UploadDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [kaggleUrl, setKaggleUrl] = useState("")
  const [hfUrl, setHfUrl] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0])
    }
  }

  const getTierLimitMb = (tier?: string) => {
    if (tier === "pro") return 10240
    if (tier === "premium" || tier === "enterprise") return 1048576
    return 100
  }
  const getUsageMb = async (uid: string) => {
    const { data } = await supabase.from("datasets").select("file_size_mb").eq("user_id", uid)
    const total = data?.reduce((acc, curr) => acc + (curr.file_size_mb || 0), 0) || 0
    return Number(total.toFixed(3))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    }
  })

  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    
    setIsLoading(true)
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to upload datasets");
        return;
      }
      // Fetch user profile through API route
      let subscriptionTier = 'free';
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const profile = await response.json();
          subscriptionTier = profile?.subscription_tier || 'free';
        } else {
          console.error('Failed to fetch profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      
      const usedMb = await getUsageMb(user.id)
      const incomingMb = Number((file.size / 1024 / 1024).toFixed(3))
      const limitMb = getTierLimitMb(subscriptionTier)
      if (usedMb + incomingMb > limitMb) {
        toast.error("Storage limit reached on Free plan (100MB). Upgrade to add more.")
        setIsOpen(false)
        router.push("/dashboard/subscription")
        return;
      }

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 2. Parse file content (preview)
      const text = await file.text();
      let rowCount = 0;
      
      if (fileExt === 'csv') {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rowCount = result.data.length;
      } else if (fileExt === 'json') {
        const json = JSON.parse(text);
        rowCount = Array.isArray(json) ? json.length : 0;
      }

      // 3. Insert record into datasets table
      const { data: dataset, error: dbError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: file.name,
          file_path: fileName,
          source_type: 'file',
          row_count: rowCount,
          file_size_mb: Number((file.size / 1024 / 1024).toFixed(3)),
          metadata: { ext: fileExt }
        })
        .select()
        .single();

      if (dbError) {
        console.error('DB error:', dbError);
        throw new Error(`Database record creation failed`);
      }
      const newUsed = await getUsageMb(user.id)
      await supabase.from("profiles").update({ storage_used_mb: newUsed }).eq("id", user.id)

      const updatedUsed = await getUsageMb(user.id)
      // Update user profile through API route
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            storage_used_mb: updatedUsed
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to update profile:', response.status);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
      
      toast.success("Dataset uploaded successfully");
      setIsOpen(false);
      router.push(`/dashboard/advanced-editor/${dataset.id}`);

    } catch (error: any) {
      console.error('Full error:', error);
      toast.error(error.message || "Something went wrong during upload");
    } finally {
      setIsLoading(false)
    }
  }
  
  const [kaggleUsername, setKaggleUsername] = useState("")
  const [kaggleKeyInput, setKaggleKeyInput] = useState("")
  const [hfTokenInput, setHfTokenInput] = useState("")

  const handleUrlImport = async (type: 'kaggle' | 'hf') => {
      setIsLoading(true)
      const url = type === 'kaggle' ? kaggleUrl : hfUrl;
      
      try {
         const { data: { user } } = await supabase.auth.getUser()
         if (!user) throw new Error("User not found")
         // Fetch user profile through API route
         let subscriptionTier = 'free';
         try {
           const response = await fetch('/api/user/profile', {
             method: 'GET',
             credentials: 'include',
           });
           
           if (response.ok) {
             const profile = await response.json();
             subscriptionTier = profile?.subscription_tier || 'free';
           } else {
             console.error('Failed to fetch profile:', response.status);
           }
         } catch (error) {
           console.error('Error fetching profile:', error);
         }
         const endpoint = type === 'kaggle' ? "/api/import/kaggle" : "/api/import/hf"
         const body: any = { url }
         if (type === 'kaggle') {
           if (kaggleUsername) body.username = kaggleUsername
           if (kaggleKeyInput) body.key = kaggleKeyInput
         }
         if (type === 'hf' && hfTokenInput) {
           body.token = hfTokenInput
         }
         const res = await fetch(endpoint, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(body)
         })
         if (!res.ok) {
           const j = await res.json().catch(() => ({}))
           throw new Error(j.error || "Import failed")
         }
         const payload = await res.json()
         const rows = Array.isArray(payload.data) ? payload.data : []
         const blob = new Blob([JSON.stringify(rows)], { type: "application/json" })
         const incomingMb = Number((blob.size / 1024 / 1024).toFixed(3))
         const usedMb = await getUsageMb(user.id)
         const limitMb = getTierLimitMb(subscriptionTier)
         if (usedMb + incomingMb > limitMb) {
           toast.error("Storage limit reached on Free plan (100MB). Upgrade to add more.")
           setIsOpen(false)
           router.push("/dashboard/subscription")
           return;
         }
         
         const storagePath = `${user.id}/${Date.now()}_${type}_import.json`
         const { error: upErr } = await supabase.storage.from("datasets").upload(storagePath, blob)
         if (upErr) throw upErr

         const { data: dataset, error: dbError } = await supabase
            .from('datasets')
            .insert({
              user_id: user.id,
              name: type === 'kaggle' ? 'Kaggle Dataset' : 'Hugging Face Dataset',
              source_type: type === 'kaggle' ? 'kaggle' : 'huggingface',
              source_url: url,
              file_path: storagePath,
              row_count: rows.length,
              file_size_mb: Number((blob.size / 1024 / 1024).toFixed(3))
            })
            .select()
            .single()
         if (dbError) throw dbError
         const newUsed = await getUsageMb(user.id)
         // Update user profile through API route
         try {
           const updateResponse = await fetch('/api/user/profile', {
             method: 'PUT',
             headers: {
               'Content-Type': 'application/json',
             },
             credentials: 'include',
             body: JSON.stringify({
               storage_used_mb: newUsed
             }),
           });
           
           if (!updateResponse.ok) {
             console.error('Failed to update profile:', updateResponse.status);
           }
         } catch (updateError) {
           console.error('Error updating profile:', updateError);
         }
         
         toast.success("Dataset imported successfully")
         setIsOpen(false)
         router.push(`/dashboard/advanced-editor/${dataset.id}`)
         
      } catch (error: any) {
          toast.error(`Import failed: ${error.message}`)
      } finally {
          setIsLoading(false)
      }
  }

  const [siteUrl, setSiteUrl] = useState("")
  const handleSiteExtract = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")
      // Fetch user profile through API route
      let subscriptionTier = 'free';
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const profile = await response.json();
          subscriptionTier = profile?.subscription_tier || 'free';
        } else {
          console.error('Failed to fetch profile:', response.status);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      const res = await fetch("/api/import/site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Site extraction failed")
      }
      const payload = await res.json()
      const rows = Array.isArray(payload.data) ? payload.data : []
      const blob = new Blob([JSON.stringify(rows)], { type: "application/json" })
      const incomingMb = Number((blob.size / 1024 / 1024).toFixed(3))
      const usedMb = await getUsageMb(user.id)
      const limitMb = getTierLimitMb(subscriptionTier)
      if (usedMb + incomingMb > limitMb) {
        toast.error("Storage limit reached on Free plan (100MB). Upgrade to add more.")
        setIsOpen(false)
        router.push("/dashboard/subscription")
        return;
      }
      const storagePath = `${user.id}/${Date.now()}_site_extract.json`
      const { error: upErr } = await supabase.storage.from("datasets").upload(storagePath, blob)
      if (upErr) throw upErr
      const { data: dataset, error: dbError } = await supabase
        .from("datasets")
        .insert({
          user_id: user.id,
          name: "Site Extract",
          source_type: "google_storage",
          source_url: siteUrl,
          file_path: storagePath,
          row_count: rows.length,
          file_size_mb: Number((blob.size / 1024 / 1024).toFixed(3))
        })
        .select()
        .single()
      if (dbError) throw dbError
      const finalUsed = await getUsageMb(user.id)
      // Update user profile through API route
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            storage_used_mb: finalUsed
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to update profile:', response.status);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
      toast.success("Site extracted into dataset")
      setIsOpen(false)
      router.push(`/dashboard/advanced-editor/${dataset.id}`)
    } catch (e: any) {
      toast.error(e.message || "Extraction failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle>Import Dataset</DialogTitle>
          <DialogDescription>
            Upload a file or import from Kaggle/Hugging Face to get started.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="kaggle">Kaggle</TabsTrigger>
            <TabsTrigger value="hf">Hugging Face</TabsTrigger>
            <TabsTrigger value="site">Website</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <div 
              {...getRootProps()} 
              className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
              `}
            >
              <input {...getInputProps()} />
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <UploadCloudIcon className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">CSV, JSON (max 50MB)</p>
            </div>
          </TabsContent>
          
          <TabsContent value="kaggle" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Kaggle Dataset URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="https://www.kaggle.com/datasets/..." 
                    className="pl-9" 
                    value={kaggleUrl}
                    onChange={(e) => setKaggleUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kaggle Username</Label>
                <Input 
                  placeholder="your-username" 
                  value={kaggleUsername}
                  onChange={(e) => setKaggleUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kaggle API Key</Label>
                <Input 
                  placeholder="your-api-key" 
                  value={kaggleKeyInput}
                  onChange={(e) => setKaggleKeyInput(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={() => handleUrlImport('kaggle')} disabled={isLoading || !kaggleUrl}>
              {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Import from Kaggle
            </Button>
          </TabsContent>
          
          <TabsContent value="hf" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Hugging Face Dataset URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="https://huggingface.co/datasets/..." 
                    className="pl-9"
                    value={hfUrl}
                    onChange={(e) => setHfUrl(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>HF Token (optional)</Label>
              <Input 
                placeholder="hf_xxx" 
                value={hfTokenInput}
                onChange={(e) => setHfTokenInput(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => handleUrlImport('hf')} disabled={isLoading || !hfUrl}>
              {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Import from Hugging Face
            </Button>
          </TabsContent>
          
          <TabsContent value="site" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Website URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="https://example.com" 
                  className="pl-9"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSiteExtract} disabled={isLoading || !siteUrl}>
              {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : null}
              Extract into Dataset
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
