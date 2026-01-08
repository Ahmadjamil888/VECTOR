import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token, title, description, rows } = await req.json();

    if (!token || !title || !rows) {
      return NextResponse.json({ 
        error: "Missing required fields: token, title, or rows" 
      }, { status: 400 });
    }

    // Validate token format
    if (!token.startsWith('hf_')) {
      return NextResponse.json({ 
        error: "Invalid Hugging Face token format" 
      }, { status: 400 });
    }

    // Convert rows to CSV format
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ 
        error: "Rows must be a non-empty array" 
      }, { status: 400 });
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

    // Test the Hugging Face API connection by attempting to create a repo
    const repoName = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}_test`.substring(0, 40);

    console.log('Testing Hugging Face API connection...');
    
    // Make a test request to check if the token is valid
    const authTest = await fetch('https://huggingface.co/api/whoami-v2', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!authTest.ok) {
      const authError = await authTest.json().catch(() => ({}));
      throw new Error(`Authentication failed: ${authError.error || `Status ${authTest.status}`}`);
    }

    const userInfo = await authTest.json();
    console.log('Authentication successful for user:', userInfo.name);

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
      // If the repo already exists, that's fine for testing purposes
      if (repoError.error && repoError.error.includes('already exists')) {
        console.log('Repository already exists, continuing test...');
      } else {
        throw new Error(repoError.error || `Failed to create repo: ${repoResponse.status}`);
      }
    } else {
      console.log('Repository created successfully');
    }

    // Upload the CSV file using Hugging Face file upload API
    // Since we can't use FormData in a server-side API route, we'll use the file creation API
    const fileUploadResponse = await fetch(`https://huggingface.co/api/datasets/${userInfo.name}/${repoName}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: csvContent,
    });

    if (!fileUploadResponse.ok) {
      const uploadError = await fileUploadResponse.json();
      throw new Error(uploadError.error || `Failed to upload file: ${fileUploadResponse.status}`);
    }

    console.log('File uploaded successfully');

    // Clean up by deleting the test repository
    const deleteResponse = await fetch(`https://huggingface.co/api/repos/${userInfo.name}/${repoName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!deleteResponse.ok) {
      console.warn('Warning: Could not delete test repository:', await deleteResponse.text());
    } else {
      console.log('Test repository cleaned up successfully');
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Hugging Face API connection is working properly!",
      user: userInfo.name,
      repo: repoName,
      testCompleted: true
    }, { status: 200 });

  } catch (e: any) {
    console.error('Hugging Face API test error:', e);
    return NextResponse.json({ 
      error: e.message || "Unexpected error during Hugging Face API test" 
    }, { status: 500 });
  }
}