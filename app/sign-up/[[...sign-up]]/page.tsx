import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
        </div>
      </div>
    </div>
  );
}