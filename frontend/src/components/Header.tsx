import { Search, Wallet, Plus, Ticket, Menu, X } from "lucide-react";
import { RiAppsLine, RiTicketLine, RiNotification3Line } from "react-icons/ri";
import { FiPlus } from "react-icons/fi";
import { RiCompass3Fill } from "react-icons/ri";
import { useState } from "react";

import { Button } from "@/components/ui/button";
// import logo from "@assets/logo.png";
import { Link, NavLink } from "react-router-dom";
import CustomConnectButton from "@/components/wallet/CustomConnectButton";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-sm z-50 border-b border-gray-200 h-16">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-full">
        {/* Logo */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
            {/* <img src={logo} alt="Logo" className="h-5" /> */}
            <span className="text-lg font-semibold">TC</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 ml-8">
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
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Link
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              to="/create-event"
            >
              <FiPlus className="h-4 w-4" />
              <span className="hidden lg:inline">Create Product</span>
            </Link>
            <RiNotification3Line className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
          </div>

          {/* Wallet Connect - Always visible */}
          <CustomConnectButton />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="space-y-3">
              <NavLink
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors text-sm ${isActive
                    ? "text-brand-blue font-[500] bg-blue-50"
                    : "text-foreground hover:text-brand-blue hover:bg-gray-50"
                  }`
                }
                to="/event"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <RiTicketLine className="text-[1.1rem]" /> Event
                </div>
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors text-sm ${isActive
                    ? "text-brand-blue font-[500] bg-blue-50"
                    : "text-foreground hover:text-brand-blue hover:bg-gray-50"
                  }`
                }
                to="/explore"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center gap-3">
                  <RiCompass3Fill className="text-[1.1rem]" /> Explore
                </div>
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md transition-colors text-sm ${isActive
                    ? "text-brand-blue font-[500] bg-blue-50"
                    : "text-foreground hover:text-brand-blue hover:bg-gray-50"
                  }`
                }
                to="/about"
                onClick={closeMobileMenu}
              >
                About Us
              </NavLink>
            </div>

            {/* Mobile Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start px-3 py-2 text-sm"
              >
                <Search className="h-4 w-4 mr-3" />
                Search
              </Button>
              <Link
                className="flex items-center justify-start gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm"
                to="/create-event"
                onClick={closeMobileMenu}
              >
                <FiPlus className="h-4 w-4" /> Create Product
              </Link>
              <div className="flex items-center justify-start gap-3 px-3 py-2 text-sm text-muted-foreground">
                <RiNotification3Line className="h-4 w-4" /> Notifications
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
