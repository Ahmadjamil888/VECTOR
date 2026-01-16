import { createClient } from "../supabase/client";

// Dataset Service Functions
export const getDatasetsByUserId = async (userId: string) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching datasets:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getDatasetsByUserId:', error);
    throw error;
  }
};

export const createDataset = async (datasetData: {
  name: string;
  source_type: string;
  user_id: string;
  row_count?: number;
  file_size_mb?: number;
  is_published?: boolean;
  file_path?: string | null;
  description?: string;
  tags?: string[];
}) => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('datasets')
      .insert([{
        name: datasetData.name,
        source_type: datasetData.source_type,
        user_id: datasetData.user_id,
        row_count: datasetData.row_count || 0,
        file_size_mb: datasetData.file_size_mb || 0,
        is_published: datasetData.is_published || false,
        file_path: datasetData.file_path || null,
        description: datasetData.description,
        tags: datasetData.tags
      }]);

    if (error) {
      console.error('Error creating dataset:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in createDataset:', error);
    throw error;
  }
};

export const deleteDataset = async (id: string) => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('datasets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteDataset:', error);
    throw error;
  }
};

// Profile Service Functions
export const getUserProfile = async (userId: string) => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profileData: {
  full_name?: string;
  bio?: string;
  subscription_tier?: string;
  credits_remaining?: number;
}) => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

// Usage Statistics Functions
export const getUserUsageStats = async (userId: string) => {
  const supabase = createClient();
  
  try {
    // Get user profile for credits info
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits_remaining')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Count user's datasets
    const { count: total_datasets, error: datasetsError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (datasetsError) {
      console.error('Error counting datasets:', datasetsError);
      throw datasetsError;
    }

    // Count user's chats
    const { count: total_chats, error: chatsError } = await supabase
      .from('chats')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (chatsError) {
      console.error('Error counting chats:', chatsError);
      throw chatsError;
    }

    // Count user's messages
    const { count: total_messages, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (messagesError) {
      console.error('Error counting messages:', messagesError);
      throw messagesError;
    }

    // Calculate storage used
    const { data: datasetsData, error: datasetsDataError } = await supabase
      .from('datasets')
      .select('file_size_mb')
      .eq('user_id', userId);

    if (datasetsDataError) {
      console.error('Error fetching datasets data:', datasetsDataError);
      throw datasetsDataError;
    }

    const storage_used_mb = datasetsData ? datasetsData.reduce((sum, ds) => sum + (ds.file_size_mb || 0), 0) : 0;

    // Get recent activity (last 10 records from datasets)
    const { data: recentActivity, error: activityError } = await supabase
      .from('datasets')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
      throw activityError;
    }

    // Format recent activity
    const formattedActivity = recentActivity.map(item => ({
      id: item.id,
      type: 'Dataset',
      description: `Created dataset: ${item.name}`,
      timestamp: item.created_at,
      metadata: { success: true }
    }));

    return {
      total_datasets: total_datasets || 0,
      total_chats: total_chats || 0,
      total_messages: total_messages || 0,
      storage_used_mb,
      credits_used: 100 - (profileData.credits_remaining || 100), // Assuming starting credits is 100
      credits_remaining: profileData.credits_remaining || 0,
      recent_activity: formattedActivity
    };
  } catch (error) {
    console.error('Error in getUserUsageStats:', error);
    throw error;
  }
};

// Dashboard Statistics Functions
export const getDashboardStats = async (userId: string) => {
  const supabase = createClient();

  try {
    // Fetch user's datasets
    const { count: totalDatasets, error: datasetsError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (datasetsError) {
      console.error('Error fetching datasets count:', datasetsError);
      throw datasetsError;
    }

    // Calculate storage used
    const { data: datasetsData, error: datasetsDataError } = await supabase
      .from('datasets')
      .select('file_size_mb, name, created_at')
      .eq('user_id', userId);

    if (datasetsDataError) {
      console.error('Error fetching datasets data:', datasetsDataError);
      throw datasetsDataError;
    }

    const storageUsed = datasetsData ? datasetsData.reduce((sum, ds) => sum + (ds.file_size_mb || 0), 0) : 0;

    // Fetch published datasets count
    const { count: totalPublished, error: publishedError } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_published', true);

    if (publishedError) {
      console.error('Error fetching published datasets count:', publishedError);
      throw publishedError;
    }

    // Fetch recent activity (last 5 datasets)
    const { data: recentActivity, error: activityError } = await supabase
      .from('datasets')
      .select('id, name, created_at, file_size_mb')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityError) {
      console.error('Error fetching recent activity:', activityError);
      // Return empty array instead of throwing to prevent dashboard crashes
      console.warn('Using empty recent activity due to error:', activityError.message);
    }

    return {
      totalDatasets: totalDatasets || 0,
      storageUsed,
      totalPublished: totalPublished || 0,
      recentActivity: recentActivity || []
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    // Return default values instead of throwing to prevent dashboard crashes
    return {
      totalDatasets: 0,
      storageUsed: 0,
      totalPublished: 0,
      recentActivity: []
    };
  }
};