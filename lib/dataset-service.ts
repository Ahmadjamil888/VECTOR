import { supabase } from './supabase'

export interface Dataset {
  id: string
  user_id: string
  name: string
  file_path?: string
  source_type: 'file' | 'kaggle' | 'huggingface' | 'google_storage'
  source_url?: string
  row_count?: number
  file_size_mb?: number
  metadata?: Record<string, any>
  created_at: string
  project_id?: string
  description?: string
}

export interface CreateDatasetInput {
  name: string
  user_id: string
  file?: File
  source_type: 'file' | 'kaggle' | 'huggingface' | 'google_storage'
  source_url?: string
  description?: string
  project_id?: string
}

export class DatasetService {
  // Get all datasets for a user
  static async getDatasets(userId: string): Promise<Dataset[]> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch datasets: ${error.message}`)
    return data || []
  }

  // Get a specific dataset by ID
  static async getDataset(id: string, userId: string): Promise<Dataset | null> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows found
      throw new Error(`Failed to fetch dataset: ${error.message}`)
    }
    return data
  }

  // Create a new dataset
  static async createDataset(input: CreateDatasetInput): Promise<Dataset> {
    let filePath: string | undefined

    // Handle file upload if provided
    if (input.file && input.source_type === 'file') {
      filePath = await this.uploadDatasetFile(input.file, input.user_id)
    }

    const datasetData = {
      name: input.name,
      user_id: input.user_id,
      file_path: filePath,
      source_type: input.source_type,
      source_url: input.source_url,
      description: input.description,
      project_id: input.project_id,
      file_size_mb: input.file ? input.file.size / (1024 * 1024) : undefined,
    }

    const { data, error } = await supabase
      .from('datasets')
      .insert([datasetData])
      .select()
      .single()

    if (error) throw new Error(`Failed to create dataset: ${error.message}`)
    return data
  }

  // Update an existing dataset
  static async updateDataset(
    id: string,
    userId: string,
    updates: Partial<Omit<Dataset, 'id' | 'user_id' | 'created_at'>>
  ): Promise<Dataset> {
    const { data, error } = await supabase
      .from('datasets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update dataset: ${error.message}`)
    return data
  }

  // Delete a dataset
  static async deleteDataset(id: string, userId: string): Promise<boolean> {
    // First, get the dataset to check if we need to delete the file
    const dataset = await this.getDataset(id, userId)
    if (!dataset) throw new Error('Dataset not found')

    // Delete the file from storage if it exists
    if (dataset.file_path) {
      await this.deleteDatasetFile(dataset.file_path)
    }

    // Delete the database record
    const { error } = await supabase
      .from('datasets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to delete dataset: ${error.message}`)
    return true
  }

  // Upload dataset file to Supabase Storage
  static async uploadDatasetFile(file: File, userId: string): Promise<string> {
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/json',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload CSV, JSON, or text files.')
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 100MB limit.')
    }

    const fileName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    
    const { data, error } = await supabase.storage
      .from('datasets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw new Error(`Failed to upload file: ${error.message}`)
    return data.path
  }

  // Get public URL for a dataset file
  static getDatasetFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('datasets')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }

  // Download dataset file
  static async downloadDatasetFile(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('datasets')
      .download(filePath)

    if (error) throw new Error(`Failed to download file: ${error.message}`)
    return data
  }

  // Delete dataset file from storage
  static async deleteDatasetFile(filePath: string): Promise<boolean> {
    const { error } = await supabase.storage
      .from('datasets')
      .remove([filePath])

    if (error) throw new Error(`Failed to delete file: ${error.message}`)
    return true
  }

  // Get dataset statistics for a user
  static async getUserDatasetStats(userId: string) {
    const { data: datasets, error } = await supabase
      .from('datasets')
      .select('file_size_mb, created_at')
      .eq('user_id', userId)

    if (error) throw new Error(`Failed to fetch dataset stats: ${error.message}`)

    const totalDatasets = datasets?.length || 0
    const totalStorage = datasets?.reduce((sum, ds) => sum + (ds.file_size_mb || 0), 0) || 0
    
    // Calculate datasets created in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentDatasets = datasets?.filter(ds => 
      new Date(ds.created_at) > thirtyDaysAgo
    ).length || 0

    return {
      totalDatasets,
      totalStorage,
      recentDatasets,
      storageLimit: 100, // MB
      storagePercentage: Math.min((totalStorage / 100) * 100, 100)
    }
  }

  // Search datasets by name
  static async searchDatasets(userId: string, searchTerm: string): Promise<Dataset[]> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', `%${searchTerm}%`)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to search datasets: ${error.message}`)
    return data || []
  }
}