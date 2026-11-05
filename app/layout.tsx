import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// Barlow für den Text, die schmale Barlow Condensed für Schilder (Code, Kategorie, Bingo). Beide sind keine
// variablen Fonts, deshalb die Gewichte einzeln.
const barlowCondensed = Barlow_Condensed({
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: ["400", "600", "700"],
  variable: "--font-barlow",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Musik-Bingo",
  description: "Musik-Bingo mit Freunden",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${barlowCondensed.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
