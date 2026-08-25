import Link from "next/link";

export default function UnauthorizedPage() {
  return <main className="section"><div className="container" style={{ maxWidth: 620 }}><p className="eyebrow">Åtkomst saknas</p><h1>Du har inte behörighet här</h1><p>Ditt konto är inloggat men saknar medlemskap eller rätt roll. Kontakta en FylleFisken-administratör.</p><Link className="button button-secondary" href="/login">Till inloggningen</Link></div></main>;
}
