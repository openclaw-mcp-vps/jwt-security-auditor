import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "JWT Security Auditor | Catch Token Vulnerabilities Before Release",
  description:
    "Automated JWT security auditing for startups. Detect weak signing algorithms, missing expiration checks, and broken token validation before shipping.",
  metadataBase: new URL("https://jwt-security-auditor.example.com"),
  openGraph: {
    title: "JWT Security Auditor",
    description:
      "Audit JWT implementations with endpoint testing and claim validation checks. Get a clear report with fixes.",
    type: "website",
    url: "https://jwt-security-auditor.example.com"
  },
  twitter: {
    card: "summary_large_image",
    title: "JWT Security Auditor",
    description:
      "Scan your auth endpoints and tokens for JWT vulnerabilities in minutes, not weeks."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
