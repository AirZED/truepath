import {
  Factory,
  Truck,
  Warehouse,
  Store,
  User,
  Settings,
  Bell,
  Shield,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const menuItems = [
  {
    title: "Dashboard",
    id: "dashboard",
    icon: Factory,
  },
  {
    title: "Shipments",
    id: "shipments",
    icon: Truck,
  },
  {
    title: "Escrows",
    id: "escrows",
    icon: Warehouse,
  },
  // {
  //   title: "Disputes",
  //   id: "disputes",
  //   icon: Bell,
  // },
  // {
  //   title: "Settings",
  //   id: "settings",
  //   icon: Settings,
  // },
  {
    title: "Roles & Permissions",
    id: "roles",
    icon: Shield,
  },
];

export function AppSidebar({
  activeSection,
  setActiveSection,
}: AppSidebarProps) {
  return (
    <>
      {/* Mobile trigger - only visible on small screens */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <SidebarTrigger className="lg:hidden" />
      </div>

      <Sidebar className="border-r border-border relative">
        <SidebarHeader className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-foreground">
                TruePATH
              </h2>
              <p className="text-sm text-muted-foreground">Supply Dashboard</p>
            </div>
            <div className="sm:hidden">
              <h2 className="text-lg font-semibold text-foreground">TP</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 sm:px-4 py-6">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-3 px-1 sm:px-0">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg transition-colors ${
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
