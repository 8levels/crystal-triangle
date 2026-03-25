import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crystal Triangle",
  description: "Pairwise priority ranking with the Crystal Triangle method",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-black antialiased">
        {children}
      </body>
    </html>
  );
}
