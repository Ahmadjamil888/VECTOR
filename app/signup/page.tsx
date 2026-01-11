"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BoxIcon } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { ToggleCheckbox } from "@/components/ui/toggle-checkbox"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking] = useState(false)
  const [isNotARobot, setIsNotARobot] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
      'http://localhost:3000/'
    // Make sure to include `https://` when not localhost.
    url = url.startsWith('http') ? url : `https://${url}`
    // Make sure to include a trailing `/`.
    url = url.endsWith('/') ? url : `${url}/`
    return url
  }
  
  const handleOAuth = async (provider: 'github' | 'google') => {
    if (!isNotARobot) {
      toast.error("Please confirm that you're not a robot")
      return;
    }
    
    if (!acceptTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy")
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${getURL()}auth/callback?next=/dashboard` },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isNotARobot) {
      toast.error("Please confirm that you're not a robot")
      return
    }
    
    if (!acceptTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy")
      return
    }
    
    setLoading(true)
    try {
      const getURL = () => {
        let url =
          process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
          process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
          'http://localhost:3000/'
        // Make sure to include `https://` when not localhost.
        url = url.startsWith('http') ? url : `https://${url}`
        // Make sure to include a trailing `/`.
        url = url.endsWith('/') ? url : `${url}/`
        return url
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/callback?type=email_confirm&next=/dashboard`,
        },
      })
      if (error) throw error
      toast.success("Check your email to confirm your account. After confirming, you will be redirected to your dashboard.")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
   <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex w-1/2 bg-muted/30 items-center justify-center">
        <div className="max-w-md px-12">
          <div className="flex items-center gap-3 mb-8">
            <img src="/images/logo.png" alt="Vector" className="h-10 w-10 rounded-lg dark:hidden" />
            <img src="/images/logo-dark-mode.png" alt="Vector" className="h-10 w-10 rounded-lg hidden dark:block" />
            <div className="text-xl font-semibold glow-text">Vector</div>
          </div>
          <div className="text-4xl font-bold glow-text mb-4">join us</div>
          <div className="text-muted-foreground">Shape the world by becoming our partner.</div>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <Card className="w-full max-w-sm glow-box bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl glow-text">Sign Up</CardTitle>
            <CardDescription>Create an account with email or Google</CardDescription>
          </CardHeader>
        <CardContent>
            <>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  <ToggleCheckbox
                    checked={isNotARobot}
                    onCheckedChange={setIsNotARobot}
                    label="I'm not a robot"
                  />
                  <div className="mt-4">
                    <div className="flex items-start space-x-2">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="terms"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I agree to the <a href="https://zehanxtech.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms of Service</a> and <a href="https://zehanxtech.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</a>
                        </label>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading || !isNotARobot || !acceptTerms}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Button variant="outline" onClick={() => handleOAuth('google')} className="gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                </div>
                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">Already have an account?</span>{" "}
                  <Link href="/login" className="text-primary underline underline-offset-4">Sign in</Link>
                </div>
            </>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
