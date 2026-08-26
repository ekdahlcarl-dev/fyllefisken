import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Administratör</p>
        <h1>Administration</h1>
        <div className="card">
          <h2>Tävlingsår</h2>
          <p>
            Förbered nästa säsong, öppna och stäng registrering samt slutför
            tävlingen.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/admin/competition">
              Hantera tävling
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
