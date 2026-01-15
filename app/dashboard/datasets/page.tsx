"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { UploadIcon, TrashIcon, EditIcon, EyeIcon } from "lucide-react";
import { toast } from "sonner";
import { listDatasetsService, createDatasetService, deleteDatasetService } from "@/lib/adk/dataset-service";

interface Dataset {
  id: string;
  name: string;
  file_path: string;
  source_type: string;
  row_count: number;
  file_size_mb: number;
  created_at: string;
  is_published: boolean;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: "",
    source_type: "file",
    file: null as File | null
  });

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const data = await listDatasetsService();
      setDatasets(data);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDataset = async () => {
    if (!newDataset.name) {
      toast.error('Please enter a dataset name');
      return;
    }

    try {
      await createDatasetService(newDataset.name, newDataset.source_type);
      toast.success('Dataset created successfully');
      setIsCreateDialogOpen(false);
      setNewDataset({ name: "", source_type: "file", file: null });
      fetchDatasets();
    } catch (error) {
      console.error('Error creating dataset:', error);
      toast.error('Failed to create dataset');
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return;

    try {
      await deleteDatasetService(id);
      toast.success('Dataset deleted successfully');
      fetchDatasets();
    } catch (error) {
      console.error('Error deleting dataset:', error);
      toast.error('Failed to delete dataset');
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Datasets</h1>
          <p className="text-muted-foreground mt-2">
            Manage and organize your data collections
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload Dataset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dataset</DialogTitle>
              <DialogDescription>
                Upload a new dataset or connect from external sources
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Dataset Name</Label>
                <Input
                  id="name"
                  value={newDataset.name}
                  onChange={(e) => setNewDataset({...newDataset, name: e.target.value})}
                  placeholder="Enter dataset name"
                />
              </div>
              <div>
                <Label htmlFor="source">Source Type</Label>
                <select
                  id="source"
                  className="w-full p-2 border rounded"
                  value={newDataset.source_type}
                  onChange={(e) => setNewDataset({...newDataset, source_type: e.target.value})}
                >
                  <option value="file">Local File</option>
                  <option value="kaggle">Kaggle</option>
                  <option value="huggingface">Hugging Face</option>
                  <option value="google_storage">Google Storage</option>
                </select>
              </div>
              {newDataset.source_type === "file" && (
                <div>
                  <Label htmlFor="file">Upload File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.json,.xlsx"
                    onChange={(e) => setNewDataset({...newDataset, file: e.target.files?.[0] || null})}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDataset}>Create Dataset</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datasets ({datasets.length})</CardTitle>
          <CardDescription>
            All your uploaded and managed datasets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <div className="text-center py-12">
              <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No datasets yet</h3>
              <p className="mt-2 text-muted-foreground">
                Get started by uploading your first dataset
              </p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Upload Dataset
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>
                      <span className="capitalize">{dataset.source_type}</span>
                    </TableCell>
                    <TableCell>{dataset.row_count?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>{dataset.file_size_mb ? `${dataset.file_size_mb.toFixed(2)} MB` : 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        dataset.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dataset.is_published ? 'Published' : 'Private'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDataset(dataset.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}