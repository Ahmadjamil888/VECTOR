import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
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



    // Check if dataset exists and belongs to user
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('id, user_id, name, file_path')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Error in dataset GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Delete file from storage if it exists
    if (dataset.file_path) {
      const { error: deleteError } = await supabase.storage
        .from('datasets')
        .remove([dataset.file_path]);
      
      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        // Continue with dataset deletion even if file deletion fails
      }
    }

    // Delete dataset record
    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', datasetId);

    if (deleteError) {
      console.error('Error deleting dataset:', deleteError);
      return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in dataset DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}