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
import { ToggleCheckbox } from "@/components/ui/toggle-checkbox"

/* ---------------------------------------------
   ✅ Single source of truth for site URL
---------------------------------------------- */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://vector-e55x.vercel.app"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isNotARobot, setIsNotARobot] = useState(false)

  /* ---------------------------------------------
     Show OAuth / callback errors once
  ---------------------------------------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")

    if (error) {
      toast.error(decodeURIComponent(error))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  /* ---------------------------------------------
     Email + Password Login
  ---------------------------------------------- */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isNotARobot) {
      toast.error("Please confirm you're not a robot")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  /* ---------------------------------------------
     OAuth Login
  ---------------------------------------------- */
  const signInWithGoogle = async () => {
    if (!isNotARobot) {
      toast.error("Please confirm you're not a robot")
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${SITE_URL}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      toast.error(error.message)
    }
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
            <div className="text-xl font-semibold glow-text">Vector</div>
          </div>
          <h1 className="text-4xl font-bold glow-text mb-4">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Sign in to access your datasets, projects, and analytics.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <Card className="w-full max-w-sm glow-box bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl glow-text">Login</CardTitle>
            <CardDescription>
              Use your email or continue with Google
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Email Login */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <ToggleCheckbox
                checked={isNotARobot}
                onCheckedChange={setIsNotARobot}
                label="I'm not a robot"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
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
              onClick={signInWithGoogle}
              className="w-full gap-2"
            >
              <GoogleIcon />
              Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link
                href="/signup"
                className="underline text-primary"
              >
                Create one
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
