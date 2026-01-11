'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ProcessedData {
  dataset: any[];
  charts: any[];
  metrics: any;
  summaries: any[];
  logs: string[];
}

export default function DataProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetPreview, setDatasetPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Preview the first few rows of the dataset
      const reader = new FileReader();
      reader.onload = (event) => {
        const csv = event.target?.result as string;
        const preview = csv.split('\n').slice(0, 6).join('\n'); // First 6 lines
        console.log('CSV Preview:', preview);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleProcess = async () => {
    if (!file || !prompt) {
      setError('Please select a file and enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Read the file content
      const fileContent = await file.text();
      
      // Parse CSV
      const parsed = await import('papaparse');
      const { data: dataset } = parsed.parse(fileContent, { header: true, skipEmptyLines: true });

      // Call the API
      const response = await fetch('/api/process-dataset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dataset,
          prompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process dataset');
      }

      const result = await response.json();
      setProcessedData(result);
      setDatasetPreview(result.dataset.slice(0, 10)); // Show first 10 rows
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing the dataset');
      console.error('Processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>AI-Powered Data Processor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Dataset (CSV)</label>
              <Input 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange} 
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Enter your data processing request</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Clean the data, remove duplicates, fill missing values with mean, and create a histogram of the age column"
                rows={4}
                disabled={loading}
              />
            </div>
            
            <Button 
              onClick={handleProcess} 
              disabled={loading || !file || !prompt}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Process Dataset'}
            </Button>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                Error: {error}
              </div>
            )}
            
            {processedData && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Processed Dataset Preview</h3>
                  <div className="border rounded-md overflow-x-auto">
                    {datasetPreview.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(datasetPreview[0]).map((key) => (
                              <th 
                                key={key} 
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {datasetPreview.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, cellIndex) => (
                                <td 
                                  key={cellIndex} 
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="p-4 text-gray-500">No data to display</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Execution Logs</h3>
                  <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                    {processedData.logs.map((log, index) => (
                      <div key={index} className="text-sm mb-1 last:mb-0">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
                
                {processedData.charts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Generated Charts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {processedData.charts.map((chart, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <h4 className="font-medium mb-2">{chart.description}</h4>
                          <div className="bg-gray-200 border-2 border-dashed rounded-md h-40 flex items-center justify-center">
                            Chart Placeholder: {chart.chartType}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {Object.keys(processedData.metrics).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Model Metrics</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      {Object.entries(processedData.metrics).map(([modelName, metrics]) => (
                        <div key={modelName} className="mb-4 last:mb-0">
                          <h4 className="font-medium mb-2">{modelName} Model</h4>
                          <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
                            {JSON.stringify(metrics, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}