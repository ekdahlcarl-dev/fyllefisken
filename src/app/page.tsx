import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

const competitions = [
  { date: "5 september", title: "Höstgäddan 2026", place: "Mälaren", time: "08:00" },
  { date: "3 oktober", title: "Abborrjakten", place: "Stockholms skärgård", time: "09:00" },
  { date: "28 november", title: "FylleFisken Final", place: "Hemlig plats", time: "08:00" },
];
const standings = [
  { place: 1, name: "Johan", points: 142, biggest: "104 cm", wins: 3 },
  { place: 2, name: "Anders", points: 128, biggest: "96 cm", wins: 2 },
  { place: 3, name: "Kalle", points: 117, biggest: "91 cm", wins: 1 },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("display_name, role").eq("id", userId).single();
  if (!profile) redirect("/login?error=unauthorized");

  return <>
    <section className="hero"><div className="container hero-content"><p className="eyebrow">Fiske · Vänner · Prestige</p><h1>Välkommen {profile.display_name ?? "fiskare"}</h1><p className="hero-copy">Privat samlingsplats för FylleFiskens medlemmar.</p><form action={signOut}><button className="button button-secondary" type="submit">Logga ut</button></form></div></section>
    <section className="section" id="competitions"><div className="container"><p className="eyebrow">Kommande bataljer</p><h2>Tävlingar</h2><div className="card-grid">{competitions.map(c => <article className="card" key={c.title}><p className="card-date">{c.date}</p><h3>{c.title}</h3><p>{c.place} · {c.time}</p></article>)}</div></div></section>
    <section className="section section-muted" id="results"><div className="container"><p className="eyebrow">Hall of Fame</p><h2>Resultat</h2><div className="table-wrap" role="region" aria-label="Aktuell resultatställning" tabIndex={0}><table><thead><tr><th>Placering</th><th>Fiskare</th><th>Poäng</th><th>Största fisk</th><th>Vinster</th></tr></thead><tbody>{standings.map(row => <tr key={row.name}><td>{row.place}</td><td>{row.name}</td><td>{row.points}</td><td>{row.biggest}</td><td>{row.wins}</td></tr>)}</tbody></table></div>{profile.role === "admin" && <p className="eyebrow">Administratörsbehörighet aktiv</p>}</div></section>
  </>;
}
