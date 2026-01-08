import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Note: Since we're using TypeScript, we'll simulate the Qwen integration
// In a real scenario, you'd call the actual Qwen API

interface QwenCoderRequest {
  prompt: string;
  datasetId: string;
  model?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (!user || authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, datasetId }: QwenCoderRequest = await req.json();

    // Fetch the dataset from storage
    const { data: datasetRecord } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single();

    if (!datasetRecord) {
      return new Response(JSON.stringify({ error: 'Dataset not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simulate calling the Qwen model to generate transformation code
    // In a real implementation, you would call the Qwen API here
    const transformationCode = await generateTransformationCode(prompt);

    // Execute the transformation in a Daytona sandbox
    // For preview purposes only, not applying to the actual dataset
    const result = await executeTransformation(
      datasetRecord.file_path,
      transformationCode,
      user.id,
      datasetId
    );

    return new Response(JSON.stringify({
      success: true,
      result,
      // Include transformationCode for internal use but not for frontend display
      // The frontend will not show this code to the user
      _debug_transformationCode: transformationCode // Only for debugging, not exposed to frontend
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Qwen Coder error:', error);
    return new Response(JSON.stringify({ error: 'Qwen Coder request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function generateTransformationCode(prompt: string): Promise<string> {
  // Simulate calling Qwen model to generate pandas transformation code
  // In a real implementation, you would call the Qwen API
  
  const lowerPrompt = prompt.toLowerCase();
  
  // Handle regression-ready dataset requests
  if (lowerPrompt.includes('regression') || lowerPrompt.includes('regression ready') || lowerPrompt.includes('machine learning') || lowerPrompt.includes('ml ready')) {
    return `import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Load the dataset
df = pd.read_csv('data.csv')

# Initial shape and info
initial_shape = df.shape
print(f"Original shape: {df.shape}")

# Identify numeric and categorical columns
numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
categorical_columns = df.select_dtypes(include=['object']).columns.tolist()

date_columns = df.select_dtypes(include=['datetime64']).columns.tolist()

# Convert date columns if present
for col in date_columns:
    df[col] = pd.to_datetime(df[col])
    # Extract date features
    df[f'{col}_year'] = df[col].dt.year
    df[f'{col}_month'] = df[col].dt.month
    df[f'{col}_day'] = df[col].dt.day
    # Drop original date column
    df = df.drop(columns=[col])

# Handle missing values
for col in df.columns:
    if df[col].dtype in ['int64', 'float64']:
        # Fill numeric columns with median
        df[col].fillna(df[col].median(), inplace=True)
    else:
        # Fill categorical columns with mode
        df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown', inplace=True)

# Encode categorical variables
label_encoders = {}
for col in categorical_columns:
    le = LabelEncoder()
    # Fit on known categories, transform unknowns to a special value
    df[col] = le.fit_transform(df[col].astype(str))
    label_encoders[col] = le

# Remove outliers using IQR method for numeric columns
for col in numeric_columns:
    if col in df.columns:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - 1.5 * IQR
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]

# Reset index after filtering
df.reset_index(drop=True, inplace=True)

# Save the result
df.to_csv('data.csv', index=False)

# Print summary
print(f"Processed shape: {df.shape}")
print(f"Removed {initial_shape[0] - df.shape[0]} rows")
print(f"Numeric columns: {len(numeric_columns)}")
print(f"Encoded categorical columns: {len(categorical_columns)}")
print("\\nFirst few rows:")
print(df.head())`;
  }
  
  // Handle duplicate removal
  else if (lowerPrompt.includes('duplicate')) {
    return `import pandas as pd

# Load the dataset
df = pd.read_csv('data.csv')

# Remove duplicate rows
df = df.drop_duplicates()

# Save the result
df.to_csv('data.csv', index=False)

# Return preview
print(f"Removed duplicates. Shape: {df.shape}")
print(df.head())`;
  }
  
  // Handle sorting
  else if (lowerPrompt.includes('sort') || lowerPrompt.includes('order')) {
    return `import pandas as pd

# Load the dataset
df = pd.read_csv('data.csv')

# Sort by first column (you would customize based on prompt)
df = df.sort_values(by=df.columns[0])

# Save the result
df.to_csv('data.csv', index=False)

# Return preview
print(f"Sorted data. Shape: {df.shape}")
print(df.head())`;
  }
  
  // Handle missing value operations
  else if (lowerPrompt.includes('missing') || lowerPrompt.includes('null') || lowerPrompt.includes('nan')) {
    return `import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('data.csv')

# Show missing value statistics
missing_stats = df.isnull().sum()
print("Missing values per column:")
print(missing_stats[missing_stats > 0])

# Handle missing values
for col in df.columns:
    if df[col].dtype in ['int64', 'float64']:
        # Fill numeric columns with median
        df[col].fillna(df[col].median(), inplace=True)
    else:
        # Fill categorical columns with mode
        df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'Unknown', inplace=True)

# Save the result
df.to_csv('data.csv', index=False)

# Print summary
print(f"Shape after handling missing values: {df.shape}")
print("First few rows:")
print(df.head())`;
  }
  
  // Handle normalization/scaling
  else if (lowerPrompt.includes('normalize') || lowerPrompt.includes('scale') || lowerPrompt.includes('standardize')) {
    return `import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# Load the dataset
df = pd.read_csv('data.csv')

# Identify numeric columns
numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns

# Apply standardization to numeric columns
scaler = StandardScaler()
df[numeric_cols] = scaler.fit_transform(df[numeric_cols])

# Save the result
df.to_csv('data.csv', index=False)

# Print summary
print(f"Normalized numeric columns: {list(numeric_cols)}")
print(f"Shape: {df.shape}")
print("First few rows:")
print(df.head())`;
  }
  
  // Generic transformation
  else {
    return `import pandas as pd

# Load the dataset
df = pd.read_csv('data.csv')

# Apply transformation based on user request
# This is a generic transformation - actual implementation would parse the prompt
print(f"Applying transformation: {prompt}")

# Save the result
df.to_csv('data.csv', index=False)

# Return preview
print(f"Data shape: {df.shape}")
print(df.head())`;
  }
}

async function executeTransformation(filePath: string, code: string, userId: string, datasetId: string) {
  // Execute the transformation code in a secure Daytona sandbox
  
  // For now, we'll simulate the Daytona integration
  // In a real implementation, uncomment the Daytona code below
  
  /*
  // Execute the transformation code in a secure Daytona sandbox using Python subprocess
  const { spawn } = await import('child_process');
  const util = await import('util');
  const fs = await import('fs/promises');
  const path = await import('path');
  
  try {
    // Create a temporary directory for this transformation
    const tempDir = path.join(process.cwd(), 'temp', `transform-${userId}-${datasetId}-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Get the current dataset from storage
    const supabase = await createClient();
    const { data: fileData, error: storageError } = await supabase
      .storage
      .from('datasets')
      .download(filePath);
    
    if (storageError) throw storageError;
    
    const fileContent = await fileData.text();
    
    // Write the dataset and transformation code to temporary files
    const datasetPath = path.join(tempDir, 'data.csv');
    const codePath = path.join(tempDir, 'transform.py');
    
    await fs.writeFile(datasetPath, fileContent);
    await fs.writeFile(codePath, code);
    
    // Create a Python script to run the Daytona transformation
    const pythonScript = `
import asyncio
import os
from daytona import Daytona

async def run_transformation():
    # Initialize Daytona client
    daytona = Daytona(api_key=os.environ.get('DAYTONA_API_KEY'), server_url=os.environ.get('DAYTONA_API_URL', 'https://app.daytona.io/api'))
    
    # Create a sandbox
    sandbox = await daytona.create(name='transform-${userId}-${datasetId}')
    
    try:
        # Upload files to sandbox
        with open('${datasetPath.replace(/\\/g, '\\\\')}', 'rb') as f:
            await sandbox.fs.upload_file('/home/daytona/data.csv', f.read())
        
        with open('${codePath.replace(/\\/g, '\\\\')}', 'rb') as f:
            await sandbox.fs.upload_file('/home/daytona/transform.py', f.read())
        
        # Execute the transformation
        response = await sandbox.process.code_run('python /home/daytona/transform.py', timeout=30000)
        
        if response.exit_code != 0:
            raise Exception(f'Transformation failed: {response.result}')
        
        # Download the transformed file
        transformed_content = await sandbox.fs.download_file('/home/daytona/data.csv')
        
        # Write output to temp file for Node.js to read
        with open('${path.join(tempDir, 'output.csv').replace(/\\/g, '\\\\')}', 'wb') as f:
            f.write(transformed_content)
        
        # Write the result to a file for Node.js to read
        with open('${path.join(tempDir, 'result.txt').replace(/\\/g, '\\\\')}', 'w') as f:
            f.write(response.result)
        
        return response.result
        
    finally:
        await sandbox.delete()

if __name__ == '__main__':
    asyncio.run(run_transformation())
    `;
    
    const pythonRunnerPath = path.join(tempDir, 'runner.py');
    await fs.writeFile(pythonRunnerPath, pythonScript);
    
    // Execute the Python script
    const pythonProcess = spawn('python', [pythonRunnerPath]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
    });
    
    await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(stderr || `Process exited with code ${code}`));
            } else {
                resolve(stdout);
            }
        });
    });
    
    // Read the output files
    const resultOutput = await fs.readFile(path.join(tempDir, 'result.txt'), 'utf8');
    const transformedContent = await fs.readFile(path.join(tempDir, 'output.csv'), 'utf8');
    
    // Upload the transformed dataset back to Supabase storage
    await supabase
      .storage
      .from('datasets')
      .upload(filePath, transformedContent, {
        contentType: 'text/csv',
        upsert: true
      });
    
    // Parse the output to generate preview and stats
    const outputLines = resultOutput.split('\n');
    const previewData = outputLines
      .filter(line => line.startsWith('{') && line.endsWith('}'))
      .map(line => JSON.parse(line));
    
    return {
      status: 'completed',
      message: 'Transformation completed successfully',
      preview: previewData.slice(0, 5), // First 5 rows
      stats: {
        rowsBefore: 1000, // Would extract from actual data
        rowsAfter: 950,     // Would extract from actual data
        columns: 10,        // Would extract from actual data
        transformationsApplied: 1
      }
    };
    
  } finally {
    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
  }
  */
  
  // For simulation purposes, determine the type of transformation based on the code content
  const isRegression = code.includes('regression') || code.includes('LabelEncoder') || code.includes('StandardScaler');
  const isMissingValue = code.includes('fillna') || code.includes('missing');
  const isNormalization = code.includes('StandardScaler') || code.includes('MinMaxScaler');
  
  // Generate appropriate mock results based on transformation type
  let preview: any[] = [
    { col1: 'value1', col2: 'value2', col3: 'value3' },
    { col1: 'value4', col2: 'value5', col3: 'value6' }
  ];
  
  let stats: any = {
    rowsBefore: 100,
    rowsAfter: 95,
    columns: 3,
    transformationsApplied: 1
  };
  
  if (isRegression) {
    preview = [
      { feature1: 1.2, feature2: 0.8, target: 42.5 },
      { feature1: 0.9, feature2: 1.1, target: 38.2 },
      { feature1: 1.5, feature2: 0.5, target: 51.7 }
    ];
    stats = {
      rowsBefore: 1000,
      rowsAfter: 950, // Some rows removed due to outliers
      columns: 10,   // More columns after feature engineering
      transformationsApplied: 5, // Multiple transformations for regression readiness
      regressionReady: true,
      featuresEncoded: 3, // Number of categorical features encoded
      missingValuesHandled: true,
      outliersRemoved: 50
    };
  } else if (isMissingValue) {
    stats = {
      ...stats,
      missingValuesHandled: true,
      missingValuesCount: 45
    };
  } else if (isNormalization) {
    stats = {
      ...stats,
      normalized: true,
      scaledColumns: 5
    };
  }
  
  return {
    status: 'completed',
    message: isRegression ? 'Dataset prepared for regression analysis' : 'Transformation completed successfully',
    preview,
    stats
  };
}