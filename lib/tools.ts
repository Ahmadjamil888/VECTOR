import { Matrix } from 'ml-matrix';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { PolynomialRegression } from 'ml-regression-polynomial';
import { kmeans } from 'ml-kmeans';
import { euclidean } from 'ml-distance-euclidean';

// Helper function to get column data as numbers
function getColumnAsNumbers(dataset: any[], columnName: string): number[] {
  return dataset
    .map(row => parseFloat(row[columnName]))
    .filter(val => !isNaN(val));
}

// Helper function to get column data as array
function getColumnData(dataset: any[], columnName: string): any[] {
  return dataset.map(row => row[columnName]);
}

// Cleaner tool
export async function cleaner(dataset: any[], options?: { fillValue?: any; strategy?: 'mean' | 'median' | 'mode' | 'constant' }) {
  const cleanedData = JSON.parse(JSON.stringify(dataset)); // Deep copy
  
  if (!options) options = { strategy: 'mean' };
  
  const columns = Object.keys(dataset[0] || {});
  
  // Identify missing values and handle them
  for (const col of columns) {
    const values = cleanedData.map((row: any) => row[col]);
    const missingIndices = values.map((val: any, idx: number) => val === null || val === undefined || val === '' ? idx : -1).filter((idx: number) => idx !== -1);
    
    if (missingIndices.length > 0) {
      let fillValue = options.fillValue;
      
      if (!fillValue && options.strategy) {
        const nonMissingValues = values.filter((val: any) => val !== null && val !== undefined && val !== '');
        
        if (options.strategy === 'mean') {
          const numericValues = nonMissingValues.map((v: any) => typeof v === 'number' ? v : parseFloat(v)).filter((v: any) => !isNaN(v));
          fillValue = numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length;
        } else if (options.strategy === 'median') {
          const numericValues = nonMissingValues.map((v: any) => typeof v === 'number' ? v : parseFloat(v)).filter((v: any) => !isNaN(v)).sort((a: number, b: number) => a - b);
          const mid = Math.floor(numericValues.length / 2);
          fillValue = numericValues.length % 2 === 0 ? (numericValues[mid - 1] + numericValues[mid]) / 2 : numericValues[mid];
        } else if (options.strategy === 'mode') {
          const counts: { [key: string]: number } = {};
          nonMissingValues.forEach((v: any) => {
            const key = String(v);
            counts[key] = (counts[key] || 0) + 1;
          });
          fillValue = Object.keys(counts).reduce((a: string, b: string) => counts[a] > counts[b] ? a : b);
        } else if (options.strategy === 'constant') {
          fillValue = 0;
        }
      }
      
      // Fill missing values
      missingIndices.forEach((idx: number) => {
        cleanedData[idx][col] = fillValue;
      });
    }
  }
  
  // Remove duplicate rows
  const seen = new Set();
  const uniqueData = [];
  for (const row of cleanedData) {
    const rowStr = JSON.stringify(row);
    if (!seen.has(rowStr)) {
      seen.add(rowStr);
      uniqueData.push(row);
    }
  }
  
  return uniqueData;
}

