import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPassword } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function SetPasswordPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login?error=expired-invite");
  const { error } = await searchParams;

  return (
    <main className="section"><div className="container" style={{ maxWidth: 520 }}>
      <p className="eyebrow">Välkommen till FylleFisken</p><h1>Välj ditt lösenord</h1>
      <p>Din inbjudan är godkänd. Välj minst 10 tecken för att aktivera kontot.</p>
      {error && <p role="alert">Lösenordet kunde inte sparas. Försök igen med minst 10 tecken.</p>}
      <form action={setPassword} className="card" style={{ display: "grid", gap: 16, marginTop: 24 }}>
        <label>Nytt lösenord<input name="password" type="password" minLength={10} autoComplete="new-password" required /></label>
        <button className="button button-primary" type="submit">Aktivera konto</button>
      </form>
    </div></main>
  );
}
