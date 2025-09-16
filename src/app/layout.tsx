import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import SEOStructuredData from "@/components/SEOStructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Documentation Generator - Automatically Create GitHub Docs",
    template: "%s | AI Documentation Generator"
  },
  description: "Generate comprehensive documentation for any GitHub repository using AI. Supports OpenAI GPT and Google Gemini for JavaScript, Python, Java, C++, and more programming languages.",
  keywords: ["AI documentation", "GitHub documentation", "code documentation", "OpenAI", "Google Gemini", "automated documentation", "developer tools"],
  authors: [{ name: "Docs Generator Team" }],
  creator: "Docs Generator Team",
  publisher: "Docs Generator Team",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://docs-generator-phi.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Documentation Generator - Automatically Create GitHub Docs",
    description: "Generate comprehensive documentation for any GitHub repository using AI. Supports OpenAI GPT and Google Gemini.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://docs-generator-phi.vercel.app",
    siteName: "AI Documentation Generator",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "AI Documentation Generator",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Documentation Generator - Automatically Create GitHub Docs",
    description: "Generate comprehensive documentation for any GitHub repository using AI.",
    creator: "@docs_generator",
    images: ["/og-image.png"], // You'll need to add this image
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SEOStructuredData />
        <Navigation />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8">
          <div className="container mx-auto px-4 text-center text-slate-600 dark:text-slate-400">
            <p>© {new Date().getFullYear()} AI Documentation Generator. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