// Summarizer tool
export async function summarizer(dataset: any[]) {
  if (!dataset || dataset.length === 0) {
    return {
      shape: [0, 0],
      columns: [],
      stats: {},
      correlations: {}
    };
  }
  
  const columns = Object.keys(dataset[0] || {});
  const shape = [dataset.length, columns.length];
  
  // Calculate statistics for numeric columns
  const stats: { [key: string]: any } = {};
  for (const col of columns) {
    const values = dataset.map(row => row[col]).filter(val => val !== null && val !== undefined);
    const numericValues = values.map(v => typeof v === 'number' ? v : parseFloat(v)).filter(v => !isNaN(v));
    
    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a: number, b: number) => a - b);
      const count = numericValues.length;
      const sum = numericValues.reduce((a: number, b: number) => a + b, 0);
      const mean = sum / count;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const q1 = sorted[Math.floor(count * 0.25)];
      const q3 = sorted[Math.floor(count * 0.75)];
      const median = sorted[Math.floor(count / 2)];
      const stdDev = Math.sqrt(numericValues.reduce((sq: number, n: number) => sq + Math.pow(n - mean, 2), 0) / count);
      
      stats[col] = {
        count,
        mean,
        std: stdDev,
        min,
        max,
        q1,
        q3,
        median
      };
    } else {
      // For non-numeric columns
      const uniqueValues = [...new Set(values)];
      stats[col] = {
        count: values.length,
        unique: uniqueValues.length,
        top: uniqueValues[0],
        topFreq: values.filter(v => v === uniqueValues[0]).length
      };
    }
  }
  
  // Calculate correlations between numeric columns
  const numericColumns = columns.filter(col => {
    const values = dataset.map(row => row[col]).filter(val => val !== null && val !== undefined);
    const numericValues = values.map((v: any) => typeof v === 'number' ? v : parseFloat(v)).filter((v: any) => !isNaN(v));
    return numericValues.length === values.length; // All values are numeric
  });
  
  const correlations: { [key: string]: any } = {};
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      const values1 = getColumnAsNumbers(dataset, col1);
      const values2 = getColumnAsNumbers(dataset, col2);
      
      if (values1.length === values2.length && values1.length > 1) {
        // Calculate Pearson correlation coefficient
        const n = values1.length;
        const sum1 = values1.reduce((a: number, b: number) => a + b, 0);
        const sum2 = values2.reduce((a: number, b: number) => a + b, 0);
        const sum1Sq = values1.reduce((a: number, b: number) => a + b * b, 0);
        const sum2Sq = values2.reduce((a: number, b: number) => a + b * b, 0);
        const pSum = values1.reduce((sum: number, val: number, idx: number) => sum + val * values2[idx], 0);
        
        const num = pSum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1Sq - (sum1 * sum1 / n)) * (sum2Sq - (sum2 * sum2 / n)));
        
        if (den === 0) {
          correlations[`${col1}-${col2}`] = 0;
        } else {
          correlations[`${col1}-${col2}`] = num / den;
        }
      }
    }
  }
  
  return {
    shape,
    columns,
    stats,
    correlations
  };
}

// Chart creator tool
export async function chartCreator(dataset: any[], columns: string[], chartType: 'histogram' | 'scatter' | 'bar' | 'line' | 'box') {
  try {
    // Prepare data for chart based on chart type
    let plotData: Partial<Plotly.PlotData>[];
    
    switch (chartType) {
      case 'histogram':
        if (columns.length !== 1) {
          throw new Error('Histogram requires exactly one column');
        }
        const histogramData = getColumnAsNumbers(dataset, columns[0]);
        plotData = [{
          x: histogramData,
          type: 'histogram',
          name: columns[0]
        }];
        break;
        
      case 'scatter':
        if (columns.length !== 2) {
          throw new Error('Scatter plot requires exactly two columns');
        }
        plotData = [{
          x: getColumnAsNumbers(dataset, columns[0]),
          y: getColumnAsNumbers(dataset, columns[1]),
          mode: 'markers',
          type: 'scatter',
          name: `${columns[0]} vs ${columns[1]}`
        }];
        break;
        
      case 'bar':
        if (columns.length !== 1 && columns.length !== 2) {
          throw new Error('Bar chart requires one or two columns');
        }
        if (columns.length === 1) {
          // Count occurrences of each value
          const values = getColumnData(dataset, columns[0]);
          const counts: { [key: string]: number } = {};
          values.forEach((v: any) => {
            const key = String(v);
            counts[key] = (counts[key] || 0) + 1;
          });
          
          plotData = [{
            x: Object.keys(counts),
            y: Object.values(counts),
            type: 'bar'
          }];
        } else {
          plotData = [{
            x: getColumnData(dataset, columns[0]),
            y: getColumnAsNumbers(dataset, columns[1]),
            type: 'bar'
          }];
        }
        break;
        
      case 'line':
        if (columns.length !== 2) {
          throw new Error('Line chart requires exactly two columns');
        }
        plotData = [{
          x: getColumnAsNumbers(dataset, columns[0]),
          y: getColumnAsNumbers(dataset, columns[1]),
          mode: 'lines',
          type: 'scatter',
          name: `${columns[0]} vs ${columns[1]}`
        }];
        break;
        
      case 'box':
        if (columns.length !== 1) {
          throw new Error('Box plot requires exactly one column');
        }
        plotData = [{
          y: getColumnAsNumbers(dataset, columns[0]),
          type: 'box',
          name: columns[0]
        }];
        break;
        
      default:
        throw new Error(`Unsupported chart type: ${chartType}`);
    }
    
    const layout: Partial<Plotly.Layout> = {
      title: `${chartType} of ${columns.join(', ')}`,
      width: 600,
      height: 400
    };
    
    // Generate the plot as a data URL (base64)
    const config: Partial<Plotly.Config> = { displayModeBar: false, displaylogo: false };
    
    // Note: Plotly.toImage is not available in node environment, so we'll return the plot data
    // In a real implementation, you'd use a headless browser or a different charting library for server-side rendering
    return {
      chartType,
      columns,
      plotData,
      layout,
      // In a real implementation, you'd generate the actual image here
      base64: `data:image/png;base64,${Buffer.from(JSON.stringify({ plotData, layout })).toString('base64')}`,
      description: `Generated ${chartType} for columns: ${columns.join(', ')}`
    };
  } catch (error) {
    throw new Error(`Error creating chart: ${(error as Error).message}`);
  }
}

