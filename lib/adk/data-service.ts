import { getDatasetService } from "@/lib/adk/dataset-service";
import { createClient } from "@/lib/supabase/client";

// Service for getting dataset data (content)
export async function getDatasetDataService(datasetId: string) {
  try {
    const dataset = await getDatasetService(datasetId);
    
    if (!dataset.file_path) {
      throw new Error('Dataset file path not found');
    }
    
    // Get the file content directly from Supabase storage
    const supabase = createClient();
    
    const { data, error } = await supabase.storage
      .from('datasets')
      .download(dataset.file_path);
      
    if (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
    
    // Convert the file blob to text
    const text = await data.text();
    return text;
  } catch (error) {
    console.error('Error getting dataset data:', error);
    throw new Error(`Failed to get dataset data: ${(error as Error).message}`);
  }
}

// Service for saving dataset data
export async function saveDatasetDataService(datasetId: string, data: string) {
  try {
    const dataset = await getDatasetService(datasetId);
    
    if (!dataset.file_path) {
      throw new Error('Dataset file path not found');
    }
    
    // Upload the updated content back to Supabase storage
    const supabase = createClient();
    
    // Convert string data to Blob
    const file = new Blob([data], { type: 'text/csv' });
    
    const { error } = await supabase.storage
      .from('datasets')
      .upload(dataset.file_path, file, {
        upsert: true, // Use upsert to replace existing file
        contentType: 'text/csv'
      });
      
    if (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    // Update row count and file size in the database
    const rowCount = data.split('\n').length - 1; // Subtract 1 for header
    const fileSizeMb = file.size / (1024 * 1024);
    
    // Update dataset metadata in the database
    const { error: dbError } = await supabase
      .from('datasets')
      .update({
        row_count: rowCount,
        file_size_mb: fileSizeMb,
        updated_at: new Date().toISOString()
      })
      .eq('id', datasetId);
      
    if (dbError) {
      console.error('Error updating dataset metadata:', dbError);
      // We still return success since the file was saved, but log the metadata update error
    }
    
    return { success: true, message: 'Dataset saved successfully' };
  } catch (error) {
    console.error('Error saving dataset data:', error);
    throw new Error(`Failed to save dataset data: ${(error as Error).message}`);
  }
}