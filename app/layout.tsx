import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ChatSidebar } from "@/components/chat-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { Providers } from "./providers";
import { AuthProvider } from "@/lib/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://mcp.scira.ai"),
  title: "Scira MCP Chat",
  description: "Scira MCP Chat is a minimalistic MCP client with a good feature set.",
  openGraph: {
    siteName: "Scira MCP Chat",
    url: "https://mcp.scira.ai",
    images: [
      {
        url: "https://mcp.scira.ai/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scira MCP Chat",
    description: "Scira MCP Chat is a minimalistic MCP client with a good feature set.",
    images: ["https://mcp.scira.ai/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className}`}>
        <AuthProvider>
          <Providers>
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
          </Providers>
        </AuthProvider>
        <Analytics />
        <Script defer src="https://cloud.umami.is/script.js" data-website-id="1373896a-fb20-4c9d-b718-c723a2471ae5" />
      </body>
    </html>
  );
}
