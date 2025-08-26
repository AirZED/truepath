import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, UserCheck, Shield, Users } from "lucide-react";

interface RoleManagerProps {
    userRoles: string[];
    onRegisterManufacturer: (name: string, description: string) => void;
    onGrantRole: (participant: string, roleType: string, name: string, description: string) => void;
}

export const RoleManager = ({
    userRoles,
    onRegisterManufacturer,
    onGrantRole
}: RoleManagerProps) => {
    const currentAccount = useCurrentAccount();
    const [manufacturerName, setManufacturerName] = useState("");
    const [manufacturerDescription, setManufacturerDescription] = useState("");
    const [showRegisterForm, setShowRegisterForm] = useState(false);

    const isManufacturer = userRoles.includes("MANUFACTURER");
    const isAdmin = userRoles.includes("ADMIN");

    const handleRegisterManufacturer = () => {
        if (manufacturerName.trim() && manufacturerDescription.trim()) {
            onRegisterManufacturer(manufacturerName, manufacturerDescription);
            setManufacturerName("");
            setManufacturerDescription("");
            setShowRegisterForm(false);
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

            {/* Manufacturer Registration */}
            {!isManufacturer && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Register as Manufacturer
                        </CardTitle>
                        <CardDescription>
                            Register your wallet as a manufacturer to create and manage products
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!showRegisterForm ? (
                            <Button
                                onClick={() => setShowRegisterForm(true)}
                                className="w-full"
                            >
                                Register as Manufacturer
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Company Name</label>
                                    <Input
                                        value={manufacturerName}
                                        onChange={(e) => setManufacturerName(e.target.value)}
                                        placeholder="Enter your company name"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <Textarea
                                        value={manufacturerDescription}
                                        onChange={(e) => setManufacturerDescription(e.target.value)}
                                        placeholder="Describe your manufacturing business"
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleRegisterManufacturer}
                                        className="flex-1"
                                        disabled={!manufacturerName.trim() || !manufacturerDescription.trim()}
                                    >
                                        Register
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRegisterForm(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Role Management (Admin Only) */}
            {isAdmin && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Role Management
                        </CardTitle>
                        <CardDescription>
                            Grant roles to other participants (Admin only)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-gray-600">
                            Admin functionality to grant roles to other participants will be implemented here.
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
                        Different roles and their permissions in the supply chain
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="default">MANUFACTURER</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Can create products, advance stages, and view own products
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">SHIPPER</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Can advance shipping stages and update location data
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">DISTRIBUTOR</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Can advance distribution stages and manage inventory
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="destructive">RETAILER</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Can advance retail stages and complete sales
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
