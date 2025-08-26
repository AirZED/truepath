import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl("devnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
          <WalletProvider autoConnect={true}>
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
