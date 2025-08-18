import { Button } from "@/components/ui/button";

const wallets = [
    {
        name: "Phantom",
        icon: "👻",
        primary: true
    },
    {
        name: "Metamask",
        icon: "🦊",
        primary: false
    },
    {
        name: "Trust Wallet",
        icon: "🔵",
        primary: false
    }
];

export const WalletConnect = () => {
    return (
        <div className="space-y-4 py-4 bg-white">
            {wallets.map((wallet) => (
                <Button
                    key={wallet.name}
                    variant={wallet.primary ? "default" : "outline"}
                    className={`w-full justify-start space-x-3 h-12 ${wallet.primary
                        ? "bg-gradient-primary hover:opacity-90"
                        : "hover:bg-muted"
                        }`}
                    onClick={() => console.log(`Connecting to ${wallet.name}...`)}
                >
                    <span className="text-lg">{wallet.icon}</span>
                    <span className="font-medium">{wallet.name}</span>
                </Button>
            ))}

            <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                    Can't find your wallet?{" "}
                    <button className="text-primary hover:underline">
                        Connect to other wallet
                    </button>
                </p>
            </div>
        </div>
    );
};