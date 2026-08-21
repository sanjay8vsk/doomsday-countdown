import { useEffect, useState, useRef} from "react";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { supabase } from "./supabase";
import { Link } from "react-router-dom";
import { startDynamicFavicon } from "./dynamicFavicon";
import { createTickEngine, tickLevel } from "./tickSound";
import { Share2 } from "lucide-react";
import { Outlet } from "react-router-dom";
import ArcCursor from "./ArcCursor";
import "./App.css";

export default function App() {

  // Returns null (never throws) when the lookup is unavailable, times out, or
  // comes back without usable coordinates. Callers skip the visit record.
  async function getVisitorLocation() {

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {

      const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });

      if (!res.ok) {
        console.error("Geolocation lookup failed:", res.status, res.statusText);
        return null;
      }

      const data = await res.json();

      // Rate-limited replies are HTTP 200 with { error: true, reason: "..." }.
      if (data?.error) {
        console.error("Geolocation lookup rejected:", data.reason ?? "unknown reason");
        return null;
      }

      const country = data?.country_name;
      const latitude = data?.latitude;
      const longitude = data?.longitude;

      if (!country || typeof latitude !== "number" || typeof longitude !== "number") {
        console.error("Geolocation response missing country or coordinates; skipping visit record.");
        return null;
      }

      return { country, latitude, longitude };

    } catch (err) {
      if (err?.name === "AbortError") {
        console.error("Geolocation lookup timed out after 8s.");
      } else {
        console.error("Geolocation lookup failed:", err);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }

  }

  async function updateCountryVisit() {

    try {

      const loc = await getVisitorLocation();

      // Already logged inside getVisitorLocation(). The countdown and the
      // visitor counter are independent of this, so just stop here.
      if (!loc) return;

      // One atomic upsert in the database: increments an existing country or
      // creates it. The client cannot supply a count, delete rows, or touch
      // any row other than the one matching this country.
      const { error: writeError } = await supabase.rpc("record_country_visit", {
        p_country: loc.country,
        p_latitude: loc.latitude,
        p_longitude: loc.longitude,
      });

      if (writeError) {
        console.error("Could not record country visit:", writeError.message);
      }

    } catch (err) {
      console.error("Country visit tracking failed:", err);
    }

  }

  
  const releaseDate = new Date("2026-12-18T00:00:00Z");

  const tickEngineRef = useRef(null);
  const lastTickSecondRef = useRef(null);


  const calculateTime = () => {

    const now = new Date();
    const isReleased = now >= releaseDate;

    const start = isReleased ? releaseDate : now;
    const end = isReleased ? now : releaseDate;

    let years = end.getUTCFullYear() - start.getUTCFullYear();
    let months = end.getUTCMonth() - start.getUTCMonth();
    let days = end.getUTCDate() - start.getUTCDate();
    let hours = end.getUTCHours() - start.getUTCHours();
    let minutes = end.getUTCMinutes() - start.getUTCMinutes();
    let seconds = end.getUTCSeconds() - start.getUTCSeconds();

    if (seconds < 0) {
      seconds += 60;
      minutes--;
    }

    if (minutes < 0) {
      minutes += 60;
      hours--;
    }

    if (hours < 0) {
      hours += 24;
      days--;
    }

    if (days < 0) {
      const prevMonthDays = new Date(
        end.getUTCFullYear(),
        end.getUTCMonth(),
        0
      ).getUTCDate();

      days += prevMonthDays;
      months--;
    }

    if (months < 0) {
      months += 12;
      years--;
    }

    return {
      isReleased,
      months: years * 12 + months,
      days,
      hours,
      minutes,
      seconds,
    };
  };

  const incrementVisitors = async () => {

    try {

      // Atomic increment in the database, returning the new value. Replaces a
      // read-then-write that lost updates under concurrent visitors. The client
      // supplies no count and cannot target a different row.
      const { data, error } = await supabase.rpc("increment_visit");

      if (error) {
        console.error("Visitor count unavailable:", error.message);
        return;
      }

      const newCount = typeof data === "number" ? data : Number(data);

      if (!Number.isFinite(newCount)) {
        console.error("Visitor count returned no usable value.");
        return;
      }

      setVisitors(newCount);

    } catch (err) {
      console.error("Visitor counter failed:", err);
    }

  }

  const [time, setTime] = useState(calculateTime());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [visitors, setVisitors] = useState(0);

  /*
   * One clock drives both the display and the sound.
   *
   * Polling at 250ms instead of 1000ms keeps the visible seconds within a
   * quarter second of the true boundary rather than letting setInterval drift,
   * and setTime bails out when the rendered value has not changed, so this
   * still causes exactly one re-render per second.
   *
   * The tick fires from the same value that gets rendered, gated on the seconds
   * field actually changing. Audio therefore cannot drift away from the
   * display: a late or duplicated poll re-renders nothing and plays nothing.
   */
  useEffect(() => {

    const sameDisplay = (a, b) =>
      a.isReleased === b.isReleased && a.months === b.months && a.days === b.days &&
      a.hours === b.hours && a.minutes === b.minutes && a.seconds === b.seconds;

    const timer = setInterval(() => {

      const next = calculateTime();

      setTime((prev) => (sameDisplay(prev, next) ? prev : next));

      if (next.seconds !== lastTickSecondRef.current) {
        lastTickSecondRef.current = next.seconds;
        // Reduced motion suppresses the audio only. The clock above has already
        // been updated, so the countdown keeps running and repainting normally.
        if (soundEnabled && !reduceMotion) {
          tickEngineRef.current?.tick(tickLevel(next));
        }
      }

    }, 250);

    return () => clearInterval(timer);

  }, [soundEnabled, reduceMotion]);

  /* Audio engine: created once, torn down on unmount. */
  useEffect(() => {
    const engine = createTickEngine();
    tickEngineRef.current = engine;

    // Browsers suspend the context when the tab is hidden; bring it back.
    const onVisible = () => {
      if (!document.hidden) engine.resumeIfNeeded();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      engine.dispose();
      tickEngineRef.current = null;
    };
  }, []);

  /*
   * Visitors who ask their OS for reduced motion are opted out of the ticking
   * audio: a sound that repeats every second for the whole visit is exactly the
   * kind of continuous, unrequested effect that preference is asking us to stop.
   * The countdown itself is untouched -- it still runs, repaints and escalates;
   * only the tick is silenced. Reacting to `change` means toggling the OS
   * setting takes effect immediately, without a reload.
   */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    startDynamicFavicon();
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll("button, a");

    const handleEnter = () => {
      document.body.classList.add("interactive");
    }
    const handleLeave = () => {
      document.body.classList.remove("interactive");
    };
    elements.forEach(el => {
      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      elements.forEach(el => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
      });
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("jarvis-mode");
    return () => {
      document.body.classList.remove("jarvis-mode");
    };
  }, []);

  useEffect(() => {
    incrementVisitors();
  }, []);

  useEffect(() => {
    updateCountryVisit();
  }, []);

  useEffect(() => {
    document.title = "⚡ Doomsday Countdown";
  }, []);

  const format = (val) => String(val).padStart(2, "0");

  const shareCountdown = () => {
    const shareData = {
      title: "Doomsday Countdown",
      text: "Join the global Doomsdaty Countdown", url:window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <>
      
    <div
      className="fullscreen"
      onClick={() => {
        // Reduced motion: never even open an AudioContext for this visitor.
        if (reduceMotion) return;
        setSoundEnabled(true);
        tickEngineRef.current?.unlock();
      }}
    >

      {/* Social Icons */}
      <div className="social-links">
        <a
          href="https://www.linkedin.com/in/sanjaybabuvuddandi/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedin size={24} />
        </a>

        <a
          href="https://www.instagram.com/de__sanjay/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaInstagram size={24} />
        </a>
        <div className="social-icon" onClick={shareCountdown}>
          <Share2 size={24} />
        </div>
      </div>

      <div className="overlay" />

      <div className="content">

        {/* Title */}
        <div className="title">
          {time.isReleased
            ? "SINCE DOOMSDAY"
            : "DOOMSDAY IS COMING"}
        </div>

        {/* Countdown */}
        <div className="time-container">

          <div className="time-block">
            <div className="number">{format(time.months)}</div>
            <div className="label">MONTHS</div>
          </div>

          <div className="colon">:</div>

          <div className="time-block">
            <div className="number">{format(time.days)}</div>
            <div className="label">DAYS</div>
          </div>

          <div className="colon">:</div>

          <div className="time-block">
            <div className="number">{format(time.hours)}</div>
            <div className="label">HOURS</div>
          </div>

          <div className="colon">:</div>

          <div className="time-block">
            <div className="number">{format(time.minutes)}</div>
            <div className="label">MINUTES</div>
          </div>

          <div className="colon">:</div>

          <div className="time-block">
            <div className="number">{format(time.seconds)}</div>
            <div className="label">SECONDS</div>
          </div>

        </div>

      </div>
      <div className="visitor-counter">
        👁️ {visitors.toLocaleString()} Avengers fans visited 
      </div>
      <div className="map-link">
        <Link to="/map">
          See Global Map 🌍
        </Link>
      </div>

    </div>
    </>
  );
}