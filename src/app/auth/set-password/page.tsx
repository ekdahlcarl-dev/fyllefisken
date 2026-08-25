import { setPassword } from "./actions";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <section className="section">
      <div className="container card" style={{ maxWidth: 520 }}>
        <p className="eyebrow">Aktivera medlemskap</p>
        <h1>Välj lösenord</h1>
        {error && <p role="alert">Lösenordet måste vara minst 10 tecken.</p>}
        <form action={setPassword} style={{ display: "grid", gap: 12 }}>
          <label htmlFor="password">Nytt lösenord</label>
          <input id="password" name="password" type="password" minLength={10} autoComplete="new-password" required />
          <button className="button button-primary" type="submit">Aktivera konto</button>
        </form>
      </div>
    </section>
  );
}
