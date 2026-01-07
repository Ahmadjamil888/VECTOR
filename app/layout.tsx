import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import AuthProvider from "@/providers/auth-provider";

const publicSans = Public_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "Vector | AI Data Science Platform",
  description: "AI powered data science platform for cleaning and editing datasets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={publicSans.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <NuqsAdapter>
              {children}
              <Toaster />
            </NuqsAdapter>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
