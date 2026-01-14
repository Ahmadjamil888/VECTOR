import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const datasetId = params.id;

    // Check if dataset exists and belongs to user
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('id, user_id, file_path')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Get file content from storage
    if (dataset.file_path) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('datasets')
        .download(dataset.file_path);

      if (fileError) {
        console.error('Error downloading file:', fileError);
        return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
      }

      const text = await fileData.text();
      return new NextResponse(text, {
        headers: {
          'Content-Type': 'text/plain',
        },
        status: 200
      });
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (error) {
    console.error('Error in dataset data GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}