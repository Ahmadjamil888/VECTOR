import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BackendOrchestrator } from '@/lib/backend-orchestrator';
import { DatasetStorageManager } from '@/lib/dataset-storage';

interface Qwen25CoderRequest {
  prompt: string;
  datasetId: string;
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, datasetId }: Qwen25CoderRequest = await req.json();

    // Fetch the dataset from storage
    const { data: datasetRecord } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single();

    if (!datasetRecord) {
      return new Response(JSON.stringify({ error: 'Dataset not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize orchestrator
    const datasetStorage = new DatasetStorageManager();
    const orchestrator = new BackendOrchestrator(datasetStorage);

    // Download the dataset file from Supabase storage
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('datasets')
      .download(datasetRecord.file_path);
    
    if (storageError) {
      console.error('Storage error:', storageError);
      return new Response(JSON.stringify({ error: 'Failed to download dataset' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileContent = await fileData.text();

    // Save the input file to the dataset structure
    const inputPath = datasetStorage.getInputPath(datasetId);
    
    // Ensure the directory exists
    const fs = await import('fs/promises');
    const path = await import('path');
    await fs.mkdir(path.dirname(inputPath), { recursive: true });
    await fs.writeFile(inputPath, fileContent);

    // Orchestrate the transformation
    const result = await orchestrator.orchestrateTransformation(datasetId, prompt);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Qwen2.5 Coder error:', error);
    return new Response(JSON.stringify({ error: 'Qwen2.5 Coder request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}