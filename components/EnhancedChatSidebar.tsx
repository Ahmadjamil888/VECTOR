'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DownloadIcon, 
  UploadIcon, 
  PlayIcon, 
  RotateCcwIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon, 
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Define simplified types for our chat interface
type ExecutionState = 
  | 'idle' 
  | 'processing' 
  | 'success' 
  | 'error';

interface TransformationStats {
  rowsBefore: number;
  rowsAfter: number;
  columns: number;
  transformationsApplied: number;
  nullValues?: number;
}

interface TransformationResult {
  status: 'completed' | 'failed';
  message: string;
  preview: any[];
  stats: TransformationStats;
  insights?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  executionState?: ExecutionState;
  executionResult?: TransformationResult;
  insights?: string[];
}

interface SimpleChatSidebarProps {
  datasetId: string;
  initialPrompt?: string;
  onApplyChanges?: (prompt: string) => void;
  onCancel?: () => void;
}

export function EnhancedChatSidebar({ 
  datasetId, 
  initialPrompt,
  onApplyChanges,
  onCancel
}: SimpleChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentExecutionState, setCurrentExecutionState] = useState<ExecutionState>('idle');
  const [executionResult, setExecutionResult] = useState<TransformationResult | null>(null);

  const handleSubmit = useCallback(async (prompt?: string) => {
    const currentPrompt = prompt || input;
    if (!currentPrompt.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentPrompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Set initial execution state
    setCurrentExecutionState('processing');

    try {
      setIsLoading(true);
      
      // API call to backend orchestrator
      const response = await fetch('/api/qwen25-coder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, datasetId })
      });

      if (!response.ok) {
        throw new Error('Transformation request failed');
      }

      const data = await response.json();
      
      if (data.success) {
        // Success case
        setCurrentExecutionState('success');
        setExecutionResult(data.result);
        
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `result-${Date.now()}`,
          role: 'assistant',
          content: 'Dataset transformation completed successfully',
          timestamp: new Date(),
          executionState: 'success',
          executionResult: data.result,
          insights: data.insights || [
            'Applied requested transformation',
            'Data is now ready for modeling'
          ]
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Error case
        setCurrentExecutionState('error');
        
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${data.error || 'Transformation failed'}`,
          timestamp: new Date(),
          executionState: 'error'
        };
        
        setMessages(prev => [...prev, errorMessage]);
        toast.error(`Transformation failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during transformation:', error);
      
      // Error handling
      setCurrentExecutionState('error');
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${(error as Error).message}`,
        timestamp: new Date(),
        executionState: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error(`Transformation failed: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [input, datasetId, setMessages, setInput, setCurrentExecutionState, setExecutionResult]); // Removed toast from dependencies

  // Handle initial prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      handleSubmit(initialPrompt);
    }
  }, [initialPrompt, datasetId, handleSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderExecutionState = () => {
    switch (currentExecutionState) {
      case 'processing':
        return (
          <div className="p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md text-sm mb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Processing transformation...</span>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm mb-3">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4" />
              <span>Dataset updated successfully</span>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-4 w-4" />
              <span>Transformation failed</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col border-0 shadow-none">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-primary" />
            AI Transformer
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {datasetId}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Command a data machine, not chat with a bot</p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-2">
        {/* Execution State */}
        {renderExecutionState()}
        
        {/* Simple Results Display */}
        {executionResult && executionResult.status === 'completed' && (
          <div className="bg-white border rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Dataset updated successfully</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">New version</div>
                <div>v2_cleaned.csv</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Rows</div>
                <div>{executionResult.stats.rowsAfter.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Columns</div>
                <div>{executionResult.stats.columns}</div>
              </div>
              
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-xs text-gray-500">Transformations</div>
                <div>{executionResult.stats.transformationsApplied}</div>
              </div>
            </div>

            {executionResult.insights && executionResult.insights.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-500 mb-2">INSIGHTS</div>
                <ul className="text-sm space-y-1">
                  {executionResult.insights.map((insight: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={() => toast.success('CSV downloaded')}
            >
              <DownloadIcon className="h-3 w-3 mr-1" />
              CSV
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={() => toast.info('Publishing to Hugging Face...')}
            >
              <UploadIcon className="h-3 w-3 mr-1" />
              HF
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs"
              onClick={() => toast.info('Viewing transformation code...')}
            >
              Code
            </Button>
          </div>
          
          {executionResult?.status === 'completed' && currentExecutionState === 'success' && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button 
                size="sm" 
                className="text-xs bg-green-600 hover:bg-green-700"
                onClick={() => onApplyChanges?.(input)}
              >
                Apply Changes
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={() => onCancel?.()}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="mt-4 space-y-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Transform dataset..."
            disabled={isLoading}
            className="text-sm"
          />
          <Button 
            onClick={() => handleSubmit()} 
            disabled={isLoading || !input.trim()}
            className="w-full text-sm"
          >
            {isLoading ? (
              <>
                <RotateCcwIcon className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                Transform
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}