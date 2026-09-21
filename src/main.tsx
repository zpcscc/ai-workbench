import React from "react";
import ReactDOM from "react-dom/client";
import "uno.css";
import "./styles.css";
import { WorkbenchApp } from "./app/workbench-app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WorkbenchApp />
  </React.StrictMode>,
);
