import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { WalletProvider } from "@/components/WalletProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Stardrop — Gift-wrap XLM into a link",
  description:
    "Gift-wrap XLM into a shareable link. They claim it when they're ready. Trustless gifting on Stellar testnet, powered by claimable balances.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WalletProvider>
          <SiteHeader />
          <main className="flex-1 w-full">{children}</main>
          <SiteFooter />
          <Toaster
            position="top-center"
            richColors
            toastOptions={{ style: { borderRadius: "0.9rem" } }}
          />
        </WalletProvider>
      </body>
    </html>
  );
}
