import fs from 'fs/promises';
import path from 'path';

/**
 * Dataset Storage Manager
 * Implements the required dataset storage layout:
 * /data/
 *  └── ds_{datasetId}/
 *      ├── input.csv
 *      ├── versions/
 *      │   ├── v1_raw.csv
 *      │   ├── v2_cleaned.csv
 *      └── logs/
 */
export class DatasetStorageManager {
  private readonly baseDataDir: string;

  constructor(baseDir?: string) {
    this.baseDataDir = baseDir || path.join(process.cwd(), 'data');
  }

  /**
   * Creates the dataset directory structure for a given dataset ID
   */
  async createDatasetStructure(datasetId: string): Promise<void> {
    const datasetDir = path.join(this.baseDataDir, datasetId);
    const versionsDir = path.join(datasetDir, 'versions');
    const logsDir = path.join(datasetDir, 'logs');

    // Create the directory structure
    await fs.mkdir(datasetDir, { recursive: true });
    await fs.mkdir(versionsDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });

    console.log(`Created dataset structure for ${datasetId} at ${datasetDir}`);
  }

  /**
   * Gets the path for the input CSV file
   */
  getInputPath(datasetId: string): string {
    return path.join(this.baseDataDir, datasetId, 'input.csv');
  }

  /**
   * Gets the path for the versions directory
   */
  getVersionsDir(datasetId: string): string {
    return path.join(this.baseDataDir, datasetId, 'versions');
  }

  /**
   * Gets the path for the logs directory
   */
  getLogsDir(datasetId: string): string {
    return path.join(this.baseDataDir, datasetId, 'logs');
  }

  /**
   * Saves a new version of the dataset
   */
  async saveVersion(datasetId: string, version: string, description: string, content: Buffer | string): Promise<string> {
    const versionDir = this.getVersionsDir(datasetId);
    const filename = `${version}_${description}.csv`;
    const filepath = path.join(versionDir, filename);

    await fs.writeFile(filepath, content as string | Uint8Array);

    return filepath;
  }

  /**
   * Gets all versions of a dataset
   */
  async getVersions(datasetId: string): Promise<string[]> {
    const versionDir = this.getVersionsDir(datasetId);
    try {
      const files = await fs.readdir(versionDir);
      return files.filter(file => file.endsWith('.csv')).map(file => path.join(versionDir, file));
    } catch (error) {
      // Directory might not exist yet
      return [];
    }
  }

  /**
   * Gets the latest version of a dataset
   */
  async getLatestVersion(datasetId: string): Promise<string | null> {
    const versions = await this.getVersions(datasetId);
    if (versions.length === 0) {
      return null;
    }
    
    // Sort by version number (assuming format v{number}_{description}.csv)
    const sortedVersions = versions.sort((a, b) => {
      const versionNumA = parseInt(path.basename(a).match(/^v(\d+)_/)?.[1] || '0');
      const versionNumB = parseInt(path.basename(b).match(/^v(\d+)_/)?.[1] || '0');
      return versionNumB - versionNumA; // Descending order
    });

    return sortedVersions[0];
  }

  /**
   * Checks if a dataset exists
   */
  async datasetExists(datasetId: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.baseDataDir, datasetId));
      return true;
    } catch {
      return false;
    }
  }
}