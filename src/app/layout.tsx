import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// One typeface everywhere — Roboto. The --font-serif and --font-mono CSS vars
// are aliased to this in globals.css, so all text renders in Roboto.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SCM Task Tracker · AUS",
  description: "Strategic Communications task tracker — American University of Sharjah.",
};

/*
  Runs before the first paint: applies the saved theme (falling back to the OS
  preference) so the page never flashes light before switching to dark. It has
  to be inline and blocking — a React effect runs too late to prevent the flash.
*/
const themeBoot = `
(function () {
  try {
    var saved = localStorage.getItem("scm.theme");
    var sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = saved === "dark" || ((!saved || saved === "system") && sys);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
