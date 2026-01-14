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

    // Get user profile for storage and credits info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('storage_used_mb, credits_remaining')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Get dataset count
    const { count: datasetCount, error: datasetError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (datasetError) {
      console.error('Error counting datasets:', datasetError);
    }

    // Get chat count
    const { count: chatCount, error: chatError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (chatError) {
      console.error('Error counting chats:', chatError);
    }

    // Get message count
    const { data: messages, error: messageError } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', user.id);

    if (messageError) {
      console.error('Error counting messages:', messageError);
    }

    // Calculate credits used (assuming 10 initial credits)
    const creditsUsed = Math.max(0, 10 - (profile.credits_remaining || 0));

    // Mock recent activity data (in a real app, you'd query actual activity logs)
    const recentActivity = [
      {
        id: '1',
        type: 'dataset_upload',
        description: 'Uploaded sales_data.csv',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        metadata: { success: true, rows: 1250 }
      },
      {
        id: '2',
        type: 'chat_session',
        description: 'Started new AI analysis session',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        metadata: { success: true, messages: 15 }
      },
      {
        id: '3',
        type: 'dataset_publish',
        description: 'Published quarterly_report.csv',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        metadata: { success: true, views: 23 }
      }
    ];

    const usageStats = {
      total_datasets: datasetCount || 0,
      total_chats: chatCount || 0,
      total_messages: messages?.length || 0,
      storage_used_mb: profile.storage_used_mb || 0,
      credits_used: creditsUsed,
      credits_remaining: profile.credits_remaining || 0,
      recent_activity: recentActivity
    };

    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Error in usage GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}