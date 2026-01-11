import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"
  const type = requestUrl.searchParams.get("type") || "oauth"
  
  // Check for error details in the URL as per Supabase documentation
  const error_code = requestUrl.searchParams.get("error_code")
  const error_description = requestUrl.searchParams.get("error_description")
  
  if (error_code) {
    console.error('Supabase auth error:', error_code, error_description);
    // Redirect to login with error information
    const errorUrl = new URL('/login', request.url);
    errorUrl.searchParams.set('error', error_description || 'Authentication failed');
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => {
            const store = await cookies()
            const all = store.getAll()
            return all.map(({ name, value }) => ({ name, value }))
          },
          setAll: async (list) => {
            const store = await cookies()
            for (const { name, value, options } of list) {
              store.set({ name, value, ...options })
            }
          },
        },
      }
    )
    
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // If it's an email confirmation, redirect to login, otherwise to the origin
      const fallbackUrl = type === "email_confirm" ? "/login" : "/dashboard";
      return NextResponse.redirect(new URL(fallbackUrl, request.url));
    }
  }
  
  return NextResponse.redirect(new URL(next, request.url))
}
