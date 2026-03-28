import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import GlobalMap from "./pages/GlobalMap";
import React from "react";
import ReactDOM from "react-dom/client";
import ArcCursor from "./ArcCursor";
import './index.css';
import { Home } from "lucide-react";

ReactDOM.createRoot(document.getElementById("root")).render(

  <BrowserRouter>
      <ArcCursor />
    <Routes>
      <Route path="/" element={<App />} />
      
      <Route path="/map" element={<GlobalMap />} />
    </Routes>
  </BrowserRouter>

);