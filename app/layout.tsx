import type { Metadata } from "next";
import { Barlow, Bungee } from "next/font/google";
import "./globals.css";

// Bungee nur für Schilder (Code, Kategorie, Bingo), Barlow für den Text. Barlow ist kein variabler Font.
const bungee = Bungee({
  weight: "400",
  variable: "--font-bungee",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Musik-Bingo",
  description: "Hitster Bingo mit Freunden",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${bungee.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
