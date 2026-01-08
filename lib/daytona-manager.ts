import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Daytona Sandbox Manager
 * Handles creation, management, and execution within Daytona sandboxes
 */
export class DaytonaManager {
  private readonly apiEndpoint: string;
  private readonly apiKey: string;

  constructor(apiEndpoint?: string, apiKey?: string) {
    this.apiEndpoint = apiEndpoint || process.env.DAYTONA_API_URL || 'http://localhost:3000';
    this.apiKey = apiKey || process.env.DAYTONA_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('DAYTONA_API_KEY is not set. Some functionality may not work.');
    }
  }

  /**
   * Creates a new Daytona sandbox for a specific dataset
   */
  async createSandbox(datasetId: string, options: SandboxOptions = {}): Promise<Sandbox> {
    const sandboxName = `ds-${datasetId}`;
    
    try {
      // In a real implementation, this would call the Daytona API to create a sandbox
      // For now, we'll simulate the creation
      
      console.log(`Creating Daytona sandbox: ${sandboxName}`);
      
      // Prepare the command to create a sandbox
      const cmd = `daytona create --name ${sandboxName} --image ${options.image || 'python:3.10'} --target ${options.target || 'docker'}`;
      
      // Execute the command
      const { stdout, stderr } = await execAsync(cmd);
      
      if (stderr) {
        console.error('Error creating sandbox:', stderr);
      }
      
      // Return a sandbox object
      const sandbox: Sandbox = {
        id: sandboxName,
        name: sandboxName,
        status: 'running',
        createdAt: new Date(),
        mounts: options.mounts || {},
        resources: options.resources || { cpu: 2, memory: '4Gi' }
      };
      
      console.log(`Sandbox created successfully: ${sandboxName}`);
      
      // Mount the dataset directory if specified
      if (options.mounts) {
        for (const [localPath, containerPath] of Object.entries(options.mounts)) {
          await this.mountDirectory(sandboxName, localPath, containerPath);
        }
      }
      
      return sandbox;
    } catch (error) {
      console.error(`Failed to create sandbox: ${error}`);
      throw new Error(`Failed to create Daytona sandbox: ${(error as Error).message}`);
    }
  }

  /**
   * Mounts a local directory into the sandbox
   */
  async mountDirectory(sandboxName: string, localPath: string, containerPath: string): Promise<void> {
    try {
      console.log(`Mounting ${localPath} to ${containerPath} in sandbox ${sandboxName}`);
      
      // In a real implementation, this would use Daytona's mount functionality
      // For now, we'll just log the action
    } catch (error) {
      console.error(`Failed to mount directory: ${error}`);
      throw new Error(`Failed to mount directory: ${(error as Error).message}`);
    }
  }

  /**
   * Writes a file to the sandbox
   */
  async writeFile(sandboxName: string, filePath: string, content: string): Promise<void> {
    try {
      console.log(`Writing file to sandbox ${sandboxName}: ${filePath}`);
      
      // Create the directory structure first
      const dirPath = path.dirname(filePath);
      await execAsync(`daytona exec --id ${sandboxName} -- bash -c "mkdir -p ${dirPath}"`);
      
      // Write the file content
      // We'll use echo and redirection to write the content to the file
      const escapedContent = content.replace(/"/g, '\\"').replace(/\$/g, '\\$');
      await execAsync(`daytona exec --id ${sandboxName} -- bash -c "echo \"${escapedContent}\" > ${filePath}"`);
      
      console.log(`File written successfully: ${filePath}`);
    } catch (error) {
      console.error(`Failed to write file to sandbox: ${error}`);
      throw new Error(`Failed to write file to sandbox: ${(error as Error).message}`);
    }
  }

  /**
   * Executes a command inside the sandbox
   */
  async executeCommand(sandboxName: string, command: string[]): Promise<CommandResult> {
    try {
      console.log(`Executing command in sandbox ${sandboxName}: ${command.join(' ')}`);
      
      // Join the command array into a single string
      const commandStr = command.join(' ');
      const cmd = `daytona exec --id ${sandboxName} -- ${commandStr}`;
      
      const { stdout, stderr } = await execAsync(cmd);
      
      const result: CommandResult = {
        success: stderr ? false : true,
        stdout,
        stderr,
        exitCode: 0 // In a real implementation, we'd get the actual exit code
      };
      
      console.log(`Command executed with result:`, result);
      
      return result;
    } catch (error) {
      // If the command failed, it will throw an error with the stderr
      const execError = error as { stdout: string; stderr: string; code: number };
      
      const result: CommandResult = {
        success: false,
        stdout: execError.stdout || '',
        stderr: execError.stderr || (error as Error).message,
        exitCode: execError.code || 1
      };
      
      console.error(`Command failed:`, result);
      
      return result;
    }
  }

  /**
   * Downloads a file from the sandbox
   */
  async downloadFile(sandboxName: string, filePath: string): Promise<string> {
    try {
      console.log(`Downloading file from sandbox ${sandboxName}: ${filePath}`);
      
      // Use daytona exec to cat the file and return its content
      const cmd = `daytona exec --id ${sandboxName} -- cat ${filePath}`;
      const { stdout, stderr } = await execAsync(cmd);
      
      if (stderr) {
        throw new Error(`Error downloading file: ${stderr}`);
      }
      
      return stdout;
    } catch (error) {
      console.error(`Failed to download file from sandbox: ${error}`);
      throw new Error(`Failed to download file from sandbox: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a sandbox
   */
  async deleteSandbox(sandboxName: string): Promise<void> {
    try {
      console.log(`Deleting sandbox: ${sandboxName}`);
      
      const cmd = `daytona delete --id ${sandboxName}`;
      const { stdout, stderr } = await execAsync(cmd);
      
      if (stderr) {
        console.error('Error deleting sandbox:', stderr);
      }
      
      console.log(`Sandbox deleted successfully: ${sandboxName}`);
    } catch (error) {
      console.error(`Failed to delete sandbox: ${error}`);
      throw new Error(`Failed to delete sandbox: ${(error as Error).message}`);
    }
  }

  /**
   * Checks if a sandbox exists
   */
  async sandboxExists(sandboxName: string): Promise<boolean> {
    try {
      const cmd = `daytona list --output json`;
      const { stdout } = await execAsync(cmd);
      
      const sandboxes = JSON.parse(stdout);
      return sandboxes.some((sb: any) => sb.name === sandboxName);
    } catch (error) {
      console.error(`Failed to check if sandbox exists: ${error}`);
      return false;
    }
  }
}

/**
 * Interfaces for type safety
 */
interface SandboxOptions {
  image?: string;
  target?: string;
  mounts?: Record<string, string>;
  resources?: {
    cpu: number;
    memory: string;
  };
}

interface Sandbox {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'creating' | 'error';
  createdAt: Date;
  mounts: Record<string, string>;
  resources: {
    cpu: number;
    memory: string;
  };
}

interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}