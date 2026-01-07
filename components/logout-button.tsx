"use client"

import { supabase } from "@/lib/supabase/client"

export default function LogoutButton() {
  return (
    <button onClick={() => supabase.auth.signOut()}>
      Logout
    </button>
  )
}
