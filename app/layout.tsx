import "./globals.css";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import type { Metadata } from "next";

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap", // SEO + performance
});

export const metadata: Metadata = {
  title: {
    default: "Vector — AI Data Science Platform",
    template: "%s | Vector",
  },
  description:
    "Vector is an AI-powered data science platform for cleaning, editing, analyzing, and preparing datasets using conversational AI.",
  applicationName: "Vector",
  metadataBase: new URL("https://vector-e55x.vercel.app/"), // 🔴 replace with your real domain
  keywords: [
    "AI data science",
    "dataset cleaning",
    "AI dataset editor",
    "machine learning data",
    "LLM ready datasets",
    "data preprocessing",
  ],
  authors: [{ name: "Vector Team" }],
  creator: "Vector",
  publisher: "Vector",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/images/favicon.ico",
    shortcut: "/images/favicon.ico",
    apple: "/images/favicon.ico",
  },

  openGraph: {
    title: "Vector — AI Data Science Platform",
    description:
      "Upload datasets, interact with them using AI, clean data, and prepare LLM-ready datasets effortlessly.",
    url: "https://vector-e55x.vercel.app/", // 🔴 replace
    siteName: "Vector",
    images: [
      {
        url: "/images/og-image.png", // optional but recommended
        width: 1200,
        height: 630,
        alt: "Vector AI Data Science Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Vector — AI Data Science Platform",
    description:
      "AI-powered platform for dataset cleaning, editing, and analysis.",
    images: ["/images/og-image.png"], // same as OG
    creator: "@vector_ai", // optional
  },

  alternates: {
    canonical: "https://vector-e55x.vercel.app/", // 🔴 replace
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={publicSans.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
          >
            <NuqsAdapter>
              {children}
              <Toaster />
            </NuqsAdapter>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
