import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex w-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
        </div>
      </div>
    </div>
  );
}