"use client"

import { AuthContext } from "@/hooks/use-auth-context"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export default function AuthProvider({ children }: PropsWithChildren) {
  const supabase = createClient()
  const [session, setSession] = useState<Session | undefined | null>()
  const [profile, setProfile] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true)
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error fetching session:", error)
      }
      setSession(data.session)
      setIsLoading(false)
    }
    fetchSession()
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => {
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      if (session?.user?.id) {
        // Fetch user profile through API route
        try {
          const response = await fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include',
          });
          
          if (response.ok) {
            const profile = await response.json();
            // Handle null response when user is not authenticated
            setProfile(profile);
          } else {
            console.error('Failed to fetch profile:', response.status);
            setProfile(null);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null)
      }
      setIsLoading(false);
    }
    fetchProfile()
  }, [session, supabase])

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        profile,
        isLoggedIn: session != undefined && session != null,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
