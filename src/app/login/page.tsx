import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "unauthorized"
      ? "Kontot saknar medlemsbehörighet. Be en administratör skicka en ny inbjudan."
      : error
        ? "Inloggningen misslyckades. Kontrollera uppgifterna eller be om en ny inbjudan."
        : null;

  return (
    <section className="section">
      <div className="container card" style={{ maxWidth: 520 }}>
        <p className="eyebrow">Endast inbjudna</p>
        <h1>Logga in</h1>
        <p>FylleFisken är privat och endast godkända medlemmar får åtkomst.</p>
        {message && <p role="alert">{message}</p>}
        <form action={signIn} style={{ display: "grid", gap: 12 }}>
          <label htmlFor="email">E-post</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Lösenord</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button className="button button-primary" type="submit">Logga in</button>
        </form>
      </div>
    </section>
  );
}
