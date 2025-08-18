import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  WalletProvider,
  AllDefaultWallets,
  SuiDevnetChain,
  Chain,
  SuiTestnetChain,
  SuietWallet,
} from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import { BrowserRouter } from "react-router-dom";

const supportedChains: Chain[] = [SuiDevnetChain, SuiTestnetChain];

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <WalletProvider
        defaultWallets={[...AllDefaultWallets, SuietWallet]}
        chains={supportedChains}
      >
        <App />
      </WalletProvider>
    </BrowserRouter>
  </StrictMode>
);
