"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  PlayIcon, 
  SaveIcon, 
  DownloadIcon, 
  HistoryIcon, 
  UndoIcon, 
  RedoIcon 
} from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";

interface Dataset {
  id: string;
  name: string;
  file_path: string;
  row_count: number;
  file_size_mb: number;
  created_at: string;
}

interface EditHistory {
  id: string;
  timestamp: string;
  changes: string;
  snapshot: string;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;
  
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const [currentVersion, setCurrentVersion] = useState(0);

  const parseCSV = useCallback((csvText: string) => {
    Papa.parse(csvText, {
      complete: (results: any) => {
        if (results.data.length > 0) {
          setHeaders(results.data[0] as string[]);
          setParsedData(results.data.slice(1) as any[][]);
        }
      },
      skipEmptyLines: true
    });
  }, [setHeaders, setParsedData]);

  const loadData = useCallback(async (filePath: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/data`);
      if (response.ok) {
        const text = await response.text();
        setRawData(text);
        parseCSV(text);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [datasetId, parseCSV]);

  const fetchDataset = useCallback(async () => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}`);
      if (response.ok) {
        const data = await response.json();
        setDataset(data);
        await loadData(data.file_path);
      }
    } catch (error) {
      console.error('Error fetching dataset:', error);
      toast.error('Failed to load dataset');
    } finally {
      setLoading(false);
    }
  }, [datasetId, loadData]);

  useEffect(() => {
    if (datasetId) {
      fetchDataset();
    }
  }, [datasetId, fetchDataset]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert parsed data back to CSV
      const csvData = [headers, ...parsedData];
      const csvString = Papa.unparse(csvData);
      
      const response = await fetch(`/api/datasets/${datasetId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: csvString }),
      });

      if (response.ok) {
        toast.success('Dataset saved successfully');
        // Add to edit history
        const newHistoryItem: EditHistory = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          changes: `Saved version ${editHistory.length + 1}`,
          snapshot: csvString
        };
        setEditHistory([...editHistory, newHistoryItem]);
        setCurrentVersion(editHistory.length);
      } else {
        toast.error('Failed to save dataset');
      }
    } catch (error) {
      console.error('Error saving dataset:', error);
      toast.error('Failed to save dataset');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    const csvData = [headers, ...parsedData];
    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset?.name || 'dataset'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('Dataset downloaded');
  };

  const handleUndo = () => {
    if (currentVersion > 0) {
      const prevVersion = currentVersion - 1;
      setCurrentVersion(prevVersion);
      const snapshot = editHistory[prevVersion].snapshot;
      parseCSV(snapshot);
      toast.success(`Reverted to version ${prevVersion + 1}`);
    }
  };

  const handleRedo = () => {
    if (currentVersion < editHistory.length - 1) {
      const nextVersion = currentVersion + 1;
      setCurrentVersion(nextVersion);
      const snapshot = editHistory[nextVersion].snapshot;
      parseCSV(snapshot);
      toast.success(`Restored to version ${nextVersion + 1}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Dataset not found</h2>
        <p className="text-muted-foreground mt-2">
          The dataset you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/datasets')}>
          Back to Datasets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{dataset.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{dataset.row_count?.toLocaleString()} rows</span>
            <span>{dataset.file_size_mb?.toFixed(2)} MB</span>
            <Badge variant="secondary">Editing</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleUndo}
            disabled={currentVersion === 0}
          >
            <UndoIcon className="mr-2 h-4 w-4" />
            Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRedo}
            disabled={currentVersion >= editHistory.length - 1}
          >
            <RedoIcon className="mr-2 h-4 w-4" />
            Redo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
          >
            <HistoryIcon className="mr-2 h-4 w-4" />
            History
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownload}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Data Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Data Editor</CardTitle>
              <CardDescription>
                Edit your dataset directly in the browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={rawData}
                onChange={(e) => {
                  setRawData(e.target.value);
                  parseCSV(e.target.value);
                }}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Paste your CSV data here..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Column Operations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Column Operations</CardTitle>
              <CardDescription>
                Transform your data columns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Column</label>
                <select className="w-full p-2 border rounded text-sm">
                  <option value="">Choose a column</option>
                  {headers.map((header, index) => (
                    <option key={index} value={index.toString()}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  Normalize Headers
                </Button>
                <Button className="w-full" variant="outline">
                  Remove Duplicates
                </Button>
                <Button className="w-full" variant="outline">
                  Fill Missing Values
                </Button>
                <Button className="w-full" variant="outline">
                  Convert Data Types
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                First 5 rows of your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedData.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {headers.map((header, index) => (
                          <th key={index} className="text-left p-2 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-2 border-b truncate max-w-[100px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of your dataset
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {editHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No edit history available
              </p>
            ) : (
              <div className="space-y-3">
                {editHistory.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      index === currentVersion 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      setCurrentVersion(index);
                      parseCSV(item.snapshot);
                      setIsHistoryOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Version {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.changes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}