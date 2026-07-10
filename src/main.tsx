import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { PortalProvider } from "@toss/tds-mobile";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import config from "../granite.config.ts";
import App from "./App.tsx";
import { installDevBridgeShim } from "./lib/devBridgeShim";
import "./index.css";

// Keep the local browser preview alive: seed a zero safe-area fallback so the
// AIT provider doesn't crash on the missing native bridge (dev + browser only).
installDevBridgeShim();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
      {/* PortalProvider supplies the render target for useDialog/useBottomSheet overlays. */}
      <PortalProvider>
        <App />
      </PortalProvider>
    </TDSMobileAITProvider>
  </StrictMode>,
);
