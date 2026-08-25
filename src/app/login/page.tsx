import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; invited?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");
  const params = await searchParams;

  return (
    <section className="section">
      <div className="container auth-card">
        <p className="eyebrow">Endast inbjudna</p>
        <h1>Logga in till FylleFisken</h1>
        <p>Konton skapas bara via personlig inbjudan från en administratör.</p>
        {params.error && <p role="alert">Inloggningen misslyckades. Kontrollera uppgifterna eller be om en ny inbjudan.</p>}
        {params.invited === "expired" && <p role="alert">Inbjudan har gått ut. Be en administratör skicka en ny.</p>}
        <form action={signIn} className="auth-form">
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
