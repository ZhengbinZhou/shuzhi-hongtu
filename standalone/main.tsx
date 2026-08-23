import React from "react";
import { createRoot } from "react-dom/client";
import OfflineApp from "./offline-app";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(
  <React.StrictMode>
    <OfflineApp />
  </React.StrictMode>,
);
