import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { executeTools } from '@/lib/tools';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    const { dataset, prompt } = await req.json();

    if (!dataset || !prompt) {
      return NextResponse.json(
        { error: "Dataset and prompt are required." },
        { status: 400 }
      );
    }

    // 1️⃣ Call Gemini API
    const geminiResponse = await callGemini(dataset, prompt);
    if (!geminiResponse || !geminiResponse.steps) {
      throw new Error("Invalid response from Gemini API");
    }

    // 2️⃣ Execute tools dynamically
    const results = await executeTools(dataset, geminiResponse.steps);

    // 3️⃣ Send processed data + plots + metrics to frontend
    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Error in /api/process-dataset:", error);

    // Return user-friendly message
    return NextResponse.json(
      {
        error: "Failed to process dataset. Please try again.",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}