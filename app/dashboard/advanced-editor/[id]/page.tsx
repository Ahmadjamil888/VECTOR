"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  SendIcon, 
  DownloadIcon, 
  SaveIcon, 
  PlayIcon,
  BotIcon,
  TableIcon,
  MessageSquareIcon
} from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import { createClient } from "@/lib/supabase/client"

interface Dataset {
  id: string
  name: string
  file_path: string
  row_count: number
  file_size_mb: number
  created_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function AdvancedEditorPage() {
  const params = useParams()
  const router = useRouter()
  const datasetId = params.id as string
  const supabase = createClient()
  
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [rawData, setRawData] = useState("")
  const [parsedData, setParsedData] = useState<any[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // AI Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (datasetId) {
      fetchDataset()
    }
  }, [datasetId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchDataset = async () => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}`)
      if (response.ok) {
        const data = await response.json()
        setDataset(data)
        await loadData(data.file_path)
      } else {
        toast.error("Dataset not found")
        router.push("/dashboard/datasets")
      }
    } catch (error) {
      console.error("Error fetching dataset:", error)
      toast.error("Failed to load dataset")
    } finally {
      setLoading(false)
    }
  }

  const loadData = async (filePath: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}/data`)
      if (response.ok) {
        const text = await response.text()
        setRawData(text)
        parseCSV(text)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const parseCSV = (csvText: string) => {
    Papa.parse(csvText, {
      complete: (results: any) => {
        if (results.data.length > 0) {
          setHeaders(results.data[0] as string[])
          setParsedData(results.data.slice(1) as any[][])
        }
      },
      skipEmptyLines: true
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const csvData = [headers, ...parsedData]
      const csvString = Papa.unparse(csvData)
      
      const response = await fetch(`/api/datasets/${datasetId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: csvString }),
      })

      if (response.ok) {
        toast.success('Dataset saved successfully')
      } else {
        toast.error('Failed to save dataset')
      }
    } catch (error) {
      console.error('Error saving dataset:', error)
      toast.error('Failed to save dataset')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    const csvData = [headers, ...parsedData]
    const csvString = Papa.unparse(csvData)
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${dataset?.name || 'dataset'}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Dataset downloaded')
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsProcessing(true)

    try {
      // Call Gemini API for dataset modification
      const response = await fetch('/api/editor/modify-dataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId,
          prompt: inputMessage,
          currentData: { headers, data: parsedData }
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.modification || "I've processed your request. The dataset has been updated.",
          timestamp: new Date().toISOString()
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Update the dataset if modifications were made
        if (result.newData) {
          setHeaders(result.newData.headers)
          setParsedData(result.newData.data)
          toast.success('Dataset modified successfully')
        }
      } else {
        throw new Error('Failed to process request')
      }
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error('Failed to process request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Dataset not found</h2>
          <Button className="mt-4" onClick={() => router.push('/dashboard/datasets')}>
            Back to Datasets
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{dataset.name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span>{dataset.row_count?.toLocaleString()} rows</span>
              <span>{dataset.file_size_mb?.toFixed(2)} MB</span>
              <Badge variant="secondary">Editing</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <SaveIcon className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Data Editor */}
        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  Dataset Editor
                </CardTitle>
                <CardDescription>
                  Edit your dataset directly or use AI commands in the sidebar
                </CardDescription>
              </CardHeader>
              <CardContent className="h-full">
                <Textarea
                  value={rawData}
                  onChange={(e) => {
                    setRawData(e.target.value)
                    parseCSV(e.target.value)
                  }}
                  className="h-full min-h-[400px] font-mono text-sm resize-none"
                  placeholder="Paste your CSV data here..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Agent Sidebar */}
      <div className="w-96 border-l flex flex-col bg-muted/10">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BotIcon className="h-5 w-5" />
            AI Data Builder
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Describe what you want to do with your data
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <BotIcon className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">Ask me to help modify your dataset</p>
              <p className="text-sm mt-1">Examples:</p>
              <ul className="text-xs mt-2 space-y-1">
                <li>• "Remove duplicates from the email column"</li>
                <li>• "Filter rows where age > 25"</li>
                <li>• "Add a new column for full names"</li>
                <li>• "Sort by date column descending"</li>
              </ul>
            </div>
          )}

          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted border'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === 'assistant' && (
                    <BotIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted border rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <BotIcon className="h-4 w-4" />
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Describe what you want to do with your data..."
              className="flex-1"
              disabled={isProcessing}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isProcessing}
              size="icon"
            >
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}