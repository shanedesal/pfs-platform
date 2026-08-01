import { AuthProvider } from "@/lib/auth-context";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const instagramSans = localFont({
  src: [
    {
      path: "../fonts/Instagram Sans Light.ttf",
      weight: "300",
      style: "normal",
    },
    { path: "../fonts/Instagram Sans.ttf", weight: "400", style: "normal" },
    {
      path: "../fonts/Instagram Sans Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Instagram Sans Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-instagram",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "PFS — Products For Sale",
  description: "A marketplace for everything you need, priced to sell.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${instagramSans.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
