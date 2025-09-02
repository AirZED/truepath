import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Transaction } from "@mysten/sui/transactions";

import {
    useSuiClient,
    useSignAndExecuteTransaction,
    useCurrentAccount,
    useCurrentWallet,
} from "@mysten/dapp-kit";
import { PACKAGE_ID, PARTICIPANT_REGISTRY_ID, ROLE_MODULE_NAME } from "../lib/constants";

const errorMessages = {
    403: 'Operation forbidden: Insufficient permissions.',
    404: 'User not found.',
    406: 'Role mismatch.',
    408: 'Insufficient payment for registration.',
    409: 'Invalid role type.',
    410: 'This use is already registered',
    415: 'You have already voted for this user.',
    416: 'You are not a registered user.',
    417: 'You have no voting power.',
    419: 'You are not approved to vote.',
    // Add more as needed
};




// Mock data for now - this would be replaced with actual smart contract calls
const MOCK_ROLES: Record<string, string[]> = {
    // Add some test addresses with roles
    "0x1234567890abcdef": ["MANUFACTURER", "ADMIN"],
    "0xabcdef1234567890": ["SHIPPER"],
    "0x9876543210fedcba": ["DISTRIBUTOR"],
};

export const useUserRoles = () => {
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();

    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch user roles from smart contract
    const { data: roles, isLoading: isRolesLoading } = useQuery({
        queryKey: ['user-roles', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return [];

            console.log("Fetching roles")

            // TODO: Replace with actual smart contract call
            const registry = await suiClient.getObject({
                id: PARTICIPANT_REGISTRY_ID,
                options: { showContent: true }
            });

            console.log(registry)
            // return await get_participant_roles(registry, currentAccount.address);

            // Mock implementation for now
            return MOCK_ROLES[currentAccount.address] || [];
        },
        enabled: !!currentAccount?.address,
        refetchInterval: 30000, // Refetch every 30 seconds
    });

    useEffect(() => {
        if (roles) {
            setUserRoles(roles);
        }
    }, [roles]);

    const registerRole = async (role_type: string, name: string, description: string,) => {
        if (!currentAccount?.address) return;




        setIsLoading(true);
        try {
            // TODO: Replace with actual smart contract call
            const tx = new Transaction();

            const amountInSui = 1;

            console.log("Registering user")
            const coinObjects = await suiClient.getCoins({
                owner: currentAccount.address,
                coinType: '0x2::sui::SUI',
            });

            const amountInMist = Math.floor(amountInSui * 1_000_000_000);

            let primaryCoin = null;
            let coinsToMerge = [];

            for (const coin of coinObjects.data) {
                if (parseInt(coin.balance) >= amountInMist) {
                    console.log(typeof coin.balance)
                    primaryCoin = coin.coinObjectId;
                    break;
                }
            }
            if (!primaryCoin) {
                primaryCoin = coinObjects.data[0].coinObjectId;
                coinsToMerge = coinObjects.data.slice(1).map(coin => coin.coinObjectId);
                if (coinsToMerge.length > 0) {
                    tx.mergeCoins(primaryCoin, coinsToMerge);
                }
            }

            const [transferCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountInMist)]);

            if (role_type == "MANUFACTURER") {

                tx.moveCall({
                    target: `${PACKAGE_ID}::${ROLE_MODULE_NAME}::register_manufacturer`,
                    arguments: [
                        tx.object(PARTICIPANT_REGISTRY_ID),
                        tx.pure.string(name),
                        tx.pure.string(description),
                        transferCoin,
                    ],
                });
            } else {
                tx.moveCall({
                    target: `${PACKAGE_ID}::${ROLE_MODULE_NAME}::register_participants`,
                    arguments: [
                        tx.object(PARTICIPANT_REGISTRY_ID),
                        tx.pure.string(role_type),
                        tx.pure.string(name),
                        tx.pure.string(description),
                    ],
                });

            }

            const result = await signAndExecute({
                transaction: tx,
            });

            // // In your transaction handler:
            // if (result.effects?.status.status === 'failure' && response.effects.status.error.includes('Abort')) {
            //     const code = extractAbortCode(response.effects.status.error); // Parse the code from the error string
            //     alert(errorMessages[code] || 'Unknown error occurred.');
            // }


            // Mock implementation
            console.log(`Registering manufacturer: ${name} - ${description}`);

            // Update local state
            setUserRoles(prev => [...prev, "MANUFACTURER"]);

        } catch (error) {
            console.error("Error registering manufacturer:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const voteforUser = async (user: string) => {

    }

    const unVoteUser = async (user: string) => {

    }

    const hasRole = (role: string): boolean => {
        return userRoles.includes(role);
    };

    const isManufacturer = hasRole("MANUFACTURER");
    const isAdmin = hasRole("ADMIN");
    const isShipper = hasRole("SHIPPER");
    const isDistributor = hasRole("DISTRIBUTOR");
    const isRetailer = hasRole("RETAILER");

    return {
        userRoles,
        isLoading: isLoading || isRolesLoading,
        registerRole,
        voteforUser, unVoteUser,
        hasRole,
        isManufacturer,
        isAdmin,
        isShipper,
        isDistributor,
        isRetailer,
    };
};
