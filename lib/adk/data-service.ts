import { getDatasetService } from "@/lib/adk/dataset-service";
import { createClient } from "@/lib/supabase/client";

// Service for getting dataset data (content)
export async function getDatasetDataService(datasetId: string) {
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
    throw new Error(`Failed to download file: ${error.message}`);
  }
  
  // Convert the file blob to text
  const text = await data.text();
  return text;
}

// Service for saving dataset data
export async function saveDatasetDataService(datasetId: string, data: string) {
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
    .upload(dataset.file_path, file, { upsert: true }); // Use upsert to replace existing file
    
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  
  return { success: true, message: 'Dataset saved successfully' };
}