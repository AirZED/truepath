import { useCurrentAccount, useCurrentWallet } from "@mysten/dapp-kit";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomConnectButton from "@/components/wallet/CustomConnectButton";

interface WalletGateProps {
    children: React.ReactNode;
}

export const WalletGate = ({ children }: WalletGateProps) => {
    const currentAccount = useCurrentAccount();
    const currentWallet = useCurrentWallet();

    const isConnected = currentWallet.isConnected && currentAccount;

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-md w-full mx-4 text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wallet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Connect Your Wallet
                        </h1>

                        <p className="text-gray-600 dark:text-gray-300 mb-8">
                            To access the supply chain dashboard, you need to connect your Sui wallet.
                            This ensures secure and authenticated access to your supply chain data.
                        </p>

                        <div className="space-y-4">
                            <div className="flex w-full items-center justify-center">
                                <CustomConnectButton
                                    text="Connect Wallet to Continue"

                                />

                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <p>Supported wallets:</p>
                                <div className="flex justify-center gap-4 mt-2">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                        Sui Wallet
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                        Suiet
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
