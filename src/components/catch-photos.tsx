/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { PhotoUploader } from "./photo-uploader";

type CatchPhoto = { id: string; objectPath: string; url: string | null };

type Props = {
  catchId: string;
  userId: string;
  canManage: boolean;
  photos: CatchPhoto[];
};

export function CatchPhotos({ catchId, userId, canManage, photos }: Props) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function remove(photo: CatchPhoto) {
    setRemoving(photo.id);
    setError(null);
    const { error: storageError } = await supabase.storage.from("fyllefisken-photos").remove([photo.objectPath]);
    if (storageError) {
      setError("Bildfilen kunde inte tas bort.");
      setRemoving(null);
      return;
    }
    const { error: dbError } = await supabase.from("photos").delete().eq("id", photo.id).eq("catch_id", catchId);
    if (dbError) {
      setError("Bildmetadata kunde inte tas bort.");
      setRemoving(null);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="catch-photos">
      {!!photos.length && <div className="catch-photo-strip">{photos.map((photo) => photo.url && <div className="catch-photo-thumb" key={photo.id}><a href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Fångstfoto" /></a>{canManage && <button type="button" className="photo-remove" disabled={removing === photo.id} onClick={() => void remove(photo)} aria-label="Ta bort foto">×</button>}</div>)}</div>}
      {canManage && <PhotoUploader userId={userId} catchId={catchId} allowMultiple />}
      {error && <span className="photo-message notice-error" role="alert">{error}</span>}
    </div>
  );
}
