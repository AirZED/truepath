import { Search, Wallet, Plus, Ticket } from "lucide-react";
import { RiAppsLine, RiTicketLine, RiNotification3Line } from "react-icons/ri";
import { FiPlus } from "react-icons/fi";
import { RiCompass3Fill } from "react-icons/ri";

import { Button } from "@/components/ui/button";
// import logo from "@assets/logo.png";
import { Link, NavLink } from "react-router-dom";
import CustomConnectButton from "@/components/wallet/CustomConnectButton";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 w-full px-6 py-3 bg-background/95 backdrop-blur-sm z-50 border-b border-gray-200 h-16">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-full">
        {/* Logo */}

        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            {/* <img src={logo} alt="Logo" className="h-5" /> */}
            TC
          </Link>
          <div className="flex items-center gap-6 ml-14">
            <NavLink
              className={({ isActive }) =>
                `transition-colors text-[.9rem] flex items-center justify-center gap-[0.5rem] ${isActive
                  ? "text-brand-blue font-[500]"
                  : "text-foreground hover:text-brand-blue font-normal"
                }`
              }
              to="/event"
            >
              <RiTicketLine className="text-[1.1rem]" /> Event
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `transition-colors text-[.9rem] flex items-center justify-center gap-[0.5rem] ${isActive
                  ? "text-brand-blue font-[500]"
                  : "text-foreground hover:text-brand-blue font-normal"
                }`
              }
              to="/explore"
            >
              <RiCompass3Fill className="text-[1.1rem]" /> Explore
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `transition-colors text-[.9rem] flex items-center justify-center gap-[0.5rem] ${isActive
                  ? "text-brand-blue font-[500]"
                  : "text-foreground hover:text-brand-blue font-normal"
                }`
              }
              to="/about"
            >
              About Us
            </NavLink>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Link
            className="flex  items-center justify-center gap-1"
            to="/create-event"
          >
            <FiPlus /> Create Product
          </Link>
          <RiNotification3Line />

          <CustomConnectButton />
        </div>
      </nav>
    </header>
  );
};
