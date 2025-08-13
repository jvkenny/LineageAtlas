import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router as HashRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

createRoot(document.getElementById("root")!).render(
  <HashRouter hook={useHashLocation}>
    <App />
  </HashRouter>,
);
