import type { Metadata } from "next";
import { Manrope, Space_Grotesk, JetBrains_Mono } from "next/font/google";

import "@/app/globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const title = "JWT Security Auditor | Catch Token Vulnerabilities Before Release";
const description =
  "Audit JWT implementations for weak algorithms, missing expiration checks, and token validation flaws with automated code and endpoint testing.";

export const metadata: Metadata = {
  metadataBase: new URL("https://jwt-security-auditor.example.com"),
  title,
  description,
  keywords: [
    "JWT security",
    "auth security testing",
    "token validation audit",
    "startup security tools",
    "API authentication vulnerabilities",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://jwt-security-auditor.example.com",
    siteName: "JWT Security Auditor",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
