import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found page-shell">
      <span>404</span>
      <h1>Index page not found</h1>
      <p>The requested page is not part of the current public document index.</p>
      <Link className="button button--dark" href="/">
        Return to dashboard
      </Link>
    </main>
  );
}
