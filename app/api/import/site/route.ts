import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 })
    }
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing FIRECRAWL_API_KEY" }, { status: 500 })
    }

    const res = await fetch("https://api.firecrawl.dev/v1/crawl/web", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["json"],
        maxDepth: 0,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: text || "Firecrawl error" }, { status: res.status })
    }
    const data = await res.json()

    const items: any[] = []
    const pages = Array.isArray(data?.data) ? data.data : [data]
    for (const page of pages) {
      const content = page?.markdown || page?.content || page?.text || ""
      const lines = String(content).split("\n").map((l: string) => l.trim()).filter(Boolean)
      for (const l of lines) {
        items.push({ text: l })
      }
    }

    return NextResponse.json({ data: items }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
