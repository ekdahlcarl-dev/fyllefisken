import Image from "next/image";
import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { PhotoUploader } from "@/components/photo-uploader";
import { deleteMemory } from "./actions";

export const metadata = { title: "Minnen" };

export default async function MemoriesPage() {
  const { supabase, profile } = await requireMember();
  const { data: photos } = await supabase
    .from("photos")
    .select("id, year, object_path, caption, sort_order, created_at")
    .not("year", "is", null)
    .order("year", { ascending: false })
    .order("sort_order")
    .order("created_at");

  const signed = await Promise.all(
    (photos ?? []).map(async (photo) => {
      const { data } = await supabase.storage
        .from("fyllefisken-photos")
        .createSignedUrl(photo.object_path, 3600);
      return { ...photo, url: data?.signedUrl ?? null };
    }),
  );
  const years = Array.from(
    new Set(
      signed
        .map((photo) => photo.year)
        .filter((year): year is number => typeof year === "number"),
    ),
  );
  const currentYear = new Date().getUTCFullYear();

  return (
    <section className="section memories-page">
      <div className="container memories-shell">
        <header className="memories-header">
          <div>
            <p className="eyebrow">FylleFisken genom åren</p>
            <h1>Minnen</h1>
            <p>Privat fotoarkiv från tävlingarna sedan 2011.</p>
          </div>
          <Link className="button button-light" href="/">
            Startsidan
          </Link>
        </header>

        {profile.role === "admin" && (
          <div className="card memory-import">
            <h2>Lägg till äldre bilder</h2>
            <p>
              Välj år och importera flera JPEG-, PNG- eller WebP-bilder samtidigt.
              Max 10 MB per bild.
            </p>
            <div className="memory-import-grid">
              {Array.from(
                { length: currentYear - 2011 + 1 },
                (_, index) => currentYear - index,
              ).map((year) => (
                <div className="memory-year-upload" key={year}>
                  <strong>{year}</strong>
                  <PhotoUploader
                    userId={profile.id}
                    year={year}
                    allowMultiple
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!signed.length && (
          <div className="card empty-state">Inga minnesbilder uppladdade ännu.</div>
        )}
        {years.map((year) => (
          <section className="memory-year" key={year}>
            <p className="eyebrow">Tävlingsår</p>
            <h2>{year}</h2>
            <div className="memory-grid">
              {signed
                .filter((photo) => photo.year === year)
                .map((photo) => (
                  <article className="card memory-card" key={photo.id}>
                    {photo.url ? (
                      <a
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Öppna högupplöst bild från ${year}`}
                      >
                        <Image
                          src={photo.url}
                          alt={photo.caption ?? `FylleFisken ${year}`}
                          width={720}
                          height={540}
                          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                          quality={68}
                        />
                      </a>
                    ) : (
                      <div className="memory-image-missing">Bild saknas</div>
                    )}
                    {profile.role === "admin" && (
                      <form action={deleteMemory}>
                        <input type="hidden" name="id" value={photo.id} />
                        <button className="button button-danger" type="submit">
                          Ta bort
                        </button>
                      </form>
                    )}
                  </article>
                ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
