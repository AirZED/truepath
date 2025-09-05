import React, { createContext, useContext, ReactNode } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';

interface UserDetails {
    name: string;
    approved: boolean;
    endorsers: string[];
    trust_score: string;
    total_vote_weight: string;
    issued_at: string;
    role: {
        fields: {
            name: string;
            permissions: string[];
            role_type: string;
        };
    };
}

interface UserContextType {
    userRoles: string[];
    userDetails: UserDetails | null;
    isLoading: boolean;
    registerRole: (roleType: string, name: string, description: string) => Promise<void>;
    voteforUser: (user: string) => Promise<void>;
    unVoteUser: (user: string) => Promise<void>;
    hasRole: (role: string) => boolean;
    isManufacturer: boolean;
    isAdmin: boolean;
    isShipper: boolean;
    isDistributor: boolean;
    isRetailer: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const userRolesData = useUserRoles();

    const contextValue: UserContextType = {
        userRoles: userRolesData.userRoles,
        userDetails: userRolesData.userDetails,
        isLoading: userRolesData.isLoading,
        registerRole: userRolesData.registerRole,
        voteforUser: userRolesData.voteforUser,
        unVoteUser: userRolesData.unVoteUser,
        hasRole: userRolesData.hasRole,
        isManufacturer: userRolesData.isManufacturer,
        isAdmin: userRolesData.isAdmin,
        isShipper: userRolesData.isShipper,
        isDistributor: userRolesData.isDistributor,
        isRetailer: userRolesData.isRetailer,
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
