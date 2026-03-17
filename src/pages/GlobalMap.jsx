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

export default function GlobalMap() {

  const [locations, setLocations] = useState([]);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    fetchLocations();
    const channel = supabase
        .channel("realtime-country")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "country_visits",
            },
            () => {
                fetchLocations();
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
            key={i}
            coordinates={[loc.longitude, loc.latitude]}
          >

            <circle
              r={6}
              fill="#ff3b3b"
            />

            <circle
                className="pulse"
              r={6}
              fill="rgba(255,0,0,0.25)"
            />

          </Marker>

        ))}

      </ComposableMap>
      </div>

    </div>

  );

}