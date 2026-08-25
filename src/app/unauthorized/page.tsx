import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default function UnauthorizedPage() {
  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 620 }}>
        <p className="eyebrow">Åtkomst saknas</p>
        <h1>Du har inte behörighet här</h1>
        <p>
          Ditt konto är inloggat men saknar medlemskap eller rätt roll. Kontakta
          en FylleFisken-administratör.
        </p>
        <form action={signOut}>
          <button className="button button-secondary" type="submit">
            Logga ut
          </button>
        </form>
        <Link href="/">Försök igen</Link>
      </div>
    </main>
  );
}
