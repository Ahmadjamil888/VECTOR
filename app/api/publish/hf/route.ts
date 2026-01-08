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
      
      // Upload the CSV file using Hugging Face file upload API
      const fileBlob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', fileBlob, 'data.csv');
      
      const uploadResponse = await fetch(`https://huggingface.co/api/datasets/${repoName}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || `Failed to upload file: ${uploadResponse.status}`);
      }
      
      // Optionally upload a README file with description
      const readmeContent = `# ${title}

${description}

Automatically published from Vector AI.`;
      
      const readmeBlob = new Blob([readmeContent], { type: 'text/plain' });
      const readmeFormData = new FormData();
      readmeFormData.append('file', readmeBlob, 'README.md');
      
      const readmeResponse = await fetch(`https://huggingface.co/api/datasets/${repoName}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary
        },
        body: readmeFormData,
      });
      
      if (!readmeResponse.ok) {
        console.warn('Failed to upload README:', await readmeResponse.text());
        // Don't throw error for README failure, just log it
      }
      
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
