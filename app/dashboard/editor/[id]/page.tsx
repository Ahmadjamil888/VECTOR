"use client";

import { useEffect, useState, useRef } from "react";
import { DataGrid } from "@/components/data-grid";
import { SimpleChatSidebar } from "@/components/SimpleChatSidebar";
import { Button } from "@/components/ui/button";
import { DownloadIcon, SaveIcon, Loader2Icon, SendIcon, SparklesIcon, CheckIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

// AI Sidebar Component - Matches your design theme
function AISidebar({ 
  data, 
  onDataTransform,
  isOpen,
  onToggle
}: { 
  data: any[], 
  onDataTransform: (newData: any[], message: string) => void,
  isOpen: boolean,
  onToggle: () => void
}) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzePromptAndTransform = async (prompt: string) => {
    setIsProcessing(true);
    
    try {
      // Send the prompt to our backend API
      const response = await fetch('/api/chat-with-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          datasetId: 'temp' // Use a temporary ID for chat purposes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request with AI');
      }

      const result = await response.json();
      
      // Display the AI response
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      
      // Note: Actual data transformation would happen separately
      
    } catch (error: any) {
      console.error("AI request error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please try rephrasing your request.` 
      }]);
      toast.error("AI request failed");
    } finally {
      setIsProcessing(false);
    }
  };



  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    await analyzePromptAndTransform(userMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 border-r bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <SparklesIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Transform your data</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle}>
          <PanelLeftCloseIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-12 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <SparklesIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Ready to transform</p>
              <p className="text-xs">Try these commands:</p>
            </div>
            <div className="space-y-2 text-left max-w-xs mx-auto">
              <div className="p-3 bg-muted/50 rounded-lg border text-xs hover:bg-muted transition-colors">
                Sort by age descending
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border text-xs hover:bg-muted transition-colors">
                Remove rows where price &lt; 10
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border text-xs hover:bg-muted transition-colors">
                Add column called total
              </div>
            </div>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'bg-muted border'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted border rounded-lg px-4 py-2.5 flex items-center gap-2">
              <Loader2Icon className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm">Analyzing and transforming...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Describe transformation..."
            className="flex-1 px-4 py-2.5 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            disabled={isProcessing}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-4 shadow-lg shadow-primary/20"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Editor Component
export default function EditorPage() {
  const [data, setData] = useState<any[]>([]);
  const [stagedData, setStagedData] = useState<any[]>([]);
  const [dirty, setDirty] = useState(false);
  const [datasetName, setDatasetName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [target, setTarget] = useState<"hf" | "kaggle">("hf");
  const [pubTitle, setPubTitle] = useState("");
  const [pubDesc, setPubDesc] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [kgUser, setKgUser] = useState("");
  const [kgKey, setKgKey] = useState("");
  const [pendingChanges, setPendingChanges] = useState<string[]>([]);
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
              complete: (results: any) => {
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
  }, [id, supabase]);



  const handleExport = () => {
    const csv = Papa.unparse(stagedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${datasetName}_export.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dataset exported successfully");
  };

  const handleSave = async () => {
     toast.success("Changes saved");
     setDirty(false);
     setPendingChanges([]);
     setData(stagedData);
     if (stagedData.length > 0) {
        await supabase
          .from('datasets')
          .update({ row_count: stagedData.length })
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
    setPendingChanges([]);
    toast.success("All edits accepted");
  };

  const onGridChange = (next: any[]) => {
    setStagedData(next);
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading dataset...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100vh] max-h-[100vh] overflow-hidden bg-background">
      {/* Left Sidebar - AI Assistant */}
      {showAISidebar && (
        <div className="w-96 border-r bg-background flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Chat with your data</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAISidebar(false)}>
              <PanelLeftCloseIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-2">
            <SimpleChatSidebar 
              datasetId={id}
              onClose={() => setShowAISidebar(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!showAISidebar && (
                <Button variant="outline" size="sm" onClick={() => setShowAISidebar(true)}>
                  <PanelLeftOpenIcon className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h2 className="text-xl font-bold glow-text">{datasetName}</h2>
                <p className="text-sm text-muted-foreground">
                  {stagedData.length} rows • {stagedData.length > 0 ? Object.keys(stagedData[0]).length : 0} columns
                  {dirty && <span className="ml-2 text-amber-500">• {pendingChanges.length} pending changes</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {dirty && (
                <Button variant="default" className="gap-2" onClick={acceptAllEdits}>
                  <CheckIcon className="h-4 w-4" /> Accept Changes
                </Button>
              )}
              <Button variant="outline" className="gap-2" onClick={handleSave}>
                <SaveIcon className="h-4 w-4" /> Save
              </Button>
              <Button variant="default" className="gap-2 bg-primary shadow-[0_0_15px_rgba(128,149,216,0.5)]" onClick={handleExport}>
                <DownloadIcon className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="flex-1 overflow-hidden p-4 bg-background">
          <div className="h-full border rounded-lg bg-background overflow-hidden">
            <DataGrid data={stagedData} onChange={onGridChange} editable />
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <div className="text-lg font-semibold mb-4">Publish Dataset</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button variant={target === "hf" ? "default" : "outline"} onClick={() => setTarget("hf")}>
                Hugging Face
              </Button>
              <Button variant={target === "kaggle" ? "default" : "outline"} onClick={() => setTarget("kaggle")}>
                Kaggle
              </Button>
            </div>
            <div className="space-y-3">
              <input 
                className="w-full border rounded-lg px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" 
                placeholder="Title" 
                value={pubTitle} 
                onChange={(e) => setPubTitle(e.target.value)} 
              />
              <textarea 
                className="w-full border rounded-lg px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" 
                placeholder="Description" 
                value={pubDesc} 
                onChange={(e) => setPubDesc(e.target.value)} 
              />
              {target === "hf" ? (
                <input 
                  className="w-full border rounded-lg px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" 
                  placeholder="HF Token (hf_xxx)" 
                  type="password"
                  value={hfToken} 
                  onChange={(e) => setHfToken(e.target.value)} 
                />
              ) : (
                <>
                  <input 
                    className="w-full border rounded-lg px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="Kaggle Username" 
                    value={kgUser} 
                    onChange={(e) => setKgUser(e.target.value)} 
                  />
                  <input 
                    className="w-full border rounded-lg px-4 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary" 
                    placeholder="Kaggle API Key" 
                    type="password"
                    value={kgKey} 
                    onChange={(e) => setKgKey(e.target.value)} 
                  />
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowPublish(false)}>Cancel</Button>
                <Button onClick={handlePush} className="shadow-lg shadow-primary/20">Publish</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}