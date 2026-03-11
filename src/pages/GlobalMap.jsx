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

      <h2
        style={{
          color: "#8CFF3F",
          marginTop: "25px",
          marginBottom: "20px",
          letterSpacing: "2px",
          textAlign: "center",
          textShadow: `0 0 8px rgba(140, 255, 63, 0.8),
                        0 0 20px rgba(140, 255, 63, 0.6),
                        0 0 35px rgba(140, 255, 63, 0.4)`
        }}
      >
         Marvel Fans Watching Worldwide
      </h2>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 105,
          center: [0, 20]
        }}
        width={1000}
        height={520}
        style={{
          width: "95%",
          maxWidth: "1200px",
          height: "auto"
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

  );

}