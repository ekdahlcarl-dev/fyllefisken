import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();
  return <section className="section"><div className="container"><p className="eyebrow">Admin</p><h1>Administration</h1><p>Administratörsbehörigheten är verifierad server-side. Tävlingsadministration byggs i kommande work package.</p></div></section>;
}
