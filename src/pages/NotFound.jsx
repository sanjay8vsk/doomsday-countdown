import { useEffect } from "react";
import { Link } from "react-router-dom";

/*
 * Catch-all route. vercel.json rewrites every path to index.html so that /map
 * works on a direct load, which meant any unknown URL rendered an empty grey
 * page: the router matched nothing and drew nothing.
 */
export default function NotFound() {

  useEffect(() => {
    document.title = "Page not found · Doomsday Countdown";
  }, []);

  return (
    <main className="not-found">
      <p className="nf-code" aria-hidden="true">404</p>
      <h1 className="nf-title">This timeline doesn't exist</h1>
      <Link className="nf-link" to="/">Back to the countdown</Link>
    </main>
  );

}
