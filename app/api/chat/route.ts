import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const requestedModel = body.model as string | undefined;
    const modelMap: Record<string, string> = {
      "llama-3.3-70b-versatile": "llama3-70b-8192",
      "llama-3.1-8b-instant": "llama3-8b-8192",
      "llama3-70b-8192": "llama3-70b-8192",
      "llama3-8b-8192": "llama3-8b-8192",
    };
    const effectiveModel = requestedModel && modelMap[requestedModel] ? modelMap[requestedModel] : "llama3-70b-8192";
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }
    const openAIMessages = messages.map((m: VercelChatMessage) => ({
      role: m.role,
      content: m.content,
    }));
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages: openAIMessages,
        temperature: 0.2,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Groq API error" }, { status: res.status || 500 });
    }
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();
    let buffer = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        async function read() {
          const { value, done } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          buffer += textDecoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const content =
                json?.choices?.[0]?.delta?.content ??
                json?.choices?.[0]?.message?.content ??
                "";
              if (content) {
                controller.enqueue(textEncoder.encode(content));
              }
            } catch {}
          }
          await read();
        }
        await read();
      },
    });
    return new StreamingTextResponse(stream);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
