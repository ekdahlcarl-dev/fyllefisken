"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  catchId?: string;
  year?: number;
  allowMultiple?: boolean;
  onUploaded?: () => void;
};

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function PhotoUploader({ userId, catchId, year, allowMultiple = true, onUploaded }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMessage(null);

    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED.has(file.type)) throw new Error(`${file.name}: använd JPEG, PNG eller WebP.`);
        if (file.size > MAX_BYTES) throw new Error(`${file.name}: filen är större än 10 MB.`);

        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const objectPath = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("fyllefisken-photos").upload(objectPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const { error: metadataError } = await supabase.from("photos").insert({
          object_path: objectPath,
          catch_id: catchId ?? null,
          year: year ?? null,
          created_by: userId,
        });
        if (metadataError) {
          await supabase.storage.from("fyllefisken-photos").remove([objectPath]);
          throw metadataError;
        }
        uploaded += 1;
      }
      setMessage(`${uploaded} foto${uploaded === 1 ? "" : "n"} uppladdade.`);
      if (cameraRef.current) cameraRef.current.value = "";
      if (libraryRef.current) libraryRef.current.value = "";
      onUploaded?.();
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Uppladdningen misslyckades. Försök igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="photo-upload">
      <label className="button button-light photo-upload-button">
        {busy ? "Laddar upp…" : "Ta foto"}
        <input
          ref={cameraRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={busy}
          onChange={(event) => void uploadFiles(event.target.files)}
        />
      </label>
      <label className="button button-light photo-upload-button">
        {busy ? "Laddar upp…" : allowMultiple ? "Välj bilder" : "Välj bild"}
        <input
          ref={libraryRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={allowMultiple}
          disabled={busy}
          onChange={(event) => void uploadFiles(event.target.files)}
        />
      </label>
      {busy && <progress className="photo-progress" />}
      {message && <span className="photo-message" role="status">{message}</span>}
    </div>
  );
}
