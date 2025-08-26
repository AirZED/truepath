import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import {
  useCurrentAccount,
  useConnectWallet,
  useCurrentWallet,
  useSuiClient,
  ConnectModal,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Install Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          To connect your wallet, you need to install one of the following wallet extensions:
        </p>
        <div className="space-y-3">
          <a
            href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Sui Wallet</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Official Sui wallet</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="https://chrome.google.com/webstore/detail/suiet-sui-wallet/khpkpbbcccdmmclmpigdgddabeilkdpd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Suiet Wallet</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Popular Sui wallet</div>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

const CustomConnectButton = ({
  text,
  icon,
}: {
  text?: string;
  icon?: React.ReactNode;
}) => {
  const currentAccount = useCurrentAccount();
  const currentWallet = useCurrentWallet();
  const suiClient = useSuiClient();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Check if wallet is connected
  const isConnected = currentWallet.isConnected && currentAccount;

  // Fetch balance using useSuiClient
  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['sui-balance', currentAccount?.address],
    queryFn: async () => {
      if (!currentAccount?.address) return null;
      try {
        const balance = await suiClient.getBalance({
          owner: currentAccount.address,
          coinType: '0x2::sui::SUI'
        });
        return balance;
      } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
      }
    },
    enabled: !!currentAccount?.address,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Format wallet address (e.g., 0xabc...1234)
  const formatAddress = (addr: string | undefined) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  // Format balance from BigInt to a readable number (convert from MIST to SUI)
  const formatBalance = () => {
    if (isBalanceLoading) return "Loading...";
    if (!balance?.totalBalance) return "0 SUI";

    // Convert from MIST to SUI (1 SUI = 1,000,000,000 MIST)
    const suiAmount = Number(balance.totalBalance) / 1_000_000_000;
    return `${suiAmount.toFixed(2)} SUI`;
  };

  // Handle wallet connection
  const handleConnect = () => {
    try {
      console.log("Attempting to connect wallet...");

      // Show the ConnectModal directly to let user select their wallet
      setShowConnectModal(true);
    } catch (error) {
      console.error("Connection error:", error);
      setIsModalOpen(true);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (currentWallet.connectionStatus === "connected") {
      disconnect();
      setDropdownOpen(false);
    }
  };

  return (
    <div className="relative">
      {isConnected ? (
        <div className="relative">
          <Button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center gap-2 justify-center">
              <span className="text-[.8rem] border-r border-gray-200 pr-2">
                {formatBalance()}
              </span>
              <span className="text-[.8rem]">{formatAddress(currentAccount.address)}</span>
            </div>
            <MdOutlineKeyboardArrowDown className="w-4 h-4 transition-transform duration-200" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-3">
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 mb-2">
                  Connected Wallet
                </div>

                {/* Wallet Info */}
                <div className="px-3 py-2 mb-3">
                  <div className="text-sm font-mono text-gray-900 mb-1">
                    {formatAddress(currentAccount.address)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Balance:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {isBalanceLoading ? (
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </div>
                      ) : (
                        formatBalance()
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleDisconnect}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-medium py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect Wallet
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-md transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 border-0"
        >
          {icon || <Wallet className="w-5 h-5" />}
          <span className="text-sm">{text || "Connect Wallet"}</span>
        </Button>
      )}

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* ConnectModal from @mysten/dapp-kit */}
      <ConnectModal
        trigger={<div style={{ display: 'none' }} />}
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
      />
    </div>
  );
};

export default CustomConnectButton;
