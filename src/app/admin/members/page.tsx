import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { assignMemberTeam } from "./actions";

type SearchParams = Promise<{ error?: string; success?: string }>;

type MemberRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "member" | "admin";
  team_id: number | null;
};

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const [{ data: members }, { data: teams }] = await Promise.all([
    supabase.rpc("admin_list_profiles"),
    supabase.from("teams").select("id, name").order("id"),
  ]);

  return (
    <section className="section">
      <div className="container admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Administratör</p>
            <h1>Lagmedlemmar</h1>
            <p>
              Varje medlem måste tillhöra MAJO eller TORSK. Administratörer är
              alltid TORSK i vanliga tävlingsvyer.
            </p>
          </div>
          <Link className="button button-light" href="/admin">
            Till admin
          </Link>
        </div>

        {params.error && (
          <p className="notice notice-error" role="alert">
            {params.error}
          </p>
        )}
        {params.success && (
          <p className="notice notice-success" role="status">
            {params.success}
          </p>
        )}

        <div className="admin-history-list">
          {(members as MemberRow[] | null)?.map((member) => (
            <form
              action={assignMemberTeam}
              className="card admin-history-row"
              key={member.id}
            >
              <input type="hidden" name="profile_id" value={member.id} />
              <div>
                <strong>{member.display_name || member.email}</strong>
                <div className="muted">
                  {member.email} ·{" "}
                  {member.role === "admin" ? "Admin" : "Medlem"}
                </div>
              </div>
              <label>
                <span className="sr-only">Lag för {member.email}</span>
                <select
                  name="team_id"
                  defaultValue={member.team_id ?? ""}
                  required
                  disabled={member.role === "admin"}
                >
                  <option disabled value="">
                    Välj lag
                  </option>
                  {teams?.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {member.role === "admin" && (
                  <input type="hidden" name="team_id" value="2" />
                )}
              </label>
              <button className="button button-primary" type="submit">
                Spara lag
              </button>
            </form>
          ))}
          {!members?.length && (
            <div className="card empty-state">Inga medlemmar hittades.</div>
          )}
        </div>
      </div>
    </section>
  );
}
