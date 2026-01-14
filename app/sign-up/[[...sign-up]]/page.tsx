// Conceptual Clerk SignUp component
// In a real implementation with Clerk installed, you would use:
// import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  // In a real implementation with Clerk:
  // return (
  //   <div className="flex min-h-screen bg-background">
  //     <div className="flex w-full items-center justify-center p-6">
  //       <div className="w-full max-w-sm">
  //         <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
  //       </div>
  //     </div>
  //   </div>
  // );

  // For now, returning a placeholder
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Sign Up</h1>
            <p className="text-muted-foreground mt-2">Clerk authentication will be integrated here</p>
          </div>
          <div className="border rounded-lg p-6 bg-card/60 backdrop-blur">
            <p className="text-center text-sm text-muted-foreground pb-4">
              This page uses Clerk for authentication.
              Please install Clerk to see the full UI.
            </p>
            <div className="text-center">
              <a href="/sign-in" className="text-primary underline">
                Go to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}