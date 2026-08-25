import { signOut } from "@/app/login/actions";
import { requireMember } from "@/lib/auth";

const competitions = [
  { date: "5 september", title: "Höstgäddan 2026", place: "Mälaren", time: "08:00" },
  { date: "3 oktober", title: "Abborrjakten", place: "Stockholms skärgård", time: "09:00" },
  { date: "28 november", title: "FylleFisken Final", place: "Hemlig plats", time: "08:00" },
];

export default async function HomePage() {
  const { profile } = await requireMember();
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">Fiske · Vänner · Prestige</p>
          <h1>Välkommen {profile.display_name ?? "fiskare"}</h1>
          <p className="hero-copy">Privat samlingsplats för FylleFiskens medlemmar.</p>
          <form action={signOut}><button className="button button-secondary" type="submit">Logga ut</button></form>
        </div>
      </section>
      <section className="section" id="competitions">
        <div className="container">
          <p className="eyebrow">Kommande bataljer</p>
          <h2>Tävlingar</h2>
          <div className="card-grid">
            {competitions.map((competition) => (
              <article className="card" key={competition.title}>
                <p className="card-date">{competition.date}</p>
                <h3>{competition.title}</h3>
                <p>{competition.place} · {competition.time}</p>
              </article>
            ))}
          </div>
          {profile.role === "admin" && <p><a href="/admin">Öppna administration</a></p>}
        </div>
      </section>
    </>
  );
}
