"use client";

import React from 'react';
import { ThemeToggle } from "@/components/theme-toggle";

// Define a dynamic UserButton component that loads Clerk when available
const DynamicUserButton = () => {
  const [UserButtonComponent, setUserButtonComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadClerk = async () => {
      try {
        // @ts-ignore - Dynamic import for Clerk
        const clerkModule = await import('@clerk/nextjs');
        setUserButtonComponent(() => clerkModule.UserButton);
      } catch (error) {
        console.warn('Clerk not available, will render fallback', error);
      } finally {
        setLoading(false);
      }
    };

    loadClerk();
  }, []);

  if (loading) {
    // Render a placeholder while checking for Clerk
    return (
      <div className="relative h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (UserButtonComponent) {
    return (
      <UserButtonComponent 
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          }
        }}
      />
    );
  }

  // Fallback to custom profile dropdown
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  );
};

export function UserProfileFooter() {
  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DynamicUserButton />
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}