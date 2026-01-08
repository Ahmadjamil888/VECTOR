import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, rows, token } = await req.json();
    
    if (!title || !rows || !token) {
      return NextResponse.json({ error: "Missing required fields: title, rows, or token" }, { status: 400 });
    }
    
    // Validate token format
    if (!token.startsWith('hf_')) {
      return NextResponse.json({ error: "Invalid Hugging Face token format" }, { status: 400 });
    }
    
    // Convert rows to CSV format
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Rows must be a non-empty array" }, { status: 400 });
    }
    
    // Create CSV content
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const value = row[header];
        // Properly escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');
    
    // Use Hugging Face Hub API to create dataset

    
    // Create a repository for the dataset
    const repoName = title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    
    try {
      // Create the dataset repository using Hugging Face API
      const repoResponse = await fetch(`https://huggingface.co/api/repos/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          type: 'dataset',
          private: false,
        }),
      });
      
      if (!repoResponse.ok) {
        const repoError = await repoResponse.json();
        throw new Error(repoError.error || `Failed to create repo: ${repoResponse.status}`);
      }
      
      // For server-side implementation, we'll use the Hugging Face Hub API approach
      // Since we can't use FormData in server-side Next.js routes, we'll use the Git-based approach
      
      // First, get the repo info
      // Upload the file using Hugging Face Hub API (proper server-side approach)
      // Since we can't use FormData in server-side routes, we'll use the files API
      
      // First, create a commit with the file
      const commitResponse = await fetch(`https://huggingface.co/api/datasets/${repoName}/commit/main`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-ndjson',
        },
        body: JSON.stringify([
          {
            "operation": "ADD",
            "path": "data.csv",
            "content": csvContent
          }
        ])
      });
      
      if (!commitResponse.ok) {
        const commitError = await commitResponse.json().catch(() => ({}));
        throw new Error(commitError.error || `Failed to commit file: ${commitResponse.status}`);
      }
      
      console.log('Uploaded file to Hugging Face dataset:', repoName);
      
      // Optionally upload a README file with description
      const readmeContent = `# ${title}

${description}

Automatically published from Vector AI.`;
      
      // In a real implementation, we'd upload the README file as well
      // For now, we'll just log that it would be uploaded
      console.log('Would upload README file to Hugging Face dataset:', repoName);
      
      return NextResponse.json({ 
        ok: true, 
        title, 
        count: rows.length,
        repoUrl: `https://huggingface.co/datasets/${repoName}`
      }, { status: 200 });
    } catch (uploadError: any) {
      console.error('Hugging Face upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Hugging Face publish error:', e);
    return NextResponse.json({ error: e.message || "Unexpected error during Hugging Face publish" }, { status: 500 });
  }
}
