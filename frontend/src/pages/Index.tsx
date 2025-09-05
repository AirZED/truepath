import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardOverview } from "@/components/DashboardOverview";
import { ProductJourney } from "@/components/ProductJourney";
import { EscrowSection } from "@/components/EscrowSection";
import { SupplyChainMap } from "@/components/SupplyChainMap";
import { ShipmentsPage } from "@/components/ShipmentsPage";
import { Header } from "@/components/Header";
import { WalletGate } from "@/components/WalletGate";
import { RoleManager } from "@/components/RoleManager";
import { UserProvider } from "@/contexts/UserContext";

const Index = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [highlightedStep, setHighlightedStep] = useState<number | null>(null);

  const handleStepInteraction = (stepId: number) => {
    setHighlightedStep(highlightedStep === stepId ? null : stepId);
  };

  return (
    <div className="pt-16 sm:pt-20">
      <Header />
      <WalletGate>
        <UserProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background relative">
              <AppSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
              />
              <main className="flex-1 flex flex-col">
                {/* <DashboardHeader /> */}

                <div className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
                  {activeSection === "dashboard" && (
                    <>
                      <DashboardOverview />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <ProductJourney
                          highlightedStep={highlightedStep}
                          onStepClick={handleStepInteraction}
                        />
                        <EscrowSection />
                      </div>
                      <div className="mt-4 sm:mt-6">
                        <SupplyChainMap
                          highlightedStep={highlightedStep}
                          onStepClick={handleStepInteraction}
                        />
                      </div>
                    </>
                  )}
                  {activeSection === "shipments" && <ShipmentsPage />}
                  {activeSection === "roles" && <RoleManager />}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </UserProvider>
      </WalletGate>
    </div>
  );
};

export default Index;
