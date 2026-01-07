"use client";

import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { DataGrid } from "@/components/data-grid";
import { Button } from "@/components/ui/button";
import { DownloadIcon, SaveIcon, Loader2Icon, PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

export default function EditorPage() {
  const [data, setData] = useState<any[]>([]);
  const [stagedData, setStagedData] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);
  const [datasetName, setDatasetName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [target, setTarget] = useState<"hf" | "kaggle">("hf");
  const [pubTitle, setPubTitle] = useState("");
  const [pubDesc, setPubDesc] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [kgUser, setKgUser] = useState("");
  const [kgKey, setKgKey] = useState("");
  const supabase = createClient();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const [filePath, setFilePath] = useState<string>("");
  const jsonToRows = (json: any) => {
    if (Array.isArray(json)) return json;
    if (json && typeof json === "object") {
      const keys = ["data", "rows", "items", "records", "dependencies", "packages"];
      for (const k of keys) {
        const v = json[k];
        if (Array.isArray(v)) return v;
        if (v && typeof v === "object") {
          return Object.entries(v).map(([key, value]) => {
            if (value && typeof value === "object") return { key, ...value as any };
            return { key, value };
          });
        }
      }
      return Object.entries(json).map(([key, value]) => {
        if (value && typeof value === "object") return { key, ...value as any };
        return { key, value };
      });
    }
    return [];
  };

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const { data: dataset, error: dbError } = await supabase
          .from('datasets')
          .select('id,name,file_path,source_type,created_at')
          .eq('id', id)
          .single();

        if (dbError) throw dbError;
        setDatasetName(dataset.name);
        setFilePath(dataset.file_path || "");

        if (dataset.file_path) {
          const { data: fileData, error: storageError } = await supabase
            .storage
            .from('datasets')
            .download(dataset.file_path);

          if (storageError) throw storageError;

          const text = await fileData.text();
          const ext = (dataset.file_path?.split('.').pop() || dataset.name?.split('.').pop() || "").toLowerCase();
          if (ext === 'csv') {
            Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                setData(results.data);
                setStagedData(results.data);
                setLoading(false);
              },
              error: (error: any) => {
                toast.error(`Parse error: ${error.message}`);
                setLoading(false);
              }
            });
          } else if (ext === 'json') {
            let parsed: any = [];
            try {
              const json = JSON.parse(text);
              parsed = jsonToRows(json);
            } catch (e: any) {
              toast.error("Invalid JSON file");
            }
            const rows = Array.isArray(parsed) ? parsed : [];
            setData(rows);
            setStagedData(rows);
            setLoading(false);
          } else {
             setLoading(false);
          }
        } else {
            setLoading(false);
        }

      } catch (error: any) {
        console.error('Error loading dataset:', error);
        toast.error("Failed to load dataset");
        setLoading(false);
      }
    };

    fetchDataset();
  }, [id]);

  const handleExport = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vector_export_${id}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dataset exported successfully");
  };

  const handleSave = async () => {
     toast.success("Changes saved (Metadata only)");
     if (data.length > 0) {
        await supabase
          .from('datasets')
          .update({ row_count: data.length })
          .eq('id', id);
     }
  };
  const handlePush = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")
      if (!filePath) throw new Error("Missing dataset file")
      const { data: fileData, error: storageError } = await supabase.storage.from("datasets").download(filePath)
      if (storageError) throw storageError
      const text = await fileData.text()
      const rows = Array.isArray(stagedData) && stagedData.length > 0 ? stagedData : JSON.parse(text)
      const endpoint = target === "hf" ? "/api/publish/hf" : "/api/publish/kaggle"
      const body: any = { title: pubTitle, description: pubDesc, rows }
      if (target === "hf") body.token = hfToken
      if (target === "kaggle") { body.username = kgUser; body.key = kgKey }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Publish failed")
      }
      await supabase.from("datasets").update({
        is_published: true,
        publish_name: pubTitle || datasetName,
        publish_description: pubDesc
      }).eq("id", id)
      toast.success("Published successfully")
      setShowPublish(false)
    } catch (e: any) {
      toast.error(e.message || "Publish failed")
    }
  }
  const acceptAllEdits = () => {
    setData(stagedData);
    setDirty(false);
    toast.success("All edits accepted");
  };
  const buildInitialPrompt = () => {
    return "your data is analyzed.";
  };
  const onGridChange = (next: any[]) => {
    setStagedData(next);
    setDirty(true);
  };
  const onChatProposeEdits = (next: any[]) => {
    setStagedData(next);
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dataset...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100vh] max-h-[100vh] gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold glow-text">Editing: {datasetName}</h2>
           <p className="text-sm text-muted-foreground">
             {stagedData.length} rows • {stagedData.length > 0 ? Object.keys(stagedData[0]).length : 0} columns
           </p>
        </div>
        <div className="flex gap-2 items-center">
          {dirty && (
            <Button variant="default" className="gap-2" onClick={acceptAllEdits}>
              Accept all edits
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => setShowChat((s) => !s)}>
            {showChat ? <PanelRightCloseIcon className="h-4 w-4" /> : <PanelRightOpenIcon className="h-4 w-4" />} Chat
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleSave}>
            <SaveIcon className="h-4 w-4" /> Save
          </Button>
          <Button variant="default" className="gap-2 bg-primary text-white shadow-[0_0_15px_rgba(128,149,216,0.5)]" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4" /> Export Dataset
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 gap-4 overflow-hidden border bg-background">
        <div className="flex-1 overflow-hidden p-2">
          <DataGrid data={stagedData} onChange={onGridChange} editable />
        </div>
        {showChat && (
          <div className="w-[420px] border-l h-full max-h-[100vh]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-2 border-b">
                <div className="text-sm font-medium">AI Assistant</div>
                <Button variant="outline" size="sm" onClick={() => setShowChat(false)}>Close</Button>
              </div>
              <div className="flex-1 min-h-0">
                <ChatInterface data={stagedData} onProposeEdits={onChatProposeEdits} initialPrompt={buildInitialPrompt()} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-4 right-4 flex gap-2">
        <Button variant="outline" onClick={() => setShowPublish(true)}>Publish</Button>
      </div>
      {showPublish && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-card border rounded-xl w-full max-w-lg p-6">
            <div className="text-lg font-medium mb-4">Publish to Hugging Face or Kaggle</div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button variant={target === "hf" ? "default" : "outline"} onClick={() => setTarget("hf")}>Hugging Face</Button>
              <Button variant={target === "kaggle" ? "default" : "outline"} onClick={() => setTarget("kaggle")}>Kaggle</Button>
            </div>
            <div className="space-y-3">
              <input className="w-full border rounded px-3 py-2 bg-background" placeholder="Title" value={pubTitle} onChange={(e) => setPubTitle(e.target.value)} />
              <textarea className="w-full border rounded px-3 py-2 bg-background" placeholder="Description" value={pubDesc} onChange={(e) => setPubDesc(e.target.value)} />
              {target === "hf" ? (
                <input className="w-full border rounded px-3 py-2 bg-background" placeholder="HF Token (hf_xxx)" value={hfToken} onChange={(e) => setHfToken(e.target.value)} />
              ) : (
                <>
                  <input className="w-full border rounded px-3 py-2 bg-background" placeholder="Kaggle Username" value={kgUser} onChange={(e) => setKgUser(e.target.value)} />
                  <input className="w-full border rounded px-3 py-2 bg-background" placeholder="Kaggle API Key" value={kgKey} onChange={(e) => setKgKey(e.target.value)} />
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowPublish(false)}>Cancel</Button>
                <Button onClick={handlePush}>Publish</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
