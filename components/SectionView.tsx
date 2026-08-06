import Link from "next/link";
import type { ReactNode } from "react";
import { DocumentExplorer } from "@/components/DocumentExplorer";
import {
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  FlaskIcon,
  GlobeIcon,
  ShieldCheckIcon,
  WarningIcon,
} from "@/components/Icons";
import {
  formatDate,
  getDocumentsForSection,
  indexStatus,
  siteContent,
} from "@/lib/content";

interface SectionViewProps {
  slug: string;
}

function SectionHeader({ slug }: SectionViewProps) {
  const content = siteContent.sections[slug];
  return (
    <header className="section-hero page-shell">
      <div>
        <Link href="/">Cellpinda Global Index</Link>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </div>
      <aside>
        <strong>Review guidance</strong>
        <ul>
          {content.guidance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </header>
  );
}

function ProductOverview() {
  const documents = getDocumentsForSection("product-overview");
  return (
    <>
      <section className="page-section page-shell product-layout">
        <div>
          <h2>Ingredient identity</h2>
          <dl className="fact-table">
            {siteContent.product.facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="control-note">
          <ShieldCheckIcon />
          <h2>Qualification control</h2>
          <p>{siteContent.product.qualificationNote}</p>
          <Link href="/global-regulatory-index/">
            Review regulatory status <ArrowUpRightIcon />
          </Link>
        </aside>
      </section>
      <section className="page-section page-shell">
        <h2>Product documents</h2>
        <DocumentExplorer documents={documents} initialCategories={["Product"]} />
      </section>
    </>
  );
}

function ManufacturingQuality() {
  const documents = getDocumentsForSection("manufacturing-quality");
  return (
    <>
      <section className="page-section page-shell">
        <div className="section-heading">
          <div>
            <h2>Manufacturing sequence</h2>
            <p>{siteContent.manufacturing.summary}</p>
          </div>
        </div>
        <ol className="process-flow">
          {siteContent.manufacturing.steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
      <section className="page-section page-shell">
        <div className="section-heading">
          <div>
            <h2>Certificate status</h2>
            <p>Validity and renewal status are separated from the availability of the source PDF.</p>
          </div>
        </div>
        <div className="certificate-grid">
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
              <span
                className="status-chip"
                data-tone={certificate.status === "Current" ? "positive" : "caution"}
              >
                {certificate.status}
              </span>
              <small>
                {certificate.validUntil
                  ? `Valid until ${formatDate(certificate.validUntil)}`
                  : "Current validity date not recorded"}
              </small>
            </article>
          ))}
        </div>
      </section>
      <section className="page-section page-shell">
        <h2>Manufacturing and quality documents</h2>
        <DocumentExplorer
          documents={documents}
          initialCategories={["Manufacturing", "Quality Certificates"]}
        />
      </section>
    </>
  );
}

function ScientificEvidence() {
  const documents = getDocumentsForSection("scientific-evidence");
  return (
    <>
      <section className="page-section page-shell">
        <div className="section-heading">
          <div>
            <h2>Evidence interpretation framework</h2>
            <p>Every record uses an explicit status and a separate directness assessment.</p>
          </div>
        </div>
        <div className="definition-grid">
          {siteContent.evidence.statuses.map((status) => (
            <article key={status.name}>
              <FlaskIcon />
              <h3>{status.name}</h3>
              <p>{status.definition}</p>
            </article>
          ))}
        </div>
        <p className="section-disclaimer">{siteContent.evidence.disclaimer}</p>
      </section>
      <section className="page-section page-shell">
        <h2>Evidence records</h2>
        <DocumentExplorer documents={documents} initialCategories={["Scientific Evidence"]} />
      </section>
    </>
  );
}

function RegulatoryIndex() {
  const documents = getDocumentsForSection("global-regulatory-index");
  return (
    <>
      <section className="page-section page-shell">
        <div className="section-heading">
          <div>
            <h2>Market review status</h2>
            <p>Unreviewed or incomplete markets remain visibly qualified.</p>
          </div>
        </div>
        <div className="country-grid country-grid--large">
          {siteContent.regulatory.countries.map((country) => {
            const countryDocuments = documents.filter(
              (document) =>
                document.country === country.code || document.subcategory === country.code,
            );
            const status = countryDocuments[0]?.status ?? country.status;
            return (
              <article key={country.code}>
                <GlobeIcon />
                <div>
                  <h3>{country.name}</h3>
                  <span>{countryDocuments.length} indexed record(s)</span>
                </div>
                <span className="status-chip" data-tone="neutral">
                  {status}
                </span>
              </article>
            );
          })}
        </div>
      </section>
      <section className="page-section page-shell">
        <div className="definition-grid definition-grid--regulatory">
          {siteContent.regulatory.statuses.map((status) => (
            <article key={status.name}>
              <GlobeIcon />
              <h3>{status.name}</h3>
              <p>{status.definition}</p>
            </article>
          ))}
        </div>
        <p className="section-disclaimer">{siteContent.regulatory.disclaimer}</p>
      </section>
      <section className="page-section page-shell">
        <h2>Regulatory documents</h2>
        <DocumentExplorer documents={documents} initialCategories={["Regulatory"]} />
      </section>
    </>
  );
}

