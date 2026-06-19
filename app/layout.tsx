import type { Metadata } from "next";
import { AuthProvider } from "@/components/ams/auth/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Real AMS",
  description: "Atlas FC athlete monitoring system for load, medical, testing, recovery, and player context.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
