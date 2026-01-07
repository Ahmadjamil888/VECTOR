import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url, token } = await req.json()
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })
    const hfToken = token || process.env.HF_ACCESS_TOKEN
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (hfToken) headers.Authorization = `Bearer ${hfToken}`

    const res = await fetch(url, { headers })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text || "HF download failed" }, { status: res.status })
    }

    const ct = res.headers.get("content-type") || ""
    let rows: any[] = []
    if (ct.includes("text/csv") || url.toLowerCase().endsWith(".csv")) {
      const text = await res.text()
      const lines = text.split("\n")
      const headersRow = lines[0]?.split(",") || []
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",")
        if (parts.length !== headersRow.length) continue
        const obj: Record<string, any> = {}
        headersRow.forEach((h, idx) => (obj[h] = parts[idx]))
        rows.push(obj)
      }
    } else if (ct.includes("application/json") || url.toLowerCase().endsWith(".json")) {
      try {
        const json = await res.json()
        rows = Array.isArray(json) ? json : [json]
      } catch {
        rows = []
      }
    } else {
      return NextResponse.json({ error: "Provide direct CSV/JSON file URL from Hugging Face" }, { status: 400 })
    }

    return NextResponse.json({ data: rows }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