// Train model tool
export async function trainModel(dataset: any[], targetColumn: string, modelType: 'linear' | 'polynomial' | 'knn' | 'regression') {
  try {
    // Identify feature columns (all except target)
    const allColumns = Object.keys(dataset[0] || {});
    const featureColumns = allColumns.filter(col => col !== targetColumn);
    
    if (featureColumns.length === 0) {
      throw new Error('No feature columns available for training');
    }
    
    // Extract target values
    const targetValues = getColumnAsNumbers(dataset, targetColumn);
    
    // Extract feature values
    const featureMatrix = new Matrix(dataset.length, featureColumns.length);
    for (let i = 0; i < dataset.length; i++) {
      for (let j = 0; j < featureColumns.length; j++) {
        featureMatrix.set(i, j, parseFloat(dataset[i][featureColumns[j]]) || 0);
      }
    }
    
    let model: any;
    let predictions: number[] = [];
    let metrics: { [key: string]: any } = {};
    
    switch (modelType) {
      case 'linear':
      case 'regression':
        // For multivariate linear regression, we'll use a simple approach
        // In a real implementation, you'd use proper multivariate regression
        if (featureColumns.length === 1) {
          const xValues = getColumnAsNumbers(dataset, featureColumns[0]);
          const regression = new SimpleLinearRegression(xValues, targetValues) as any;
          
          model = regression;
          predictions = xValues.map(x => regression.predict(x));
        } else {
          // For multiple features, we'll use a basic approach
          // In a real implementation, you'd use proper multivariate regression
          const xValues = featureMatrix.to2DArray().map((row: number[]) => row[0]); // Use first feature for simplicity
          const regression = new SimpleLinearRegression(xValues, targetValues) as any;
          
          model = regression;
          predictions = xValues.map(x => regression.predict(x));
        }
        
        // Calculate metrics
        const ssRes = targetValues.reduce((sum: number, actual: number, idx: number) => {
          const diff = actual - predictions[idx];
          return sum + diff * diff;
        }, 0);
        const ssTot = targetValues.reduce((sum: number, actual: number) => {
          const mean = targetValues.reduce((a: number, b: number) => a + b, 0) / targetValues.length;
          const diff = actual - mean;
          return sum + diff * diff;
        }, 0);
        const r2 = 1 - (ssRes / ssTot);
        const mse = ssRes / targetValues.length;
        const rmse = Math.sqrt(mse);
        
        metrics = {
          r2,
          mse,
          rmse,
          modelType: 'linear'
        };
        break;
        
      case 'polynomial':
        if (featureColumns.length === 1) {
          const xValues = getColumnAsNumbers(dataset, featureColumns[0]);
          const regression = new PolynomialRegression(xValues, targetValues, 2) as any; // degree 2
          
          model = regression;
          predictions = xValues.map(x => regression.predict(x));
        } else {
          throw new Error('Polynomial regression currently only supports single feature');
        }
        
        // Calculate metrics
        const poly_ssRes = targetValues.reduce((sum: number, actual: number, idx: number) => {
          const diff = actual - predictions[idx];
          return sum + diff * diff;
        }, 0);
        const poly_ssTot = targetValues.reduce((sum: number, actual: number) => {
          const mean = targetValues.reduce((a: number, b: number) => a + b, 0) / targetValues.length;
          const diff = actual - mean;
          return sum + diff * diff;
        }, 0);
        const poly_r2 = 1 - (poly_ssRes / poly_ssTot);
        const poly_mse = poly_ssRes / targetValues.length;
        const poly_rmse = Math.sqrt(poly_mse);
        
        metrics = {
          r2: poly_r2,
          mse: poly_mse,
          rmse: poly_rmse,
          modelType: 'polynomial'
        };
        break;
        
      case 'knn':
        // For KNN, we'll use a basic approach
        // In a real implementation, you'd use proper KNN algorithm
        const k = Math.min(3, Math.floor(Math.sqrt(dataset.length))); // Choose k as sqrt(n) or 3, whichever is smaller
        const kmeansResult = kmeans(featureMatrix.to2DArray(), k, { maxIterations: 100 });
        const clusterLabels = kmeansResult.clusters;
        
        // Predict using cluster centroids
        const centroids = kmeansResult.centroids;
        predictions = [];
        for (const row of featureMatrix.to2DArray()) {
          // Find the closest centroid
          let minDist = Infinity;
          let closestCluster = 0;
          for (let c = 0; c < centroids.length; c++) {
            const dist = euclidean(row, centroids[c]);
            if (dist < minDist) {
              minDist = dist;
              closestCluster = c;
            }
          }
          
          // Predict using the average target value for this cluster
          const clusterTargets = targetValues.filter((_, idx: number) => clusterLabels[idx] === closestCluster);
          if (clusterTargets.length > 0) {
            const avgTarget = clusterTargets.reduce((a: number, b: number) => a + b, 0) / clusterTargets.length;
            predictions.push(avgTarget);
          } else {
            predictions.push(targetValues.reduce((a: number, b: number) => a + b, 0) / targetValues.length); // fallback to overall average
          }
        }
        
        // Calculate metrics
        const knn_ssRes = targetValues.reduce((sum: number, actual: number, idx: number) => {
          const diff = actual - predictions[idx];
          return sum + diff * diff;
        }, 0);
        const knn_ssTot = targetValues.reduce((sum: number, actual: number) => {
          const mean = targetValues.reduce((a: number, b: number) => a + b, 0) / targetValues.length;
          const diff = actual - mean;
          return sum + diff * diff;
        }, 0);
        const knn_r2 = 1 - (knn_ssRes / knn_ssTot);
        const knn_mse = knn_ssRes / targetValues.length;
        const knn_rmse = Math.sqrt(knn_mse);
        
        metrics = {
          r2: knn_r2,
          mse: knn_mse,
          rmse: knn_rmse,
          modelType: 'knn',
          k
        };
        break;
        
      default:
        throw new Error(`Unsupported model type: ${modelType}`);
    }
    
    return {
      modelType,
      targetColumn,
      featureColumns,
      metrics,
      predictions: predictions.slice(0, 10), // Return first 10 predictions as sample
      description: `Trained ${modelType} model to predict ${targetColumn} using ${featureColumns.join(', ')}`
    };
  } catch (error) {
    throw new Error(`Error training model: ${(error as Error).message}`);
  }
}

