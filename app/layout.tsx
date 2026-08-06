import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteContent } from "@/lib/content";

export const metadata: Metadata = {
  title: {
    default: siteContent.brand.name,
    template: `%s | ${siteContent.brand.shortName}`,
  },
  description: siteContent.hero.description,
  applicationName: siteContent.brand.name,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: siteContent.brand.name,
    description: siteContent.hero.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#0d1f1a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
