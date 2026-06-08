import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AuroraBackground } from "@/components/aurora-background";

export const metadata: Metadata = {
  title: "השוואת מחירים והטבות",
  description: "השוואת מחירים בין רשתות הסופר ואיתור הטבות אישיות",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AuroraBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
