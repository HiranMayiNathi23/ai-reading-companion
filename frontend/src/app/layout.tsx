import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal AI Reading Companion",
  description: "A private, in-session reading assistant for book page images. Extract text, translate to Telugu, listen to audio, and explore summaries & characters.",
  keywords: ["reading", "OCR", "translation", "Telugu", "TTS", "book reader"],
  robots: "noindex, nofollow", // Private app - don't index
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
