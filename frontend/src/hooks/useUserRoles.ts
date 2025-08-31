import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { Transaction } from "@mysten/sui/transactions";

import {
    useSuiClient,
    useSignAndExecuteTransaction,
    useCurrentAccount,
    useCurrentWallet,
} from "@mysten/dapp-kit";
import { PACKAGE_ID, REGISTRY_ID, ROLE_MODULE_NAME } from "../lib/constants";





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
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch user roles from smart contract
    const { data: roles, isLoading: isRolesLoading } = useQuery({
        queryKey: ['user-roles', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return [];

            // TODO: Replace with actual smart contract call
            // const registry = await suiClient.getObject({
            //   id: PARTICIPANT_REGISTRY_ID,
            //   options: { showContent: true }
            // });
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

    const registerRole = async (name: string, description: string) => {
        if (!currentAccount?.address) return;

        setIsLoading(true);
        try {
            // TODO: Replace with actual smart contract call
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${ROLE_MODULE_NAME}::register_role`,
                arguments: [
                    tx.object(REGISTRY_ID),
                    tx.pure.string(name),
                    tx.pure.string(description),
                ],
            });

            const result = await signAndExecute({
                transaction: tx,
            });

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
