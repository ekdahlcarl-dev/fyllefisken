import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">404</p>
        <h2>Sidan simmade iväg.</h2>
        <p>Den här sidan finns inte eller har flyttats.</p>
        <Link className="button button-primary" href="/">
          Till startsidan
        </Link>
      </div>
    </section>
  );
}
