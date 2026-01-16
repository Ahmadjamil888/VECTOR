import { createClient } from '@supabase/supabase-js'

// Traditional Supabase client setup
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper functions for common operations
export const supabaseHelpers = {
  // Dataset operations
  async getDatasets(userId: string) {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getDataset(id: string) {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createDataset(dataset: {
    name: string
    user_id: string
    file_path?: string
    file_size?: number
    row_count?: number
    description?: string
  }) {
    const { data, error } = await supabase
      .from('datasets')
      .insert([dataset])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateDataset(id: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('datasets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteDataset(id: string) {
    const { error } = await supabase
      .from('datasets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Storage operations
  async uploadDatasetFile(file: File, userId: string) {
    const fileName = `${userId}/${Date.now()}_${file.name}`
    
    const { data, error } = await supabase.storage
      .from('datasets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    return data
  },

  async getDatasetFileUrl(filePath: string) {
    const { data } = supabase.storage
      .from('datasets')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  },

  async deleteDatasetFile(filePath: string) {
    const { error } = await supabase.storage
      .from('datasets')
      .remove([filePath])
    
    if (error) throw error
    return true
  },

  // Profile operations
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserProfile(userId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}