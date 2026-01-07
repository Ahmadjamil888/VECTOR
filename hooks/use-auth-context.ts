"use client"

import { createContext, useContext } from "react"
import type { Session } from "@supabase/supabase-js"

type AuthContextValue = {
  session: Session | undefined | null
  isLoading: boolean
  profile: any
  isLoggedIn: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  session: undefined,
  isLoading: false,
  profile: null,
  isLoggedIn: false,
})

export function useAuthContext() {
  return useContext(AuthContext)
}
