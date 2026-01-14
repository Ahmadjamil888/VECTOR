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

    // Get dataset count
    const { count: datasetsCount, error: datasetsError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get total storage used
    const { data: datasets, error: storageError } = await supabase
      .from('datasets')
      .select('file_size_mb')
      .eq('user_id', user.id);

    const totalStorage = datasets?.reduce((sum, dataset) => sum + (dataset.file_size_mb || 0), 0) || 0;

    // Get published count
    const { count: publishedCount, error: publishedError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_published', true);

    if (datasetsError || storageError || publishedError) {
      console.error('Errors:', { datasetsError, storageError, publishedError });
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json({
      datasets: datasetsCount || 0,
      storageUsed: parseFloat(totalStorage.toFixed(2)),
      published: publishedCount || 0
    });

  } catch (error) {
    console.error('Error in dashboard stats GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}