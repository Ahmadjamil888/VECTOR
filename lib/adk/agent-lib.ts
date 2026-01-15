import { GoogleGenerativeAI, GenerateContentResult } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

// Define the base tool interface similar to ADK
interface BaseTool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: any) => Promise<any>;
}

// Function Tool implementation similar to ADK
class FunctionTool implements BaseTool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: any) => Promise<any>;

  constructor(config: {
    name: string;
    description: string;
    parameters: z.ZodSchema;
    execute: (params: any) => Promise<any>;
  }) {
    this.name = config.name;
    this.description = config.description;
    this.parameters = config.parameters;
    this.execute = config.execute;
  }
}

// Dataset management tools
const createDatasetTool = new FunctionTool({
  name: "create_dataset",
  description: "Creates a new dataset in the system",
  parameters: z.object({
    name: z.string().describe("The name of the dataset"),
    source_type: z.enum(["file", "kaggle", "huggingface", "google_storage"]).describe("The source type of the dataset"),
    file_path: z.string().optional().describe("Path to the file in storage"),
    file_size_mb: z.number().optional().describe("Size of the file in MB"),
    row_count: z.number().optional().describe("Number of rows in the dataset")
  }),
  execute: async (params: z.infer<ReturnType<typeof z.object>>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // First, check if user has any projects, if not create a default one
    let projectId: string;
    const { data: existingProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (projectsError || !existingProjects || existingProjects.length === 0) {
      // Create default project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: 'My First Project',
          description: 'Default project for datasets'
        })
        .select('id')
        .single();
      
      if (projectError) {
        throw new Error(`Project creation error: ${projectError.message}`);
      }
      
      projectId = newProject.id;
    } else {
      projectId = existingProjects[0].id;
    }

    // Insert record into datasets table
    const { data: dataset, error: dbError } = await supabase
      .from('datasets')
      .insert({
        user_id: user.id,
        project_id: projectId,
        name: params.name,
        file_path: params.file_path,
        source_type: params.source_type,
        file_size_mb: params.file_size_mb,
        row_count: params.row_count || 0,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    return { success: true, dataset };
  }
});

const listDatasetsTool = new FunctionTool({
  name: "list_datasets",
  description: "Lists all datasets for the current user",
  parameters: z.object({}),
  execute: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { datasets: data };
  }
});

const deleteDatasetTool = new FunctionTool({
  name: "delete_dataset",
  description: "Deletes a dataset by ID",
  parameters: z.object({
    dataset_id: z.string().describe("The ID of the dataset to delete")
  }),
  execute: async (params: z.infer<ReturnType<typeof z.object>>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if dataset exists and belongs to user
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('id, user_id, file_path')
      .eq('id', params.dataset_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !dataset) {
      throw new Error("Dataset not found or unauthorized");
    }

    // Delete file from storage if it exists
    if (dataset.file_path) {
      const { error: deleteError } = await supabase.storage
        .from('datasets')
        .remove([dataset.file_path]);
      
      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError);
        // Continue with dataset deletion even if file deletion fails
      }
    }

    // Delete dataset record
    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', params.dataset_id);

    if (deleteError) {
      throw new Error(`Failed to delete dataset: ${deleteError.message}`);
    }

    return { success: true };
  }
});

const getDatasetTool = new FunctionTool({
  name: "get_dataset",
  description: "Gets a specific dataset by ID",
  parameters: z.object({
    dataset_id: z.string().describe("The ID of the dataset to retrieve")
  }),
  execute: async (params: z.infer<ReturnType<typeof z.object>>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', params.dataset_id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { dataset: data };
  }
});

// Export all tools and types
export {
  createDatasetTool,
  listDatasetsTool,
  deleteDatasetTool,
  getDatasetTool
};

export type {
  BaseTool,
  FunctionTool
};

// Define the agent class similar to ADK
export class LlmAgent {
  model: string;
  name: string;
  description: string;
  instruction: string;
  tools: BaseTool[];
  apiKey: string;

  constructor(config: {
    model: string;
    name: string;
    description: string;
    instruction: string;
    tools: BaseTool[];
  }) {
    this.model = config.model;
    this.name = config.name;
    this.description = config.description;
    this.instruction = config.instruction;
    this.tools = config.tools;
    this.apiKey = process.env.GEMINI_API_KEY!;
  }

  async run(input: string): Promise<any> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: this.model });

    // Construct the prompt with tools and instructions
    const toolsDescription = this.tools.map(tool => 
      `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters._def)}`  
    ).join("\n");

    const fullPrompt = `
${this.instruction}

Available tools:
${toolsDescription}

User input: ${input}

Respond in JSON format with the tool to call and its parameters.
`;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to determine if a tool should be called
      try {
        const parsed = JSON.parse(text);
        
        // Find the matching tool
        const tool = this.tools.find(t => t.name === parsed.tool_name);
        if (tool) {
          // Validate parameters
          const validatedParams = tool.parameters.parse(parsed.parameters);
          
          // Execute the tool
          const toolResult = await tool.execute(validatedParams);
          
          return {
            result: toolResult,
            tool_used: tool.name
          };
        }
      } catch (parseError) {
        // If parsing fails, return the raw response
        return {
          result: text,
          tool_used: null
        };
      }

      return {
        result: text,
        tool_used: null
      };
    } catch (error) {
      console.error("Error running agent:", error);
      throw error;
    }
  }
}