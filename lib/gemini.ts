import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function callGemini(dataset: any, prompt: string) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Prepare a summary of the dataset to send to Gemini
      const datasetSummary = {
        shape: [dataset.length, Object.keys(dataset[0] || {}).length],
        columns: Object.keys(dataset[0] || {}),
        sample: dataset.slice(0, 5)
      };
      
      const formattedPrompt = `
        You are a data science assistant. Based on the user's request and the provided dataset, generate a sequence of data processing steps.
        
        Dataset Info:
        - Shape: ${datasetSummary.shape}
        - Columns: ${datasetSummary.columns.join(', ')}
        - Sample rows: ${JSON.stringify(datasetSummary.sample)}
        
        User request: "${prompt}"
        
        Respond with a JSON object containing an array of steps to execute. Each step should have a "tool" name and "args" object.
        
        Available tools:
        - "cleaner": Cleans dataset (removes duplicates, fills missing values, normalizes columns)
          Args: { options?: { fillValue?: any, strategy?: 'mean' | 'median' | 'mode' | 'constant' } }
        - "summarizer": Returns dataset summary (shape, stats, correlations)
          Args: {}
        - "chartCreator": Creates charts
          Args: { columns: string[], chartType: 'histogram' | 'scatter' | 'bar' | 'line' | 'box' }
        - "trainModel": Trains ML model
          Args: { targetColumn: string, modelType: 'linear' | 'polynomial' | 'knn' | 'regression' }
        
        Example response:
        {
          "steps": [
            {"tool": "cleaner", "args": {"options": {"strategy": "mean"}}},
            {"tool": "chartCreator", "args": {"columns": ["age"], "chartType": "histogram"}},
            {"tool": "trainModel", "args": {"targetColumn": "target", "modelType": "linear"}}
          ]
        }
        
        Only respond with the JSON object, nothing else.
      `;
      
      const result = await model.generateContent(formattedPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response (in case there's extra text)
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonString = text.substring(jsonStart, jsonEnd);
      
      const parsedResponse = JSON.parse(jsonString);
      return parsedResponse;
    } catch (err) {
      attempt++;
      console.warn(`Gemini API call failed, retrying (${attempt}/${maxRetries}):`, err);
      if (attempt >= maxRetries) {
        throw new Error(`Gemini API call failed after ${maxRetries} attempts: ${(err as Error).message}`);
      }
      // Exponential backoff
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
}