import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <main className="section">
      <div className="container">
        <p className="eyebrow">Administratör</p>
        <h1>Admin</h1>
        <p>
          Den här ytan är server-side skyddad och reserverad för
          administratörer.
        </p>
      </div>
    </main>
  );
}
