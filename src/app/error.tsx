"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Något gick fel</p>
        <h2>Vi fick napp på ett fel.</h2>
        <p>Försök igen. Om problemet kvarstår kan vi felsöka deploymenten via health-endpointen och Vercel-loggarna.</p>
        <button className="button button-primary" type="button" onClick={reset}>Försök igen</button>
      </div>
    </section>
  );
}
