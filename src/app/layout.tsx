import type { Metadata } from "next";
import { Roboto, Roboto_Mono, Roboto_Serif } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

/*
  Three voices from one superfamily, so they harmonise without being
  interchangeable:

  - Roboto        body text, buttons, everything conversational
  - Roboto Serif  page titles and the wordmark — the display voice
  - Roboto Mono   dates, hours, counts and the uppercase labels

  The mono is the one that earns its place: this app is mostly dates and
  durations, and real monospaced figures line up in a column instead of
  wobbling. Previously all three roles were aliased to Roboto, so every
  deliberate typographic contrast in the markup rendered identically.
*/
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const robotoSerif = Roboto_Serif({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
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

    // Same trick for the sidebar: set it before paint so it never flashes wide.
    if (localStorage.getItem("scm.sidebar") === "collapsed") {
      document.documentElement.setAttribute("data-sidebar", "collapsed");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoSerif.variable} ${robotoMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
