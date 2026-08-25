import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function setPassword(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) redirect("/auth/set-password?error=weak");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/login?invited=expired");
  redirect("/");
}

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?invited=expired");
  const params = await searchParams;
  return <section className="section"><div className="container auth-card"><p className="eyebrow">Välkommen</p><h1>Välj ditt lösenord</h1>{params.error && <p role="alert">Använd minst 10 tecken.</p>}<form action={setPassword} className="auth-form"><label htmlFor="password">Nytt lösenord</label><input id="password" name="password" type="password" minLength={10} required /><button className="button button-primary" type="submit">Aktivera konto</button></form></div></section>;
}
