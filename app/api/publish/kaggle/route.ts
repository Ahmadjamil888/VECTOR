import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, rows, username, key } = await req.json();
    
    if (!title || !rows || !username || !key) {
      return NextResponse.json({ 
        error: "Missing required fields: title, rows, username, or key" 
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
    
    // Create a dataset name based on title
    const datasetName = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().substring(0, 50);
    
    try {
      // Use Kaggle API to create dataset
      // First, create a temporary file
      const formData = new FormData();
      
      // Add CSV file to form data
      const fileBlob = new Blob([csvContent], { type: 'text/csv' });
      formData.append('file', fileBlob, `${datasetName}.csv`);
      
      // Make API request to Kaggle
      const response = await fetch('https://www.kaggle.com/api/v1/datasets/create/new', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${username}:${key}`)}`,
          // Don't set Content-Type header - let browser set it with boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Kaggle API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      return NextResponse.json({ 
        ok: true, 
        title,
        count: rows.length,
        datasetUrl: result.url || `https://kaggle.com/${username}/${datasetName}`
      }, { status: 200 });
    } catch (uploadError: any) {
      console.error('Kaggle upload error:', uploadError);
      return NextResponse.json({ 
        error: `Upload failed: ${uploadError.message}` 
      }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Kaggle publish error:', e);
    return NextResponse.json({ 
      error: e.message || "Unexpected error during Kaggle publish" 
    }, { status: 500 });
  }
}
