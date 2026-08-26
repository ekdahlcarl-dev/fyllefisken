import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthHashHandler } from "@/components/auth-hash-handler";
import { getAppUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: { default: "FylleFisken", template: "%s | FylleFisken" },
  description: "Fisketävlingar, resultat och prestige bland vänner.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="sv">
      <body>
        <AuthHashHandler />
        <a className="skip-link" href="#main-content">Hoppa till innehåll</a>
        <div className="site-shell">
          <header className="site-header"><div className="container header-inner">
            <Link className="brand" href="/" aria-label="FylleFisken startsida"><span aria-hidden="true">🎣</span> FylleFisken</Link>
            <nav aria-label="Huvudnavigation"><Link href="/#competitions">Tävlingar</Link><Link href="/results">Resultat</Link><Link href="/history">Historik</Link><Link href="/memories">Minnen</Link></nav>
          </div></header>
          <main id="main-content">{children}</main>
          <footer className="site-footer"><div className="container footer-inner"><strong>FylleFisken</strong><span>Fiske, vänskap och alldeles för mycket prestige.</span></div></footer>
        </div>
      </body>
    </html>
  );
}
