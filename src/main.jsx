import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import GlobalMap from "./pages/GlobalMap";
import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")).render(

  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/map" element={<GlobalMap />} />
    </Routes>
  </BrowserRouter>

);