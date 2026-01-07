import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url, username, key } = await req.json()
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })
    const kaggleUser = username || process.env.KAGGLE_USERNAME
    const kaggleKey = key || process.env.KAGGLE_KEY
    if (!kaggleUser || !kaggleKey) {
      return NextResponse.json({ error: "Missing Kaggle credentials" }, { status: 400 })
    }
    const m = url.match(/kaggle\.com\/datasets\/([^/]+)\/([^/?#]+)/i)
    if (!m) {
      return NextResponse.json({ error: "Unsupported Kaggle URL; provide direct CSV/JSON link or dataset path" }, { status: 400 })
    }
    const owner = m[1]
    const dataset = m[2]
    const dl = await fetch(`https://www.kaggle.com/api/v1/datasets/download/${owner}/${dataset}?unzip=false`, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${kaggleUser}:${kaggleKey}`).toString("base64"),
      },
    })
    if (!dl.ok) {
      const text = await dl.text()
      return NextResponse.json({ error: text || "Kaggle download failed" }, { status: dl.status })
    }
    const contentType = dl.headers.get("content-type") || ""
    const buf = Buffer.from(await dl.arrayBuffer())
    let rows: any[] = []
    if (contentType.includes("text/csv") || url.toLowerCase().endsWith(".csv")) {
      const text = buf.toString("utf8")
      const lines = text.split("\n")
      const headers = lines[0]?.split(",") || []
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",")
        if (parts.length !== headers.length) continue
        const obj: Record<string, any> = {}
        headers.forEach((h, idx) => (obj[h] = parts[idx]))
        rows.push(obj)
      }
    } else if (contentType.includes("application/json") || url.toLowerCase().endsWith(".json")) {
      try {
        const json = JSON.parse(buf.toString("utf8"))
        rows = Array.isArray(json) ? json : [json]
      } catch {
        rows = []
      }
    } else {
      return NextResponse.json({ error: "Downloaded file not CSV/JSON; please provide direct CSV/JSON link" }, { status: 400 })
    }
    return NextResponse.json({ data: rows }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
