import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ProductJourney } from "@/components/ProductJourney";
import { EscrowSection } from "@/components/EscrowSection";
import { SupplyChainMap } from "@/components/SupplyChainMap";
import { ShipmentsPage } from "@/components/ShipmentsPage";
import EscrowsPage from "@/components/EscrowsPage";
import DisputesPage from "@/components/DisputesPage";
import SettingsPage from "@/components/SettingsPage";
import { Header } from "@/components/Header";
import { WalletGate } from "@/components/WalletGate";
import { RoleManager } from "@/components/RoleManager";
import { useUserRoles } from "@/hooks/useUserRoles";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);
  const { userRoles, registerManufacturer, grantRole } = useUserRoles();

  const handleStepInteraction = (stepId: number) => {
    setHighlightedStep(highlightedStep === stepId ? null : stepId);
  };

  return (
    <div className="pt-20">
      <Header />
      <WalletGate>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background relative">
            <AppSidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
            <main className="flex-1 flex flex-col">
              {/* <DashboardHeader /> */}

              <div className="flex-1 p-6 space-y-6">
                {activeSection === "dashboard" && (
                  <>
                    <DashboardOverview />
                    <div className="grid lg:grid-cols-2 gap-6">
                      <ProductJourney
                        highlightedStep={highlightedStep}
                        onStepClick={handleStepInteraction}
                      />
                      <EscrowSection />
                    </div>
                    <div className="mt-6">
                      <SupplyChainMap
                        highlightedStep={highlightedStep}
                        onStepClick={handleStepInteraction}
                      />
                    </div>
                  </>
                )}
                {activeSection === "shipments" && <ShipmentsPage />}
                {activeSection === "escrows" && <EscrowsPage />}
                {activeSection === "disputes" && <DisputesPage />}
                {activeSection === "settings" && <SettingsPage />}
                {activeSection === "roles" && (
                  <RoleManager
                    userRoles={userRoles}
                    onRegisterManufacturer={registerManufacturer}
                    onGrantRole={grantRole}
                  />
                )}
              </div>
            </main>
          </div>
        </SidebarProvider>
      </WalletGate>
    </div>
  );
};

export default Index;
