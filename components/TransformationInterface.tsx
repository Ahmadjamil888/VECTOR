'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TransformationInterfaceProps {
  datasetId: string;
}

interface TransformationResult {
  success: boolean;
  result: any;
  transformationCode: string;
}

export function TransformationInterface({ datasetId }: TransformationInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleTransform = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datasetId,
          transformationPrompt: prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transformation failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during transformation');
      console.error('Transformation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Data Transformation</CardTitle>
        <CardDescription>Describe the transformation you want to apply to your dataset</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="e.g., remove duplicate rows, sort by date, fill missing values, normalize column names, make this into a regression ready dataset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleTransform} 
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Transform Data'
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {result && result.success && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-md text-sm">
              Review the transformation changes before applying:
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Transformation Preview:</h4>
              <div className="bg-muted p-3 rounded-md text-xs font-mono max-h-40 overflow-auto">
                {result.result.preview?.map((row: any, idx: number) => (
                  <div key={idx} className="mb-1 last:mb-0">
                    {JSON.stringify(row)}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Statistics:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary p-2 rounded">Rows Before: {result.result.stats?.rowsBefore}</div>
                <div className="bg-secondary p-2 rounded">Rows After: {result.result.stats?.rowsAfter}</div>
                <div className="bg-secondary p-2 rounded">Columns: {result.result.stats?.columns}</div>
                <div className="bg-secondary p-2 rounded">Transformations: {result.result.stats?.transformationsApplied}</div>
                
                {result.result.stats?.regressionReady && (
                  <div className="bg-green-100 text-green-800 p-2 rounded col-span-2">
                    ✓ Regression Ready Dataset
                  </div>
                )}
                
                {result.result.stats?.featuresEncoded && (
                  <div className="bg-secondary p-2 rounded">Features Encoded: {result.result.stats.featuresEncoded}</div>
                )}
                
                {result.result.stats?.outliersRemoved && (
                  <div className="bg-secondary p-2 rounded">Outliers Removed: {result.result.stats.outliersRemoved}</div>
                )}
                
                {result.result.stats?.missingValuesHandled && (
                  <div className="bg-secondary p-2 rounded">
                    Missing Values: {result.result.stats.missingValuesHandled === true ? 'Handled' : result.result.stats.missingValuesCount}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={async () => {
                  // Apply the transformation permanently by making API call to finalize
                  try {
                    const response = await fetch('/api/transform/finalize', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        datasetId,
                        transformationPrompt: prompt,
                      }),
                    });
                    
                    if (response.ok) {
                      setApplied(true);
                      toast.success('Changes applied successfully!');
                      // Optionally refresh the parent data grid
                      setTimeout(() => {
                        setPrompt('');
                        setResult(null);
                        setApplied(false);
                      }, 2000);
                    } else {
                      const errorData = await response.json();
                      toast.error(errorData.error || 'Failed to apply changes');
                    }
                  } catch (err) {
                    console.error('Error applying transformation:', err);
                    toast.error('Error applying transformation');
                  }
                }}
              >
                Apply Changes
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setResult(null); // Cancel the transformation
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}