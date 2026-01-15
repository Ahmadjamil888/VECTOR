"use client"

import { createClient } from "@/lib/supabase/client"

export default function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Optionally reload the page or redirect after logout
    window.location.reload();
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  )
}
