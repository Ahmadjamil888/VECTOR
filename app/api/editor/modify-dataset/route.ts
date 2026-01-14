import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { datasetId, prompt, currentData } = await request.json()

    if (!datasetId || !prompt || !currentData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify dataset ownership
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('id, user_id, name')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single()

    if (datasetError || !dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Prepare the data for the AI
    const csvHeaders = currentData.headers
    const csvRows = currentData.data
    
    // Create a sample of the data for context (first 10 rows)
    const sampleData = csvRows.slice(0, 10)
    const dataSample = [csvHeaders, ...sampleData].map(row => row.join(',')).join('\n')

    // System prompt for the AI
    const systemPrompt = `You are an expert data scientist and dataset modifier. Your task is to help users modify their datasets based on their requests.

Current dataset information:
- Name: ${dataset.name}
- Columns: ${csvHeaders.join(', ')}
- Total rows: ${csvRows.length}

Sample data:
${dataSample}

User request: "${prompt}"

Respond with a JSON object containing:
1. "modification": A brief description of what was done
2. "newData": An object with "headers" array and "data" array of rows (if data was modified)
3. "error": Error message if the request cannot be fulfilled

Rules:
- Only make changes that are reasonable and safe
- Preserve data types when possible
- For filtering, return only matching rows
- For column operations, maintain the same number of columns
- If the request is unclear, ask for clarification
- Respond ONLY with valid JSON`

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    
    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let aiResponse
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No valid JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return NextResponse.json({ 
        error: 'Failed to process AI response',
        rawResponse: text 
      }, { status: 500 })
    }

    // Validate the response structure
    if (!aiResponse.modification) {
      return NextResponse.json({ 
        error: 'Invalid AI response format',
        response: aiResponse 
      }, { status: 500 })
    }

    // If newData is provided, validate it
    if (aiResponse.newData) {
      const { headers, data } = aiResponse.newData
      
      // Basic validation
      if (!Array.isArray(headers) || !Array.isArray(data)) {
        return NextResponse.json({ 
          error: 'Invalid data format from AI',
          response: aiResponse 
        }, { status: 500 })
      }

      // Validate that all rows have the same number of columns
      const expectedColumns = headers.length
      const invalidRows = data.filter((row: any[]) => row.length !== expectedColumns)
      
      if (invalidRows.length > 0) {
        return NextResponse.json({ 
          error: 'Data validation failed: inconsistent column count',
          response: aiResponse 
        }, { status: 500 })
      }
    }

    return NextResponse.json(aiResponse)

  } catch (error) {
    console.error('Error in dataset modification:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}