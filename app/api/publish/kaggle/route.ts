import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { title, description, rows, username, key } = await req.json()
    if (!title || !rows) return NextResponse.json({ error: "Missing title or rows" }, { status: 400 })
    if (!username || !key) {
      return NextResponse.json({ error: "Missing Kaggle credentials" }, { status: 400 })
    }
    // Placeholder: In production integrate Kaggle dataset creation API.
    return NextResponse.json({ ok: true, title, count: Array.isArray(rows) ? rows.length : 0 }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Unexpected error" }, { status: 500 })
  }
}