function StatusPage() {
  return (
    <>
      <section className="page-section page-shell status-overview">
        <article>
          {indexStatus.healthy ? <CheckCircleIcon /> : <WarningIcon />}
          <span>Index health</span>
          <strong>{indexStatus.healthy ? "Operational" : "Attention required"}</strong>
        </article>
        <article>
          <FileTextIcon />
          <span>Indexed records</span>
          <strong>{indexStatus.documentCount}</strong>
        </article>
        <article>
          <ShieldCheckIcon />
          <span>Private files excluded</span>
          <strong>{indexStatus.privateFilesExcluded}</strong>
        </article>
        <article>
          <ClockIcon />
          <span>Generated</span>
          <strong>{formatDate(indexStatus.generatedAt)}</strong>
        </article>
      </section>
      <section className="page-section page-shell status-columns">
        <div>
          <h2>Warnings</h2>
          {indexStatus.warnings.length ? (
            <ul className="status-list">
              {indexStatus.warnings.map((warning) => (
                <li key={warning}>
                  <WarningIcon />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-copy">No active warnings.</p>
          )}
        </div>
        <div>
          <h2>Metadata gaps</h2>
          <p>{indexStatus.missingMetadata.length} record(s) require metadata attention.</p>
          <div className="metadata-gap-list">
            {indexStatus.missingMetadata.slice(0, 12).map((item) => (
              <article key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.fields.join(", ")}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="page-section page-shell system-detail-grid">
        <article>
          <h3>Link checks</h3>
          <dl>
            <div><dt>Mode</dt><dd>{indexStatus.linkChecks.mode}</dd></div>
            <div><dt>Checked</dt><dd>{indexStatus.linkChecks.checked}</dd></div>
            <div><dt>Healthy</dt><dd>{indexStatus.linkChecks.healthy}</dd></div>
            <div><dt>Broken</dt><dd>{indexStatus.linkChecks.broken}</dd></div>
          </dl>
        </article>
        <article>
          <h3>AI classification</h3>
          <dl>
            <div><dt>Enabled</dt><dd>{indexStatus.aiClassification.enabled ? "Yes" : "No"}</dd></div>
            <div><dt>Processed</dt><dd>{indexStatus.aiClassification.processed}</dd></div>
            <div><dt>Model</dt><dd>{indexStatus.aiClassification.model ?? "Not configured"}</dd></div>
          </dl>
        </article>
        <article>
          <h3>Latest change set</h3>
          <dl>
            <div><dt>Added</dt><dd>{indexStatus.changeSummary.added}</dd></div>
            <div><dt>Modified</dt><dd>{indexStatus.changeSummary.modified}</dd></div>
            <div><dt>Deleted</dt><dd>{indexStatus.changeSummary.deleted}</dd></div>
          </dl>
        </article>
      </section>
      {indexStatus.requiredAction ? (
        <section className="page-shell action-callout">
          <WarningIcon />
          <div>
            <strong>Required action</strong>
            <p>{indexStatus.requiredAction}</p>
          </div>
        </section>
      ) : null}
    </>
  );
}

function GenericDocumentSection({ slug }: SectionViewProps) {
  const documents = getDocumentsForSection(slug);
  return (
    <section className="page-section page-shell">
      <DocumentExplorer documents={documents} />
    </section>
  );
}

export function SectionView({ slug }: SectionViewProps) {
  let body: ReactNode;
  switch (slug) {
    case "product-overview":
      body = <ProductOverview />;
      break;
    case "manufacturing-quality":
      body = <ManufacturingQuality />;
      break;
    case "scientific-evidence":
      body = <ScientificEvidence />;
      break;
    case "global-regulatory-index":
      body = <RegulatoryIndex />;
      break;
    case "system-status":
      body = <StatusPage />;
      break;
    default:
      body = <GenericDocumentSection slug={slug} />;
  }

  return (
    <main>
      <SectionHeader slug={slug} />
      {body}
      <section className="page-shell section-footer-callout">
        <div>
          <strong>Source control</strong>
          <p>{siteContent.footer.sourceNote}</p>
        </div>
        <Link href="/system-status/">
          View index status <ArrowUpRightIcon />
        </Link>
      </section>
    </main>
  );
}
