import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching datasets:', error);
      return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in datasets GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const source_type = formData.get('source_type') as string;
    const file = formData.get('file') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Dataset name is required' }, { status: 400 });
    }

    let file_path = null;
    let file_size_mb = 0;
    let row_count = 0;

    // Handle file upload if provided
    if (file && source_type === 'file') {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      file_path = uploadData.path;
      file_size_mb = file.size / (1024 * 1024);
      
      // Estimate row count for CSV files
      if (fileExt?.toLowerCase() === 'csv') {
        const text = await file.text();
        row_count = text.split('\n').length - 1; // Subtract 1 for header
      }
    }

    const { data, error } = await supabase
      .from('datasets')
      .insert({
        user_id: user.id,
        name,
        file_path,
        source_type,
        file_size_mb,
        row_count,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating dataset:', error);
      return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in datasets POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}