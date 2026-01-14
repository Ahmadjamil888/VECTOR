"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background/80 backdrop-blur">
      <div className="flex items-center gap-2 font-bold text-xl">
        <Image 
          src="/images/logo.png" 
          alt="Vector" 
          width={32} 
          height={32} 
          className="h-8 w-8 rounded-lg dark:hidden" 
        />
        <Image 
          src="/images/logo-dark-mode.png" 
          alt="Vector" 
          width={32} 
          height={32} 
          className="h-8 w-8 rounded-lg hidden dark:block" 
        />
        <span>Vector</span>
      </div>
      <nav className="ml-8 hidden md:flex gap-6 text-sm">
        <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
        <Link href="#enterprise" className="text-muted-foreground hover:text-foreground">Enterprise</Link>
        <Link href="#subscription" className="text-muted-foreground hover:text-foreground">Pricing</Link>
        <Link href="#resources" className="text-muted-foreground hover:text-foreground">Resources</Link>
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" className="rounded-full px-4">Sign in</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="rounded-full px-4">Get started free</Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button variant="ghost" className="rounded-full px-4">Dashboard</Button>
          </Link>
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8"
              }
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}