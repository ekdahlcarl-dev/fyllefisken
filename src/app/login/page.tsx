import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 520 }}>
        <p className="eyebrow">Endast inbjudna medlemmar</p>
        <h1>Logga in till FylleFisken</h1>
        <p>
          Konton skapas bara genom en personlig inbjudan från en administratör.
        </p>
        {error && (
          <p role="alert">
            Inloggningen misslyckades. Kontrollera uppgifterna eller be en
            administratör om hjälp.
          </p>
        )}
        <form
          action={signIn}
          className="card"
          style={{ display: "grid", gap: 16, marginTop: 24 }}
        >
          <label>
            E-post
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Lösenord
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button button-primary" type="submit">
            Logga in
          </button>
        </form>
      </div>
    </main>
  );
}