// Execute tools dynamically
export async function executeTools(dataset: any, steps: any[]) {
  validateGeminiSteps(steps);
  
  const results: any = { 
    dataset: JSON.parse(JSON.stringify(dataset)), // Deep copy to avoid mutation
    charts: [], 
    metrics: {},
    summaries: [],
    logs: []
  };

  for (const step of steps) {
    try {
      results.logs.push(`Executing tool: ${step.tool} with args: ${JSON.stringify(step.args)}`);
      
      switch (step.tool) {
        case "cleaner":
          results.dataset = await cleaner(results.dataset, step.args.options);
          results.logs.push(`Cleaner tool completed`);
          break;
        case "summarizer":
          const summary = await summarizer(results.dataset);
          results.summaries.push(summary);
          results.logs.push(`Summarizer tool completed`);
          break;
        case "chartCreator":
          const chart = await chartCreator(results.dataset, step.args.columns, step.args.chartType);
          results.charts.push(chart);
          results.logs.push(`Chart creator tool completed`);
          break;
        case "trainModel":
          const modelResult = await trainModel(results.dataset, step.args.targetColumn, step.args.modelType);
          results.metrics[step.args.modelType] = modelResult;
          results.logs.push(`Train model tool completed`);
          break;
        default:
          results.logs.push(`Unknown tool: ${step.tool}`);
          console.warn(`Unknown tool: ${step.tool}`);
      }
    } catch (err) {
      results.logs.push(`Error executing tool ${step.tool}: ${(err as Error).message}`);
      console.error(`Error executing tool ${step.tool}:`, err);
      // Continue to next tool instead of failing completely
    }
  }

  return results;
}

// Validate Gemini response
function validateGeminiSteps(steps: any[]) {
  if (!steps || !Array.isArray(steps)) {
    throw new Error("Gemini response is missing 'steps' or it's not an array");
  }
  
  steps.forEach((step, idx) => {
    if (!step.tool || !step.args) {
      throw new Error(`Invalid step at index ${idx}: missing tool or args`);
    }
    
    // Validate tool name
    const validTools = ['cleaner', 'summarizer', 'chartCreator', 'trainModel'];
    if (!validTools.includes(step.tool)) {
      throw new Error(`Invalid tool at index ${idx}: ${step.tool}`);
    }
  });
}