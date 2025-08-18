import { useState } from "react";
import { useWallet, useAccountBalance } from "@suiet/wallet-kit";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#000022] border border-[#00ffff] rounded-[15px] p-6 max-w-md w-full mx-4">
        <h2 className="text-[#00ffff] text-xl font-bold mb-4">
          Install Wallet
        </h2>
        <div className="space-y-4">
          <a
            href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-[#00ffff] rounded-lg hover:bg-[#00ffff] hover:text-[#000022] transition-all duration-300"
          >
            Sui Wallet
          </a>
          <a
            href="https://chrome.google.com/webstore/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-[#00ffff] rounded-lg hover:bg-[#00ffff] hover:text-[#000022] transition-all duration-300"
          >
            Suiet Wallet
          </a>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#00ffff] text-[#000022] py-3 rounded-[15px] hover:bg-[#008888] transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const CustomConnectButton = ({ text, icon }: { text?: string, icon?: React.ReactNode }) => {
  const { connected, disconnect, select, allAvailableWallets, address } =
    useWallet();
  const { balance, isLoading } = useAccountBalance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format wallet address (e.g., 0xabc...1234)
  const formatAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  // Format balance from BigInt to a readable number (convert from MIST to SUI)
  const formatBalance = () => {
    if (isLoading) return "Loading...";
    return balance
      ? (Number(balance) / 1_000_000_000).toFixed(2) + " SUI"
      : "0 SUI";
  };

  // Handle wallet connection
  const handleConnect = () => {
    try {
      if (allAvailableWallets.length > 0) {
        select(allAvailableWallets[0].name);
      } else {
        setIsModalOpen(true);
      }
    } catch (error) {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="relative">
      {connected ? (
        <div className="relative">
          <Button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors flex items-center cursor-pointer rounded-[16px] px-4 py-2 text-[0.8rem] mx-auto cursor-pointer"
          >
            <span> {formatBalance()}</span>
            <span>{formatAddress(address)}</span>
            <MdOutlineKeyboardArrowDown />
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg  rounded-[15px] overflow-hidden text-center w-full font-normal">
              {/* <Button
                onClick={() => {
                  disconnect();
            <span> {formatBalance()}</span>
            <span>{formatAddress(address)}</span>
            <MdOutlineKeyboardArrowDown />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg  rounded-[15px] overflow-hidden text-center w-full font-normal">
              {/* <Button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                size="lg"
                className="text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors flex items-center cursor-pointer rounded-[16px] px-4 py-2 text-[1.2rem] mx-auto cursor-pointer"
              >
                Disconnect <ArrowRight className="ml-2 h-5 w-5" />
              </Button> */}
              <Button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                className="block w-full px-4 py-3 hover:bg-gray-200 text-center bg-white text-[0.8rem]"
              >

                Disconnect
              </Button>
            </div>
          )}
        </div>
      ) : (

        <Button
          onClick={handleConnect}
          size="lg"
          children={<>{text || "Connect Wallet"}{icon || <Wallet className="h-2 w-2 mr-2" />}</>}
          className="text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors flex items-center cursor-pointer rounded-[24px] px-4 py-2 text-[1.2rem] h-10"
        />


      )}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default CustomConnectButton;
