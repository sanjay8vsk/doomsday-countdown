import { use, useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GlobalMap() {

  const [locations, setLocations] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchLocations();
    const channel = supabase
        .channel("realtime-country")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "country_visits",
            },
            (payload) => {
                setLocations((prev) => [...prev, { ...payload.new, isNew: true }]);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  async function fetchLocations() {

    const { data, error } = await supabase
      .from("country_visits")
      .select("*");

    if (!error && data) {
      setLocations(data);
    }

  }

  useEffect(() => {
    document.title = "MCU Fan Network";
  }, []);

  return (

    <div
      style={{
        background: "#000",
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >

      {/* <h2
        style={{
          color: "#8CFF3F",
          fontFamily: "Orbitron, sans-serif",
          fontWeight: "600",
          marginTop: "10px",
          marginBottom: "10px",
          letterSpacing: "3px",
          textAlign: "center",
          textShadow: `0 0 6px rgba(140, 255, 63, 0.8),
                        0 0 15px rgba(140, 255, 63, 0.5)`
        }}
      >
         Marvel Fans Watching Worldwide
      </h2> */}
      <h2 className="marvel-title">Marvel Fans Watching Worldwide</h2>
      <div className="map-container">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: isMobile ? 95 : 100,
          center: [0, -12]
        }}
        
        style={{
          width: "100%",
          maxWidth: "1300px",
          height: "93vh"
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
        </defs>

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

        {locations.map((loc, i) => (

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

      </ComposableMap>
      <div className="map-footer">
        Crafted by <span>Sanjay </span>
        • {"\u00A9"} 2026
      </div>
      </div>

    </div>

  );

}