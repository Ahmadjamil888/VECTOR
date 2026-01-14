// Conceptual Clerk integration for protected routes
// In a real implementation, you would use: import { auth } from "@clerk/nextjs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Conceptual implementation - in a real app with Clerk installed:
  // const { userId } = auth();
  // if (!userId) {
  //   redirect("/sign-in");
  // }

  // For now, we'll just render the children
  // The actual protection would be handled by Clerk middleware
  return <>{children}</>;
}