import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/*
 * Map framing.
 *
 * d3-geo's Mercator maps latitude to y = -k * ln(tan(PI/4 + lat/2)), and
 * react-simple-maps builds viewBox="0 0 width height" with translate([w/2, h/2]).
 * Leaving width/height at their defaults (800x600) gave a viewBox that did not
 * match the drawn geometry: ~21% dead horizontal padding, and content taller
 * than the box so the top of Greenland fell outside it.
 *
 * Instead we pick the latitude window we actually want to show and size the
 * viewBox to that window's exact projected bounds. The geometry then fills its
 * own viewBox edge to edge, so preserveAspectRatio="xMidYMid meet" (the default)
 * centres it perfectly at any element size, with no padding to compensate for.
 */
const MAP_SCALE = 100;
const LAT_NORTH = 84;   // clears the northern tip of Greenland (~83.6N)
const LAT_SOUTH = -72;  // keeps a readable band of Antarctica without the
                        // extreme Mercator stretch below it

const mercatorY = (lat) =>
  Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

const round2 = (n) => Number(n.toFixed(2));

const MAP_WIDTH = round2(MAP_SCALE * 2 * Math.PI);
const MAP_HEIGHT = round2(MAP_SCALE * (mercatorY(LAT_NORTH) - mercatorY(LAT_SOUTH)));

// Latitude whose projected y is the midpoint of the window, so that
// translate([w/2, h/2]) lands the window exactly on the viewBox.
const CENTER_LAT = round2(
  (Math.atan(Math.exp((mercatorY(LAT_NORTH) + mercatorY(LAT_SOUTH)) / 2)) * 360) /
    Math.PI -
    90
);

export default function GlobalMap() {

  const [locations, setLocations] = useState([]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocations() {

      const { data, error } = await supabase
        .from("country_visits")
        .select("*");

      if (!cancelled && !error && data) {
        setLocations(data);
      }

    }

    fetchLocations();

    // Merge on `country`, the table's primary key: a row we already hold is
    // updated in place, an unseen one is appended. This also stops a realtime
    // event that races the initial fetch from producing a duplicate React key.
    const mergeRow = (row, isNew) => {
      if (!row?.country) return;
      setLocations((prev) => {
        const i = prev.findIndex((loc) => loc.country === row.country);
        if (i === -1) return [...prev, { ...row, ...(isNew ? { isNew: true } : {}) }];
        const next = [...prev];
        next[i] = { ...next[i], ...row };
        return next;
      });
    };

    const channel = supabase
        .channel("realtime-country")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "country_visits",
            },
            (payload) => mergeRow(payload.new, true)
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "country_visits",
            },
            (payload) => mergeRow(payload.new, false)
        )
        .subscribe();

    return () => {
        cancelled = true;
        supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    document.title = "MCU Fan Network";
  }, []);

  return (

    <div className="map-page">

      <h2 className="marvel-title">Marvel Fans Watching Worldwide</h2>
      <div className="map-container">
      <ComposableMap
        projection="geoMercator"
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projectionConfig={{
          scale: MAP_SCALE,
          center: [0, CENTER_LAT]
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
           </filter>
          {/* d3 draws past the viewBox (its Mercator clip square is larger
              than our latitude window). Without this the visible latitude
              range would change with the element's aspect ratio -- phones
              showed far more Antarctica than desktops. */}
          <clipPath id="map-frame">
            <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} />
          </clipPath>
        </defs>

        <g clipPath="url(#map-frame)">

        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1a1a1a"
                stroke="#666"
                strokeWidth={0.5}
              />
            ))
          }
        </Geographies>

        {locations.map((loc) => (

          <Marker
            key={`${loc.country}-${loc.latitude}-${loc.longitude}`}
            coordinates={[loc.longitude, loc.latitude]}
          >

            <circle
            r={6}
            fill="none"
            stroke="#ff3b3b"
            strokeWidth={2}
            opacity="0.6"
            >
              {!reduceMotion && (
                <>
                  <animate
                  attributeName="r"
                  from="6"
                  to="30"
                  dur="2s"
                  repeatCount="indefinite"
                  />
                  <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                  />
                </>
              )}
            </circle>
            <circle
              r={5}
              fill="#ff3b3b"
              style={{
                filter: "drop-shadow(0 0 6px #ff3b3b)"
              }}
              />

            

          </Marker>

        ))}

        </g>

      </ComposableMap>
      </div>

      <div className="map-footer">
        Crafted by <span>Sanjay </span>
        • {"\u00A9"} 2026
      </div>

    </div>

  );

}