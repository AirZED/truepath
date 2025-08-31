import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Building2,
    UserCheck,
    Shield,
    Users,
    Truck,
    Warehouse,
    Store,
    User,
    AlertCircle,
    CheckCircle,
    Loader2
} from "lucide-react";

// Smart contract constants
const MODULE_ADDRESS = "0xa7d82cfdc97b5ea1efd0e3f43bd6ff307c4272f9284264d952f7c1f42a2f7f8b"; // Replace with your deployed module address
const REGISTRATION_FEE = 1000000000; // 1 SUI in MIST
const MIN_VOTE_WEIGHT = 5;


interface RoleManagerProps {
    userRoles: string[];
    onRegisterRole: (roleType: string, name: string, description: string, payment?: number) => Promise<void>;
    onVoteForUser: (targetAddress: string) => Promise<void>;
    onUnvoteForUser: (targetAddress: string) => Promise<void>;
}

interface RoleInfo {
    type: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    requiresPayment: boolean;
    requiresEndorsements: boolean;
    permissions: string[];
}

const ROLE_TYPES: RoleInfo[] = [
    {
        type: "MANUFACTURER",
        name: "Manufacturer",
        description: "Create products and manage supply chain",
        icon: Building2,
        requiresPayment: true,
        requiresEndorsements: false,
        permissions: ["CREATE_PRODUCT", "ADVANCE_STAGE", "VIEW_OWN_PRODUCTS", "GRANT_DOWNSTREAM_ROLES"]
    },
    {
        type: "SHIPPER",
        name: "Shipper",
        description: "Handle product transportation and logistics",
        icon: Truck,
        requiresPayment: false,
        requiresEndorsements: true,
        permissions: ["ADVANCE_STAGE", "VIEW_PRODUCTS"]
    },
    {
        type: "DISTRIBUTOR",
        name: "Distributor",
        description: "Manage product distribution and warehousing",
        icon: Warehouse,
        requiresPayment: false,
        requiresEndorsements: true,
        permissions: ["ADVANCE_STAGE", "VIEW_PRODUCTS"]
    },
    {
        type: "RETAILER",
        name: "Retailer",
        description: "Handle retail operations and sales",
        icon: Store,
        requiresPayment: false,
        requiresEndorsements: true,
        permissions: ["ADVANCE_STAGE", "VIEW_PRODUCTS"]
    },
    {
        type: "CUSTOMER",
        name: "Customer",
        description: "End consumer with product viewing rights",
        icon: User,
        requiresPayment: false,
        requiresEndorsements: true,
        permissions: ["VIEW_PRODUCTS"]
    }
];

export const RoleManager = ({
    userRoles,
    onRegisterRole,
    onVoteForUser,
    onUnvoteForUser
}: RoleManagerProps) => {
    const currentAccount = useCurrentAccount();

    const [selectedRole, setSelectedRole] = useState<string>("");
    const [roleName, setRoleName] = useState("");
    const [roleDescription, setRoleDescription] = useState("");
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    const selectedRoleInfo = ROLE_TYPES.find(role => role.type === selectedRole);

    const handleRegisterRole = async () => {
        if (!selectedRole || !roleName.trim() || !roleDescription.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            // Call the parent component's handler
            await onRegisterRole(selectedRole, roleName, roleDescription);
            setSuccess(`Successfully registered as ${selectedRoleInfo?.name}!`);
            setRoleName("");
            setRoleDescription("");
            setSelectedRole("");
            setShowRegisterForm(false);
        } catch (err) {
            console.error("Registration error:", err);
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Current User Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        Your Account Status
                    </CardTitle>
                    <CardDescription>
                        Current roles and permissions for your wallet
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Wallet Address:</span>
                            <span className="text-sm font-mono text-gray-600">
                                {currentAccount?.address ?
                                    `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}` :
                                    "Not connected"
                                }
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Roles:</span>
                            {userRoles.length > 0 ? (
                                userRoles.map((role) => (
                                    <Badge key={role} variant="secondary">
                                        {role}
                                    </Badge>
                                ))
                            ) : (
                                <Badge variant="outline">No roles assigned</Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error/Success Messages */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {/* Role Registration */}
            {!showRegisterForm ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Register for a Role
                        </CardTitle>
                        <CardDescription>
                            Choose a role to register for in the supply chain
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => setShowRegisterForm(true)}
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Register for a Role"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Register as {selectedRoleInfo?.name || "Role"}
                        </CardTitle>
                        <CardDescription>
                            {selectedRoleInfo?.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Role Selection */}
                            <div>
                                <label className="text-sm font-medium">Select Role</label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Choose a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_TYPES.map((role) => (
                                            <SelectItem key={role.type} value={role.type}>
                                                <div className="flex items-center gap-2">
                                                    <role.icon className="w-4 h-4" />
                                                    {role.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedRoleInfo && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-medium mb-2">Role Requirements:</h4>
                                    <ul className="text-sm space-y-1">
                                        {selectedRoleInfo.requiresPayment && (
                                            <li>• Payment: 1 SUI registration fee</li>
                                        )}
                                        {selectedRoleInfo.requiresEndorsements && (
                                            <li>• Endorsements: Minimum {MIN_VOTE_WEIGHT} vote weight required</li>
                                        )}
                                        <li>• Permissions: {selectedRoleInfo.permissions.join(", ")}</li>
                                    </ul>
                                </div>
                            )}

                            {/* Name Input */}
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="Enter your name or company name"
                                    className="mt-1"
                                />
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={roleDescription}
                                    onChange={(e) => setRoleDescription(e.target.value)}
                                    placeholder="Describe your role or business"
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleRegisterRole}
                                    className="flex-1"
                                    disabled={!selectedRole || !roleName.trim() || !roleDescription.trim() || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Registering...
                                        </>
                                    ) : (
                                        `Register as ${selectedRoleInfo?.name || "Role"}`
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowRegisterForm(false);
                                        setSelectedRole("");
                                        setRoleName("");
                                        setRoleDescription("");
                                        setError("");
                                        setSuccess("");
                                    }}
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Available Roles Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Available Roles
                    </CardTitle>
                    <CardDescription>
                        Different roles and their requirements in the supply chain
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {ROLE_TYPES.map((role) => {
                            const Icon = role.icon;
                            return (
                                <div key={role.type} className="space-y-2 p-4 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4" />
                                        <Badge variant="default">{role.type}</Badge>
                                    </div>
                                    <h4 className="font-medium">{role.name}</h4>
                                    <p className="text-sm text-gray-600">
                                        {role.description}
                                    </p>
                                    <div className="text-xs text-gray-500">
                                        {role.requiresPayment && (
                                            <div>💰 Requires 1 SUI payment</div>
                                        )}
                                        {role.requiresEndorsements && (
                                            <div>✅ Requires endorsements</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
