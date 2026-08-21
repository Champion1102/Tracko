import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Nunito } from "next/font/google";
import { THEME_COOKIE, parseTheme, themeAttr } from "@/lib/theme";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Tracko",
  description: "90 days. Ten habits. One Dyson.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tracko",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0710" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read on the server, so the very first byte of HTML already carries the
  // right theme. No script, no flash, nothing for React to strip.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="en" className={nunito.variable} data-theme={themeAttr(theme)}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
