import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const HF_TOKEN = process.env.HF_TOKEN || process.env.HF_ACCESS_TOKEN;
    
    if (!HF_TOKEN) {
      return NextResponse.json({ error: 'HF token not configured' }, { status: 500 });
    }

    const { prompt } = await req.json();

    // Test the API with a direct fetch to the correct endpoint
    const response = await fetch('https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-7B-Instruct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: `[INST] ${prompt || "What is the capital of Pakistan?"} [/INST]`,
        parameters: {
          max_new_tokens: 200,
          return_full_text: false,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${errorData.error || ''}`);
    }

    const resultData = await response.json();
    
    const result = {
      success: true,
      response: Array.isArray(resultData) ? resultData[0]?.generated_text || 'No response' : 'Invalid response format',
      model: "Qwen/Qwen2.5-Coder-7B-Instruct",
      prompt: prompt || "What is the capital of Pakistan?"
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Qwen API test error:', error);
    return NextResponse.json(
      { 
        error: 'Qwen API request failed',
        details: error.message
      }, 
      { status: 500 }
    );
  }
}