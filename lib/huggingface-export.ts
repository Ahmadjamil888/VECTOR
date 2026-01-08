import { DatasetStorageManager } from './dataset-storage';
import fs from 'fs/promises';
import path from 'path';

/**
 * Hugging Face Export Manager
 * Handles exporting datasets to Hugging Face Hub
 */
export class HuggingFaceExportManager {
  private readonly datasetStorage: DatasetStorageManager;
  private readonly hfToken: string;

  constructor(datasetStorage?: DatasetStorageManager, hfToken?: string) {
    this.datasetStorage = datasetStorage || new DatasetStorageManager();
    this.hfToken = hfToken || process.env.HF_TOKEN || '';
    
    if (!this.hfToken) {
      console.warn('HF_TOKEN is not set. Hugging Face export will not work.');
    }
  }

  /**
   * Exports a dataset to Hugging Face Hub
   */
  async exportToHub(datasetId: string, datasetName: string, description?: string): Promise<HfExportResult> {
    if (!this.hfToken) {
      throw new Error('Hugging Face token is not configured. Please set HF_TOKEN environment variable.');
    }

    try {
      // Get the latest version of the dataset
      const latestVersionPath = await this.datasetStorage.getLatestVersion(datasetId);
      
      if (!latestVersionPath) {
        throw new Error(`No versions found for dataset ${datasetId}`);
      }

      // Read the dataset content
      const content = await fs.readFile(latestVersionPath, 'utf-8');

      // Prepare the dataset for upload
      const repoId = `${this.getUsername()}/${datasetId}`;
      
      // For server-side implementation, we need to use the Hugging Face datasets commit API
      // instead of FormData which isn't supported in Node.js fetch
      const commitPayload = {
        repo_id: repoId,
        repo_type: 'dataset',
        operations: [
          {
            operation: 'ADD',
            path: `data/${path.basename(latestVersionPath)}`,
            content: content,
            encoding: 'utf-8'
          }
        ],
        commit_message: `Upload dataset ${datasetName} version via AI platform`,
        commit_description: description || `Dataset ${datasetName} uploaded from AI-driven transformation platform`
      };

      // Make the API call to Hugging Face
      const response = await fetch(`https://huggingface.co/api/datasets/${repoId}/commit/main`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hfToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commitPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Hugging Face API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        repoUrl: `https://huggingface.co/datasets/${repoId}`,
        commitHash: result.commitOid,
        message: `Dataset ${datasetName} successfully exported to Hugging Face Hub`
      };
    } catch (error) {
      console.error(`Failed to export to Hugging Face: ${error}`);
      return {
        success: false,
        error: (error as Error).message,
        message: `Failed to export dataset to Hugging Face: ${(error as Error).message}`
      };
    }
  }

  /**
   * Gets the username from the HF token
   */
  private getUsername(): string {
    // In a real implementation, we would decode the token to get the username
    // For now, we'll use a placeholder
    return process.env.HF_USERNAME || 'user';
  }
}

/**
 * Interfaces for type safety
 */
interface HfExportResult {
  success: boolean;
  repoUrl?: string;
  commitHash?: string;
  message: string;
  error?: string;
}