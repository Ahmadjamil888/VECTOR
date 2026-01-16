"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, DownloadIcon, ShareIcon } from "lucide-react";
import { toast } from "sonner";
import { getDatasetsByUserId } from "@/lib/db/services";
import { createClient } from "@/lib/supabase/client";

interface PublishedDataset {
  id: string;
  name: string;
  publish_name: string;
  publish_description: string;
  publish_tags: string[];
  row_count: number;
  file_size_mb: number;
  created_at: string;
  view_count: number;
  download_count: number;
  thumbnail_url: string;
}

export default function PublishedPage() {
  const [publishedDatasets, setPublishedDatasets] = useState<PublishedDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPublishedDatasets();
  }, []);

  const fetchPublishedDatasets = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const allDatasets = await getDatasetsByUserId(user.id);
      
      // Filter only published datasets
      const publishedData = allDatasets.filter(ds => ds.is_published);
      
      // Transform the data to match the PublishedDataset interface
      const transformedData = publishedData.map(ds => ({
        id: ds.id,
        name: ds.name,
        publish_name: ds.name, // Using the dataset name as publish name
        publish_description: ds.description || `Dataset: ${ds.name}`, // Using description field if available
        publish_tags: ds.tags || [], // Assuming tags field exists
        row_count: ds.row_count || 0,
        file_size_mb: ds.file_size_mb || 0,
        created_at: ds.created_at,
        view_count: ds.view_count || 0,
        download_count: ds.download_count || 0,
        thumbnail_url: ds.thumbnail_url || '',
      }));

      setPublishedDatasets(transformedData as PublishedDataset[]);
    } catch (error) {
      console.error('Error fetching published datasets:', error);
      toast.error('Failed to load published datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDataset = (id: string) => {
    // Navigate to dataset viewer
    window.open(`/datasets/${id}`, '_blank');
  };

  const handleDownloadDataset = async (id: string) => {
    try {
      const response = await fetch(`/api/published/${id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset-${id}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Dataset downloaded successfully');
        
        // Refresh counts
        fetchPublishedDatasets();
      }
    } catch (error) {
      console.error('Error downloading dataset:', error);
      toast.error('Failed to download dataset');
    }
  };

  const handleShareDataset = (id: string) => {
    const shareUrl = `${window.location.origin}/datasets/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Published Datasets</h1>
        <p className="text-muted-foreground mt-2">
          Datasets you&apos;ve shared with the community
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {publishedDatasets.map((dataset) => (
          <Card key={dataset.id} className="overflow-hidden">
            {dataset.thumbnail_url && (
              <div className="h-32 bg-muted relative">
                <Image 
                  src={dataset.thumbnail_url} 
                  alt={dataset.publish_name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{dataset.publish_name}</CardTitle>
              <CardDescription>{dataset.publish_description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {dataset.publish_tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Rows:</span>
                    <span className="ml-1 font-medium">{dataset.row_count?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <span className="ml-1 font-medium">{dataset.file_size_mb?.toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Views:</span>
                    <span className="ml-1 font-medium">{dataset.view_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Downloads:</span>
                    <span className="ml-1 font-medium">{dataset.download_count || 0}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDataset(dataset.id)}
                  >
                    <EyeIcon className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadDataset(dataset.id)}
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleShareDataset(dataset.id)}
                  >
                    <ShareIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {publishedDatasets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <ShareIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No published datasets</h3>
            <p className="mt-2 text-muted-foreground">
              Publish your datasets to share them with the community
            </p>
            <Button className="mt-4">Publish Dataset</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}