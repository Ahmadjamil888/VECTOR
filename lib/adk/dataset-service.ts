import { 
  LlmAgent, 
  createDatasetTool, 
  listDatasetsTool, 
  deleteDatasetTool, 
  getDatasetTool 
} from "@/lib/adk/agent-lib";

// Create the dataset management agent
const datasetAgent = new LlmAgent({
  model: 'gemini-2.5-flash',
  name: 'dataset_manager',
  description: 'Manages datasets including creating, listing, retrieving, and deleting datasets.',
  instruction: `You are a dataset management agent. Your job is to handle dataset operations.
  When a user wants to create a dataset, use the create_dataset tool.
  When a user wants to list their datasets, use the list_datasets tool.
  When a user wants to get a specific dataset, use the get_dataset tool.
  When a user wants to delete a dataset, use the delete_dataset tool.
  
  Always respond in JSON format with the tool to call and its parameters.
  `,
  tools: [
    createDatasetTool,
    listDatasetsTool,
    deleteDatasetTool,
    getDatasetTool
  ]
});

// Service functions that use the agent
export async function createDatasetService(name: string, source_type: string, file_path?: string, file_size_mb?: number, row_count?: number) {
  const result = await datasetAgent.run(`Create a dataset with name "${name}", source type "${source_type}". File path: ${file_path || 'null'}, size: ${file_size_mb || 0}MB, rows: ${row_count || 0}.`);
  
  if (result.tool_used === 'create_dataset') {
    return result.result;
  }
  
  throw new Error('Failed to create dataset');
}

export async function listDatasetsService() {
  const result = await datasetAgent.run('List all datasets for the current user.');
  
  if (result.tool_used === 'list_datasets') {
    return result.result.datasets;
  }
  
  throw new Error('Failed to list datasets');
}

export async function getDatasetService(datasetId: string) {
  const result = await datasetAgent.run(`Get the dataset with ID "${datasetId}".`);
  
  if (result.tool_used === 'get_dataset') {
    return result.result.dataset;
  }
  
  throw new Error('Failed to get dataset');
}

export async function deleteDatasetService(datasetId: string) {
  const result = await datasetAgent.run(`Delete the dataset with ID "${datasetId}".`);
  
  if (result.tool_used === 'delete_dataset') {
    return result.result;
  }
  
  throw new Error('Failed to delete dataset');
}