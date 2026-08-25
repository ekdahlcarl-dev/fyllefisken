import Link from "next/link";

export default function UnauthorizedPage() {
  return <section className="section"><div className="container auth-card"><p className="eyebrow">Behörighet saknas</p><h1>Du har inte åtkomst hit</h1><p>Ditt konto är inloggat men saknar rätt behörighet.</p><Link className="button button-primary" href="/">Till startsidan</Link></div></section>;
}
