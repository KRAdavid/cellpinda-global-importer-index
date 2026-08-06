import Link from "next/link";
import { DocumentExplorer } from "@/components/DocumentExplorer";
import {
  ArrowUpRightIcon,
  ClockIcon,
  FileTextIcon,
  FlaskIcon,
  GlobeIcon,
  PackageIcon,
  ShieldCheckIcon,
  iconForName,
} from "@/components/Icons";
import {
  documentIndex,
  formatDate,
  getCategoryCount,
  getDashboardStats,
  siteContent,
} from "@/lib/content";

const categoryBySlug: Record<string, string | null> = {
  "product-overview": "Product",
  "manufacturing-quality": "Quality Certificates",
  "scientific-evidence": "Scientific Evidence",
  "global-regulatory-index": "Regulatory",
  patents: "Patents",
  "case-studies": "Case Studies",
  "market-insights": "Market Insights",
  "document-center": null,
  "latest-updates": null,
  "global-search": null,
};

export function HomeDashboard() {
  const stats = getDashboardStats();
  const documents = documentIndex.documents;
  const latestDocuments = documents.slice(0, 5);
  const evidenceDocuments = documents
    .filter((document) => document.category === "Scientific Evidence")
    .slice(0, 4);
  const featuredDownloads = documents
    .filter(
      (document) =>
        document.featured ||
        document.tags.some((tag) => tag.toLocaleLowerCase() === "featured"),
    )
    .slice(0, 5);

  return (
    <main>
      <section className="hero-section page-shell">
        <div className="hero-copy">
          <h1>{siteContent.hero.title}</h1>
          <p className="hero-definition">{siteContent.hero.definition}</p>
          <p className="hero-description">{siteContent.hero.description}</p>
          <div className="hero-actions">
            <Link className="button button--primary" href="/document-center/">
              {siteContent.hero.primaryAction} <ArrowUpRightIcon />
            </Link>
            <a
              className="button button--secondary"
              href={siteContent.contact.href}
              target="_blank"
              rel="noreferrer"
            >
              {siteContent.hero.secondaryAction} <ArrowUpRightIcon />
            </a>
          </div>
          <div className="hero-search-panel">
            <DocumentExplorer
              documents={documents}
              variant="compact"
              placeholder={siteContent.hero.searchPlaceholder}
            />
          </div>
        </div>

        <aside className="identity-panel" aria-label="Product identity">
          <div className="identity-panel__header">
            <PackageIcon />
            <div>
              <strong>Ingredient identity</strong>
              <span>Controlled product summary</span>
            </div>
          </div>
          <dl>
            {siteContent.product.facts.slice(0, 6).map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <p>{siteContent.product.qualificationNote}</p>
        </aside>
      </section>

      <section className="metric-band">
        <div className="page-shell metric-grid">
          <div className="metric-item">
            <FileTextIcon />
            <span>Indexed records</span>
            <strong>{stats.documents}</strong>
          </div>
          <div className="metric-item">
            <GlobeIcon />
            <span>Countries / regions</span>
            <strong>{stats.countries}</strong>
          </div>
          <div className="metric-item">
            <ShieldCheckIcon />
            <span>Current certificates</span>
            <strong>{stats.currentCertificates}</strong>
          </div>
          <div className="metric-item">
            <ClockIcon />
            <span>Latest index update</span>
            <strong>{formatDate(stats.latestUpdate)}</strong>
          </div>
        </div>
      </section>

      <section className="page-section page-shell">
        <div className="section-heading">
          <div>
            <h2>{siteContent.labels.categories}</h2>
            <p>Move directly to the evidence or document type required for importer due diligence.</p>
          </div>
          <Link href="/global-search/">
            Search everything <ArrowUpRightIcon />
          </Link>
        </div>
        <div className="category-grid">
          {siteContent.navigation.slice(0, 8).map((item) => {
            const category = categoryBySlug[item.slug];
            const count = category ? getCategoryCount(category) : documents.length;
            return (
              <Link className="category-card" href={`/${item.slug}/`} key={item.slug}>
                <span className="category-card__icon">{iconForName(item.icon)}</span>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                </div>
                <span className="category-card__count">{count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page-section page-shell dashboard-split">
        <div>
          <div className="section-heading section-heading--compact">
            <div>
              <h2>{siteContent.labels.latest}</h2>
              <p>Most recently added or revised index entries.</p>
            </div>
            <Link href="/latest-updates/">
              View all <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="simple-list">
            {latestDocuments.map((document) => (
              <article key={document.id}>
                <div>
                  <span>{document.category}</span>
                  <h3>{document.title}</h3>
                  <p>{formatDate(document.modifiedTime ?? document.issueDate)}</p>
                </div>
                <span className="status-chip" data-tone={document.sample ? "caution" : "neutral"}>
                  {document.sample ? "Sample" : document.status}
                </span>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="section-heading section-heading--compact">
            <div>
              <h2>{siteContent.labels.certificates}</h2>
              <p>Current, renewal-required and archived status is explicit.</p>
            </div>
            <Link href="/manufacturing-quality/">
              Review quality <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="certificate-stack">
            {siteContent.certificates.map((certificate) => (
              <article key={certificate.name}>
                <ShieldCheckIcon />
                <div>
                  <h3>{certificate.name}</h3>
                  <p>
                    {[certificate.version, certificate.certificateNumber]
                      .filter(Boolean)
                      .join(" · ") || "Certificate metadata"}
                  </p>
                </div>
                <div>
                  <span
                    className="status-chip"
                    data-tone={certificate.status === "Current" ? "positive" : "caution"}
                  >
                    {certificate.status}
                  </span>
                  <small>
                    {certificate.validUntil
                      ? `Valid until ${formatDate(certificate.validUntil)}`
                      : "No current validity date recorded"}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section evidence-band">
        <div className="page-shell">
          <div className="section-heading section-heading--inverse">
            <div>
              <h2>{siteContent.labels.evidence}</h2>
              <p>Study structure and directness are shown separately from marketing interpretation.</p>
            </div>
            <Link href="/scientific-evidence/">
              Explore evidence <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="evidence-grid">
            {evidenceDocuments.map((document) => (
              <article key={document.id}>
                <FlaskIcon />
                <span>{document.subcategory}</span>
                <h3>{document.title}</h3>
                <p>{document.summary}</p>
                <div>
                  <span className="status-chip" data-tone="caution">
                    {document.research?.evidenceStatus ?? document.status}
                  </span>
                  <span>{document.research?.cellpindaDirectness ?? "Not assessed"}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="section-disclaimer">{siteContent.evidence.disclaimer}</p>
        </div>
      </section>

      <section className="page-section page-shell">
        <div className="section-heading">
          <div>
            <h2>{siteContent.labels.regulatory}</h2>
            <p>A visible status prevents an unreviewed market from being mistaken for an approved market.</p>
          </div>
          <Link href="/global-regulatory-index/">
            Open regulatory index <ArrowUpRightIcon />
          </Link>
        </div>
        <div className="country-grid">
          {siteContent.regulatory.countries.map((country) => (
            <article key={country.code}>
              <GlobeIcon />
              <div>
                <h3>{country.name}</h3>
                <span>{country.code}</span>
              </div>
              <span className="status-chip" data-tone="neutral">
                {country.status}
              </span>
            </article>
          ))}
        </div>
        <p className="section-disclaimer">{siteContent.regulatory.disclaimer}</p>
      </section>

      <section className="page-section page-shell download-panel">
        <div>
          <h2>{siteContent.labels.downloads}</h2>
          <p>
            Featured items are controlled by Drive metadata. Download actions activate only when a
            public source link exists.
          </p>
        </div>
        <div className="download-list">
          {featuredDownloads.map((document) => (
            <article key={document.id}>
              <FileTextIcon />
              <div>
                <span>{document.category}</span>
                <h3>{document.title}</h3>
              </div>
              {document.downloadUrl ? (
                <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                  Download <ArrowUpRightIcon />
                </a>
              ) : (
                <span className="disabled-link">Drive link pending</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell closing-callout">
        <div>
          <h2>Start importer qualification with the current source documents.</h2>
          <p>
            The index is designed to shorten discovery time without replacing technical,
            regulatory or legal review.
          </p>
        </div>
        <div>
          <Link className="button button--primary" href="/document-center/">
            Open document center <ArrowUpRightIcon />
          </Link>
          <a
            className="button button--secondary"
            href={siteContent.contact.href}
            target="_blank"
            rel="noreferrer"
          >
            {siteContent.contact.label} <ArrowUpRightIcon />
          </a>
        </div>
      </section>
    </main>
  );
}
