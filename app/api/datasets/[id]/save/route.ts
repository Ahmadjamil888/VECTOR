import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: datasetId } = await params;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    const { data: csvData } = await request.json();

    if (!csvData) {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
    }

    // Check if dataset exists and belongs to user
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('id, user_id, file_path, name')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Update file in storage
    if (dataset.file_path) {
      const fileBlob = new Blob([csvData], { type: 'text/csv' });
      
      const { error: updateError } = await supabase.storage
        .from('datasets')
        .update(dataset.file_path, fileBlob);

      if (updateError) {
        console.error('Error updating file:', updateError);
        return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
      }

      // Update row count and file size
      const rowCount = csvData.split('\n').length - 1; // Subtract 1 for header
      const fileSizeMb = fileBlob.size / (1024 * 1024);

      const { error: updateDatasetError } = await supabase
        .from('datasets')
        .update({
          row_count: rowCount,
          file_size_mb: fileSizeMb,
          updated_at: new Date().toISOString()
        })
        .eq('id', datasetId);

      if (updateDatasetError) {
        console.error('Error updating dataset metadata:', updateDatasetError);
      }

      return NextResponse.json({ message: 'Dataset saved successfully' });
    }

    return NextResponse.json({ error: 'File path not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in dataset save POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}