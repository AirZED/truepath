import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@mysten/sui/transactions";
import {
    useSuiClient,
    useSignAndExecuteTransaction,
    useCurrentAccount,
} from "@mysten/dapp-kit";
import { PACKAGE_ID, PARTICIPANT_REGISTRY_ID, TRUEPATH_MODULE_NAME } from "../lib/constants";
import { useUserRoles } from "./useUserRoles";

export interface Product {
    id: string;
    sku: string;
    batch_id: string;
    head_hash: string;
    remaining: number;
    stage: number;
    stage_names: string[];
    stage_roles: string[];
    current_owner: string;
    status: 'pending' | 'in-transit' | 'completed' | 'delayed';
    progress: number;
    estimatedDelivery?: string;
    carrier?: string;
    trackingNumber?: string;
    value?: string;
    weight?: string;
}

export interface CreateProductData {
    sku: string;
    batch_id: string;
    price: string;
    total_steps: number;
    stage_names: string[];
    stage_roles: string[];
}

export interface AdvanceProductData {
    productId: string;
    preimage: string;
    actor_role: string;
    location_tag?: string;
    new_owner?: string;
}

const errorMessages = {
    1: "Invalid stage configuration",
    2: "Invalid role configuration",
    10: "Product already completed",
    11: "Hash mismatch - invalid preimage",
    403: "Operation forbidden: Insufficient permissions",
    416: "Caller is not a registered user",
    419: "User is not approved to perform this action",
};

export const useProducts = () => {
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const currentAccount = useCurrentAccount();
    const suiClient = useSuiClient();
    const queryClient = useQueryClient();
    const { hasRole, isManufacturer, userDetails } = useUserRoles();

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch products from smart contract
    const { data: contractProducts, isLoading: isProductsLoading } = useQuery({
        queryKey: ['products', currentAccount?.address],
        queryFn: async () => {
            if (!currentAccount?.address) return [];

            // TODO: Replace with actual smart contract call to get products
            // For now, return mock data
            return [];
        },
        enabled: !!currentAccount?.address,
        refetchInterval: 30000,
    });

    // Create product mutation
    const createProductMutation = useMutation({
        mutationFn: async (productData: CreateProductData) => {
            if (!currentAccount?.address) throw new Error("No account connected");
            if (!isManufacturer) throw new Error("Only manufacturers can create products");

            setIsLoading(true);
            try {
                const tx = new Transaction();

                const priceInMist = BigInt(Math.floor(parseFloat(productData.price) * 1_000_000_000));

                console.log(userDetails.id.id)
                const product = tx.moveCall({
                    target: `${PACKAGE_ID}::${TRUEPATH_MODULE_NAME}::mint_product`,
                    arguments: [
                        tx.object(PARTICIPANT_REGISTRY_ID),
                        tx.object(userDetails.id.id),
                        tx.pure.string(productData.sku),
                        tx.pure.string(productData.batch_id),
                        tx.pure.u64(priceInMist),
                        tx.pure.u32(productData.total_steps),
                        tx.pure.vector("string", productData.stage_names),
                        tx.pure.vector("string", productData.stage_roles),
                    ],
                });

                // Transfer the Product to the caller's address
                tx.transferObjects([product], currentAccount.address);


                const result = await signAndExecute({
                    transaction: tx,
                });

                console.log("result", result)


                if (result.effects?.status.status === 'failure') {
                    const error = result.effects.status.error;
                    if (error.includes('Abort')) {
                        const code = extractAbortCode(error);
                        throw new Error(errorMessages[code] || 'Unknown error occurred');
                    }
                    throw new Error(error);
                }

                // Invalidate and refetch products
                queryClient.invalidateQueries({ queryKey: ['products'] });

                return result;
            } catch (error) {
                console.error("Error creating product:", error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Advance product mutation
    const advanceProductMutation = useMutation({
        mutationFn: async (advanceData: AdvanceProductData) => {
            if (!currentAccount?.address) throw new Error("No account connected");

            setIsLoading(true);
            try {
                const tx = new Transaction();

                if (advanceData.new_owner) {
                    // Use verify_and_advance_and_transfer if new owner is specified
                    tx.moveCall({
                        target: `${PACKAGE_ID}::${TRUEPATH_MODULE_NAME}::verify_and_advance_and_transfer`,
                        arguments: [
                            tx.object(PARTICIPANT_REGISTRY_ID),
                            tx.object(advanceData.productId),
                            tx.pure.bytes(advanceData.preimage),
                            tx.pure.string(advanceData.actor_role),
                            tx.pure.option(advanceData.location_tag ? tx.pure.string(advanceData.location_tag) : tx.pure.none()),
                            tx.pure.address(advanceData.new_owner),
                        ],
                    });
                } else {
                    // Use regular verify_and_advance
                    tx.moveCall({
                        target: `${PACKAGE_ID}::${TRUEPATH_MODULE_NAME}::verify_and_advance`,
                        arguments: [
                            tx.object(PARTICIPANT_REGISTRY_ID),
                            tx.object(advanceData.productId),
                            tx.pure.bytes(advanceData.preimage),
                            tx.pure.string(advanceData.actor_role),
                            tx.pure.option(advanceData.location_tag ? tx.pure.string(advanceData.location_tag) : tx.pure.none()),
                        ],
                    });
                }

                const result = await signAndExecute({
                    transaction: tx,
                });

                if (result.effects?.status.status === 'failure') {
                    const error = result.effects.status.error;
                    if (error.includes('Abort')) {
                        const code = extractAbortCode(error);
                        throw new Error(errorMessages[code] || 'Unknown error occurred');
                    }
                    throw new Error(error);
                }

                // Invalidate and refetch products
                queryClient.invalidateQueries({ queryKey: ['products'] });

                return result;
            } catch (error) {
                console.error("Error advancing product:", error);
                throw error;
            } finally {
                setIsLoading(false);
            }
        },
    });

    // Helper function to extract abort code from error message
    const extractAbortCode = (error: string): number => {
        const match = error.match(/Abort: (\d+)/);
        return match ? parseInt(match[1]) : 0;
    };

    // Check if user can perform actions on products
    const canCreateProduct = isManufacturer;
    const canAdvanceProduct = hasRole("SHIPPER") || hasRole("DISTRIBUTOR") || hasRole("RETAILER") || hasRole("MANUFACTURER");
    const canTransferProduct = hasRole("SHIPPER") || hasRole("DISTRIBUTOR") || hasRole("RETAILER");

    return {
        products,
        isLoading: isLoading || isProductsLoading,
        createProduct: createProductMutation.mutateAsync,
        advanceProduct: advanceProductMutation.mutateAsync,
        canCreateProduct,
        canAdvanceProduct,
        canTransferProduct,
        isCreating: createProductMutation.isPending,
        isAdvancing: advanceProductMutation.isPending,
    };
};
