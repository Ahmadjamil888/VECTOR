import { NextRequest, NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';
import path from 'path';
import fs from 'fs/promises';
import { createClient } from '@/lib/supabase/server';
import { DaytonaManager } from '@/lib/daytona-manager';

interface ChatWithAiRequest {
  prompt: string;
  datasetId: string;
}

// Initialize Hugging Face inference
const hf = new HfInference(process.env.HF_TOKEN || process.env.HF_ACCESS_TOKEN, {
  // Use a custom fetch to redirect to the correct endpoint
  fetch: (url, options) => {
    // Replace the old API endpoint with the new router endpoint
    const correctedUrl = url.toString().replace('api-inference.huggingface.co', 'router.huggingface.co');
    return fetch(correctedUrl, options);
  }
});

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

    const { prompt, datasetId }: ChatWithAiRequest = await req.json();

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

    // Create dataset directory structure
    const datasetDir = path.join(process.cwd(), 'data', datasetId);
    const inputPath = path.join(datasetDir, 'input.csv');
    const versionsDir = path.join(datasetDir, 'versions');
    const logsDir = path.join(datasetDir, 'logs');
    
    await fs.mkdir(datasetDir, { recursive: true });
    await fs.mkdir(versionsDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });
    
    // Save the input file
    await fs.writeFile(inputPath, fileContent);

    // Generate response using Hugging Face Inference API
    const systemPrompt = `You are an AI Data Engineering Agent.

Environment:
- Python 3.10
- pandas, numpy, scikit-learn available
- Dataset path: /data/${datasetId}/input.csv

Rules:
1. Load dataset from disk
2. Perform requested transformation
3. Save output to /data/${datasetId}/versions/
4. Name output as v{N}_${prompt.substring(0, 15).replace(/[^a-zA-Z0-9]/g, '_')}.csv
5. Print:
   - saved file path
   - dataset shape
   - first 5 rows

Never explain.
Never simulate.
Only output valid Python code.`;

    // Determine if this is a general chat or data transformation
    const isDataRelated = prompt.toLowerCase().includes('data') || 
                         prompt.toLowerCase().includes('dataset') || 
                         prompt.toLowerCase().includes('transform') ||
                         prompt.toLowerCase().includes('column') ||
                         prompt.toLowerCase().includes('row') ||
                         prompt.toLowerCase().includes('filter') ||
                         prompt.toLowerCase().includes('clean');

    if (isDataRelated) {
      // Use the data engineering system prompt
      const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-Coder-7B-Instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
      });

      const generatedCode = response.choices[0].message.content || '';
      
      // Clean up the code if it contains markdown formatting
      let pythonCode = generatedCode.trim();
      if (pythonCode.startsWith('```python')) {
        pythonCode = pythonCode.substring(9);
      }
      if (pythonCode.endsWith('```')) {
        pythonCode = pythonCode.substring(0, pythonCode.length - 3);
      }
      pythonCode = pythonCode.trim();
      
      // Create Daytona manager and execute the code
      const daytonaManager = new DaytonaManager();
      
      // Create or reuse sandbox
      const sandboxName = `ds-${datasetId}`;
      const exists = await daytonaManager.sandboxExists(sandboxName);
      
      if (!exists) {
        await daytonaManager.createSandbox(datasetId, {
          image: 'python:3.10',
          mounts: {
            [datasetDir]: `/data/${datasetId}`
          },
          resources: {
            cpu: 2,
            memory: '4Gi'
          }
        });
      }
      
      // Write the generated Python code to run.py
      await daytonaManager.writeFile(sandboxName, `/data/run.py`, pythonCode);
      
      // Execute the code in the Daytona sandbox
      const executionResult = await daytonaManager.executeCommand(sandboxName, ['python', '/data/run.py']);
      
      // Process the execution result
      if (executionResult.success) {
        // Return the execution output as the AI response
        return new Response(JSON.stringify({ 
          response: executionResult.stdout,
          executionSuccess: true
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Return error output as the AI response
        return new Response(JSON.stringify({ 
          response: `Error executing code: ${executionResult.stderr}`,
          executionSuccess: false
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // For general chat, use a simpler approach
      const response = await hf.chatCompletion({
        model: "Qwen/Qwen2.5-Coder-7B-Instruct",
        messages: [
          { role: "user", content: prompt }
        ],
        max_tokens: 500,
      });

      return new Response(JSON.stringify({ 
        response: response.choices[0].message.content || 'No response generated',
        executionSuccess: true
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Chat with AI error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Chat request failed',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}