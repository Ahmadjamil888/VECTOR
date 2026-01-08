"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, BotIcon, WrenchIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODEL_OPTIONS = [
  { id: "llama3-70b-8192", label: "Llama 3 70B" },
  { id: "llama3-8b-8192", label: "Llama 3 8B" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B" },
];

export function ChatInterface({ data, onProposeEdits, initialPrompt, datasetId }: { data: any[]; onProposeEdits: (next: any[]) => void; initialPrompt?: string; datasetId?: string }) {
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].id);
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/chat",
    body: { model },
  });
  const [ackMessage, setAckMessage] = useState<string | null>(null);
  const applyCommand = useCallback(async (text: string) => {
    const lower = text.toLowerCase();
    
    // Check if this is a transformation request that should be handled by the API
    if (lower.includes('transform') || lower.includes('regression') || lower.includes('clean') || 
        lower.includes('preprocess') || lower.includes('prepare') || lower.includes('encode') ||
        lower.includes('normalize') || lower.includes('standardize') || lower.includes('scale') ||
        lower.includes('remove outliers') || lower.includes('fill missing') || lower.includes('handle missing')) {
      
      // Call the transformation API
      try {
        toast.info("Processing transformation request with Qwen Coder...");
        
        const response = await fetch('/api/transform', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            datasetId: datasetId || '',
            transformationPrompt: text
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          toast.success("Transformation completed successfully!");
          // The transformation API will return preview data that can be used to update the UI
          // For now, we'll just show a success message
          console.log('Transformation result:', result.result);
        } else {
          throw new Error(result.error || "Transformation failed");
        }
      } catch (error: any) {
        console.error('Transformation error:', error);
        toast.error(`Transformation failed: ${error.message}`);
      }
      
      return;
    }
    
    // Handle simple commands locally
    let next = [...data];
    if (lower.includes("remove duplicates")) {
      const seen = new Set<string>();
      next = next.filter((row) => {
        const key = JSON.stringify(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      onProposeEdits(next);
      toast.success("Removed duplicate rows");
      return;
    }
    const normalizeMatch = lower.match(/normalize\s+(\w+)\s+column/);
    if (normalizeMatch) {
      const col = normalizeMatch[1];
      next = next.map((row) => ({ ...row, [col]: (row?.[col] ?? "").toString().toLowerCase().trim() }));
      onProposeEdits(next);
      toast.success(`Normalized ${col} column`);
      return;
    }
    const dropMatch = lower.match(/drop\s+(\w+)\s+column/);
    if (dropMatch) {
      const col = dropMatch[1];
      next = next.map((row) => {
        const r = { ...row };
        delete r[col];
        return r;
      });
      onProposeEdits(next);
      toast.success(`Dropped ${col} column`);
      return;
    }
    const renameMatch = lower.match(/rename\s+(\w+)\s+to\s+(\w+)/);
    if (renameMatch) {
      const from = renameMatch[1];
      const to = renameMatch[2];
      next = next.map((row) => {
        const r = { ...row };
        if (from in r) {
          r[to] = r[from];
          delete r[from];
        }
        return r;
      });
      onProposeEdits(next);
      toast.success(`Renamed ${from} to ${to}`);
      return;
    }
    if (lower.includes("normalize email")) {
      const col = "email";
      next = next.map((row) => ({ ...row, [col]: (row?.[col] ?? "").toString().toLowerCase().trim() }));
      onProposeEdits(next);
      toast.success("Normalized email column");
      return;
    }
  }, [data, onProposeEdits]);
  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await applyCommand(input);
      await handleSubmit(e);
    },
    [input, handleSubmit, applyCommand]
  );
  useEffect(() => {
    if (initialPrompt && messages.length === 0) {
      setAckMessage(initialPrompt);
    }
  }, [initialPrompt, messages.length]);

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2 glow-text">
            <BotIcon className="h-4 w-4 text-primary" />
            Vector AI
          </h3>
          <p className="text-xs text-muted-foreground">Ask me to edit your dataset.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              {MODEL_OPTIONS.find((m) => m.id === model)?.label ?? "Model"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MODEL_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.id} onClick={() => setModel(opt.id)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-4">
         {messages.length === 0 && !ackMessage && (
            <div className="text-center text-muted-foreground text-sm mt-10">
              Try: Remove duplicates or Normalize email column
            </div>
         )}
        {ackMessage && messages.length === 0 && (
          <div className="flex gap-2 justify-start">
            <div className="max-w-[85%] rounded-lg p-3 text-sm bg-muted text-foreground">
              {ackMessage}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
             <div className={cn(
               "max-w-[85%] rounded-lg p-3 text-sm",
               m.role === "user" 
                 ? "bg-primary text-primary-foreground" 
                 : "bg-muted text-foreground"
             )}>
               {m.content}
             </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input 
            value={input} 
            onChange={handleInputChange} 
            placeholder="Type instructions..." 
            className="bg-background"
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
