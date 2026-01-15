import { GoogleGenerativeAI } from "@google/generative-ai";

interface DatasetModificationRequest {
  datasetId: string;
  prompt: string;
  currentData: {
    headers: string[];
    data: any[][];
  };
}

interface DatasetModificationResponse {
  modification: string;
  newData?: {
    headers: string[];
    data: any[][];
  };
}

export async function modifyDatasetWithAI(request: DatasetModificationRequest): Promise<DatasetModificationResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // Create a sample of the current data for context
  const sampleData = request.currentData.data.slice(0, 5); // Take first 5 rows as sample
  const csvPreview = [request.currentData.headers, ...sampleData]
    .map(row => row.join(','))
    .join('\n');

  const prompt = `
You are a data manipulation expert. The user wants to modify their dataset based on their request.
Current dataset preview:
${csvPreview}

User request: ${request.prompt}

Please provide the modified dataset in the same format. Return the result as JSON with two properties:
1. "modification" - a description of what changes were made
2. "newData" - an object with "headers" (array of column names) and "data" (array of rows, each row is an array of values)

IMPORTANT: Maintain the same number of columns and data types where possible. Only make the changes requested by the user.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```|{[\s\S]*}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonString);
      return parsed;
    } else {
      // If no JSON found, return a simple response
      return {
        modification: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
      };
    }
  } catch (error) {
    console.error("Error in AI dataset modification:", error);
    throw new Error("Failed to process dataset modification with AI");
  }
}