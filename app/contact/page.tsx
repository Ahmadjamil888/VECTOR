"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="flex items-center gap-2 font-bold text-xl">
          <img src="/images/logo.png" alt="Vector" className="h-8 w-8 rounded-lg" />
          <span>Vector</span>
        </div>
        <nav className="ml-8 hidden md:flex gap-6 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
          <Link href="/#features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="/#enterprise" className="text-muted-foreground hover:text-foreground">Enterprise</Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="/#resources" className="text-muted-foreground hover:text-foreground">Resources</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" className="rounded-full px-4">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full px-4">Try now</Button>
          </Link>
        </div>
      </header>

      <main className="px-6 md:px-10 min-h-screen flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
          <p className="mt-4 text-muted-foreground">Get in touch with us.</p>
          <div className="mt-8 rounded-2xl border bg-card p-8">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-lg">vector@gmail.com</div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="text-sm text-muted-foreground">Phone</div>
              <div className="text-lg">+92 3338188722</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-10 py-10 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-2 font-semibold">
              <img src="/images/logo.png" alt="Vector" className="h-8 w-8 rounded-lg" />
              <span>Vector</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link href="/#pricing" className="hover:text-foreground">Pricing</Link>
              <Link href="/#features" className="hover:text-foreground">Features</Link>
              <Link href="/#resources" className="hover:text-foreground">Resources</Link>
              <Link href="/#enterprise" className="hover:text-foreground">Enterprise</Link>
              <Link href="/login" className="hover:text-foreground">Sign in</Link>
              <Link href="/signup" className="hover:text-foreground">Try now</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
            </div>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">© 2026 Vector Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
