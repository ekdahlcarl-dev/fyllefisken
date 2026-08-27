import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Administratör</p>
        <h1>Administration</h1>
        <div className="card-grid">
          <div className="card">
            <h2>Tävlingsår</h2>
            <p>
              Förbered nästa säsong, ange plats, öppna och stäng registrering
              samt publicera varje dags resultat separat.
            </p>
            <div className="hero-actions">
              <Link
                className="button button-primary"
                href="/admin/competition"
              >
                Hantera tävling
              </Link>
            </div>
          </div>
          <div className="card">
            <h2>Vinnararkiv</h2>
            <p>
              Komplettera historiska vinnare och tävlingsplatser. Digitalt
              avslutade säsonger behåller sitt slutresultat.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/admin/history">
                Hantera historik
              </Link>
            </div>
          </div>
          <div className="card">
            <h2>Lagmedlemmar</h2>
            <p>
              Tilldela varje inbjuden medlem MAJO eller TORSK. Admin följer
              TORSK i vanliga tävlingsvyer.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/admin/members">
                Hantera lag
              </Link>
            </div>
          </div>
          <div className="card">
            <h2>Korrigera fångster</h2>
            <p>
              Dedikerad underhållsvy där admin kan se båda lagen och korrigera
              en återöppnad tävlingsdag.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/admin/catches">
                Korrigera fångster
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
