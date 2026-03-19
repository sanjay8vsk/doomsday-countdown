import { useEffect, useState, useRef} from "react";
import { FaLinkedin, FaInstagram } from "react-icons/fa";
import { supabase } from "./supabase";
import { Link } from "react-router-dom";
import { startDynamicFavicon } from "./dynamicFavicon";
import { Share2 } from "lucide-react";
import "./App.css";

export default function App() {

  async function getVisitorLocation() {
    const res = await 
    fetch("https://ipapi.co/json/");
    const data = await res.json();
    return {
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  }
  async function updateCountryVisit() {
    const loc = await getVisitorLocation();
    const { data } = await supabase
      .from("country_visits")
      .select("*")
      .eq("country", loc.country)
      .single();
      
    if (data) {
      await supabase
        .from("country_visits")
        .update({ count: data.count + 1 })
        .eq("country", loc.country);
    } else {
      await supabase
        .from("country_visits")
        .insert({ country: loc.country,
          latitude: loc.latitude,
          longitude: loc.longitude,
          count: 1,
        });
    }
  }

  
  const releaseDate = new Date("2026-12-18T00:00:00Z");

  const tickRef = useRef(null);


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
    
    const { data } = await supabase
      .from("visits")
      .select("count")
      .eq("id", 1)
      .single();
    const newCount = data.count + 1;
    
    await supabase      
      .from("visits")
      .update({ count: newCount })
      .eq("id", 1);
    setVisitors(newCount);
  }

  const [time, setTime] = useState(calculateTime());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [visitors, setVisitors] = useState(0);

  useEffect(() => {

    tickRef.current = new Audio("/tick.mp3");
    tickRef.current.volume = 0.4;

    const timer = setInterval(() => {

      setTime(calculateTime());

      if (soundEnabled && tickRef.current) {
        tickRef.current.currentTime = 0;
        tickRef.current.play().catch(() => {});
      }

    }, 1000);

    return () => clearInterval(timer);

  }, [soundEnabled]);

  useEffect(() => {
    startDynamicFavicon();
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
    <div
      className="fullscreen"
      onClick={() => setSoundEnabled(true)}
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
  );
}