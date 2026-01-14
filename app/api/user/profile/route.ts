import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/* ---------------------------------------------
   Helper (ASYNC — required in Next 14+)
---------------------------------------------- */
async function createSupabase() {
  const cookieStore = await cookies() // ✅ REQUIRED

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

/* ---------------------------------------------
   GET — NEVER 401 (prevents redirect loop)
---------------------------------------------- */
export async function GET() {
  try {
    const supabase = await createSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(null)
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Profile fetch error:", error)
      return NextResponse.json(null)
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error("GET /api/user/profile:", err)
    return NextResponse.json(null)
  }
}

/* ---------------------------------------------
   PUT — AUTH REQUIRED
---------------------------------------------- */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const update: Record<string, any> = {}
    if (body.full_name !== undefined) update.full_name = body.full_name
    if (body.storage_used_mb !== undefined)
      update.storage_used_mb = body.storage_used_mb

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id)

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PUT /api/user/profile:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
