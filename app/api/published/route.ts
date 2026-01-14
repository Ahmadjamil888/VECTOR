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

    // Get published datasets with view and download counts
    const { data, error } = await supabase
      .from('datasets')
      .select(`
        *,
        views:dataset_views(count),
        downloads:dataset_downloads(count)
      `)
      .eq('user_id', user.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching published datasets:', error);
      return NextResponse.json({ error: 'Failed to fetch published datasets' }, { status: 500 });
    }

    // Transform data to include counts
    const transformedData = data.map(dataset => ({
      ...dataset,
      view_count: dataset.views?.[0]?.count || 0,
      download_count: dataset.downloads?.[0]?.count || 0
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error in published GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}