const competitions = [
  {
    date: "5 september",
    title: "Höstgäddan 2026",
    place: "Mälaren",
    time: "08:00",
  },
  {
    date: "3 oktober",
    title: "Abborrjakten",
    place: "Stockholms skärgård",
    time: "09:00",
  },
  {
    date: "28 november",
    title: "FylleFisken Final",
    place: "Hemlig plats",
    time: "08:00",
  },
];

const standings = [
  { place: 1, name: "Johan", points: 142, biggest: "104 cm", wins: 3 },
  { place: 2, name: "Anders", points: 128, biggest: "96 cm", wins: 2 },
  { place: 3, name: "Kalle", points: 117, biggest: "91 cm", wins: 1 },
  { place: 4, name: "Peter", points: 103, biggest: "82 cm", wins: 1 },
  { place: 5, name: "Marcus", points: 89, biggest: "79 cm", wins: 0 },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">Fiske · Vänner · Prestige</p>
          <h1>Välkommen till FylleFisken</h1>
          <p className="hero-copy">
            Samlingsplatsen för fisketävlingar, tveksamma rekord och livslång
            prestige bland kompisarna.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#competitions">
              Se nästa tävling
            </a>
            <a className="button button-secondary" href="#results">
              Se resultat
            </a>
          </div>
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
                <p>
                  {competition.place} · {competition.time}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted" id="results">
        <div className="container">
          <p className="eyebrow">Hall of Fame</p>
          <h2>Resultat</h2>
          <div
            className="table-wrap"
            role="region"
            aria-label="Aktuell resultatställning"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Placering</th>
                  <th>Fiskare</th>
                  <th>Poäng</th>
                  <th>Största fisk</th>
                  <th>Vinster</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => (
                  <tr key={row.name}>
                    <td>{row.place}</td>
                    <td>{row.name}</td>
                    <td>{row.points}</td>
                    <td>{row.biggest}</td>
                    <td>{row.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
