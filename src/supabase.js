import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
 * null when the environment is missing or invalid.
 *
 * createClient() throws in that case, and because every route imports this
 * module, the throw used to blank the entire app -- including the countdown,
 * which needs no backend at all. Callers check for null and skip their
 * Supabase work instead.
 */
function makeClient() {
  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error(
      `Supabase disabled: ${err.message} Set VITE_SUPABASE_URL and ` +
      "VITE_SUPABASE_ANON_KEY in .env. The countdown still runs; visitor " +
      "tracking and map data are unavailable."
    );
    return null;
  }
}

export const supabase = makeClient();
