import React from "react";
import ReactDOM from "react-dom/client";
import "uno.css";
import "./styles.css";
import { WorkbenchApp } from "./app/workbench-app";
import { AppStateBootstrap } from "./state/global";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppStateBootstrap>
      <WorkbenchApp />
    </AppStateBootstrap>
  </React.StrictMode>,
);
