'use client'

import Link from "next/link"
import { 
  HomeIcon, 
  FileTextIcon, 
  SettingsIcon, 
  BoxIcon, 
  CreditCardIcon, 
  UserIcon, 
  DatabaseIcon,
  ActivityIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  // Redirect to /login if user is not authenticated and fetch user data
  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      setAuthed(!!user)
      setUser(user)
      
      if (user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setProfile(profile)
        }
      } else {
        router.push("/login")
      }
    }
    checkAuth()
    return () => { mounted = false }
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      {/* Sidebar */}
      <aside 
        className={cn(
          "hidden border-r border-border bg-card/30 md:flex flex-col transition-all duration-300 ease-in-out relative",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-border px-4", isSidebarCollapsed ? "justify-center" : "")}>
          <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
            <img src="/images/logo.png" alt="Vector" className="h-8 w-8 rounded-lg shrink-0 dark:hidden" />
            <img src="/images/logo-dark-mode.png" alt="Vector" className="h-8 w-8 rounded-lg shrink-0 hidden dark:block" />
            {!isSidebarCollapsed && <span className="text-lg glow-text whitespace-nowrap">Vector</span>}
          </Link>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-2 text-sm font-medium gap-1">
             {!isSidebarCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Platform
                </div>
             )}
            <NavItem href="/dashboard" icon={HomeIcon} label="Overview" collapsed={isSidebarCollapsed} />
            <NavItem href="/dashboard/datasets" icon={FileTextIcon} label="Your Datasets" collapsed={isSidebarCollapsed} />
            <NavItem href="/dashboard/published" icon={DatabaseIcon} label="Published" collapsed={isSidebarCollapsed} />
            
            {!isSidebarCollapsed && (
                <div className="mt-6 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </div>
             )}
            <NavItem href="/dashboard/subscription" icon={CreditCardIcon} label="Subscription" collapsed={isSidebarCollapsed} />
            <NavItem href="/dashboard/profile" icon={UserIcon} label="Profile" collapsed={isSidebarCollapsed} />
            <NavItem href="/dashboard/settings" icon={SettingsIcon} label="Settings" collapsed={isSidebarCollapsed} />
            <NavItem href="/dashboard/usage" icon={ActivityIcon} label="Usage" collapsed={isSidebarCollapsed} />
          </nav>
        </div>

        <div className="p-2 border-t border-border flex items-center justify-between">
           <ThemeToggle />
           <div className="flex items-center gap-2">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={profile?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url} />
                     <AvatarFallback>{user?.email?.[0]?.toUpperCase() || 'V'}</AvatarFallback>
                   </Avatar>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                   Profile
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleLogout}>
                   Log out
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
               className="h-8 w-8 text-muted-foreground"
             >
               {isSidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
             </Button>
           </div>
        </div>
      </aside>
      
      {/* Mobile Header (simplified) */}
      <div className="md:hidden flex items-center p-4 border-b">
         <img src="/images/logo.png" alt="Vector" className="h-8 w-8 rounded-lg mr-2 dark:hidden" />
         <img src="/images/logo-dark-mode.png" alt="Vector" className="h-8 w-8 rounded-lg mr-2 hidden dark:block" />
         <div className="font-bold">Vector</div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  )
}

function NavItem({ href, icon: Icon, label, collapsed }: { href: string, icon: any, label: string, collapsed: boolean }) {
  return (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50",
        collapsed ? "justify-center" : ""
      )}
      href={href}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
