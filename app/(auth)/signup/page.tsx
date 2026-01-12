"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/* ---------------------------------------------
   Single source of truth for site URL
---------------------------------------------- */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://vector-e55x.vercel.app"

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  /* ---------------------------------------------
     Redirect if already logged in (SAFE)
  ---------------------------------------------- */
  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (mounted && data.session) {
          router.replace("/dashboard")
        }
      } catch {
        // ignore
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/dashboard")
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  /* ---------------------------------------------
     OAuth Signup
  ---------------------------------------------- */
  const handleOAuth = async (provider: "google") => {
    if (!acceptTerms) {
      toast.error("Please accept the Terms & Privacy Policy")
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${SITE_URL}/auth/callback`,
      },
    })

    if (error) toast.error(error.message)
  }

  /* ---------------------------------------------
     Email + Password Signup
  ---------------------------------------------- */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      toast.error("Please accept the Terms & Privacy Policy")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(
      "Check your email to confirm your account. You’ll be redirected automatically."
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-muted/30 items-center justify-center">
        <div className="max-w-md px-12">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/images/logo.png"
              alt="Vector"
              className="h-10 w-10 rounded-lg dark:hidden"
            />
            <img
              src="/images/logo-dark-mode.png"
              alt="Vector"
              className="h-10 w-10 rounded-lg hidden dark:block"
            />
            <div className="text-xl font-semibold glow-text">
              Vector
            </div>
          </div>

          <h1 className="text-4xl font-bold glow-text mb-4">
            Join us
          </h1>
          <p className="text-muted-foreground">
            Shape the future by becoming our partner.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <Card className="w-full max-w-sm glow-box bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl glow-text">
              Create account
            </CardTitle>
            <CardDescription>
              Sign up with email or continue with Google
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email Signup */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <p className="text-sm text-muted-foreground">
                  I agree to the{" "}
                  <a
                    href="https://zehanxtech.com/terms"
                    target="_blank"
                    className="underline text-primary"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://zehanxtech.com/privacy"
                    target="_blank"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* OAuth */}
            <Button
              variant="outline"
              onClick={() => handleOAuth("google")}
              className="w-full gap-2"
            >
              <GoogleIcon />
              Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline text-primary">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ---------------------------------------------
   Google Icon
---------------------------------------------- */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
