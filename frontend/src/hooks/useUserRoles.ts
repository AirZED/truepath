import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

// Mock data for now - this would be replaced with actual smart contract calls
const MOCK_ROLES: Record<string, string[]> = {
    // Add some test addresses with roles
    "0x1234567890abcdef": ["MANUFACTURER", "ADMIN"],
    "0xabcdef1234567890": ["SHIPPER"],
    "0x9876543210fedcba": ["DISTRIBUTOR"],
};

export const useUserRoles = () => {
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

    const registerManufacturer = async (name: string, description: string) => {
        if (!currentAccount?.address) return;

        setIsLoading(true);
        try {
            // TODO: Replace with actual smart contract call
            // const txb = new TransactionBlock();
            // txb.moveCall({
            //   target: `${PACKAGE_ID}::roles::register_manufacturer`,
            //   arguments: [
            //     txb.object(PARTICIPANT_REGISTRY_ID),
            //     txb.pure(name),
            //     txb.pure(description),
            //   ],
            // });
            // await signAndExecuteTransactionBlock({ transactionBlock: txb });

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

    const grantRole = async (participant: string, roleType: string, name: string, description: string) => {
        if (!currentAccount?.address) return;

        setIsLoading(true);
        try {
            // TODO: Replace with actual smart contract call
            console.log(`Granting role ${roleType} to ${participant}`);

        } catch (error) {
            console.error("Error granting role:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

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
        registerManufacturer,
        grantRole,
        hasRole,
        isManufacturer,
        isAdmin,
        isShipper,
        isDistributor,
        isRetailer,
    };
};
