import Link from "next/link";
import { siteContent } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__grid">
        <div>
          <strong>{siteContent.brand.name}</strong>
          <p>{siteContent.brand.tagline}</p>
        </div>
        <div>
          <strong>Source policy</strong>
          <p>{siteContent.footer.sourceNote}</p>
        </div>
        <div>
          <strong>Interpretation policy</strong>
          <p>{siteContent.footer.policyNote}</p>
        </div>
        <div className="site-footer__links">
          <Link href="/document-center/">Document Center</Link>
          <Link href="/system-status/">Index Status</Link>
          <a href={siteContent.contact.href}>Contact</a>
        </div>
      </div>
      <div className="page-shell site-footer__bottom">
        <span>© {new Date().getUTCFullYear()} Cellpinda Co., Ltd.</span>
        <span>Public B2B knowledge index · Republic of Korea</span>
      </div>
    </footer>
  );
}
