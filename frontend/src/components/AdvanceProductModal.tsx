import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowRight, MapPin } from "lucide-react";
import { useProducts, AdvanceProductData, Product } from "@/hooks/useProducts";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";

interface AdvanceProductModalProps {
    product: Product;
    onProductAdvanced?: () => void;
}

export function AdvanceProductModal({ product, onProductAdvanced }: AdvanceProductModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState<AdvanceProductData>({
        productId: product.id,
        preimage: "",
        actor_role: "",
        location_tag: "",
        new_owner: "",
    });

    const { advanceProduct, isAdvancing, canAdvanceProduct } = useProducts();
    const { userRoles } = useUserRoles();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canAdvanceProduct) {
            toast.error("You don't have permission to advance products");
            return;
        }

        try {
            // Convert hex string to bytes array
            const preimageBytes = formData.preimage.startsWith('0x')
                ? formData.preimage.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
                : formData.preimage.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];

            await advanceProduct({
                ...formData,
                preimage: preimageBytes,
            });

            toast.success("Product advanced successfully!");
            setIsOpen(false);
            setFormData({
                productId: product.id,
                preimage: "",
                actor_role: "",
                location_tag: "",
                new_owner: "",
            });
            onProductAdvanced?.();
        } catch (error) {
            console.error("Error advancing product:", error);
            toast.error(error instanceof Error ? error.message : "Failed to advance product");
        }
    };

    const getCurrentStageInfo = () => {
        const currentStage = product.stage;
        const stageName = product.stage_names[currentStage] || `Stage ${currentStage}`;
        const stageRole = product.stage_roles[currentStage] || `Role ${currentStage}`;
        const nextStage = currentStage + 1;
        const nextStageName = product.stage_names[nextStage] || `Stage ${nextStage}`;
        const nextStageRole = product.stage_roles[nextStage] || `Role ${nextStage}`;

        return { currentStage, stageName, stageRole, nextStage, nextStageName, nextStageRole };
    };

    const { currentStage, stageName, stageRole, nextStage, nextStageName, nextStageRole } = getCurrentStageInfo();

    if (!canAdvanceProduct) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Advance Stage
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Advance Product Stage
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Product Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">SKU:</span>
                                <span className="font-medium">{product.sku}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current Stage:</span>
                                <Badge variant="outline">{stageName}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Next Stage:</span>
                                <Badge variant="outline">{nextStageName}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Progress:</span>
                                <span className="font-medium">{product.progress}%</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="preimage">Preimage (Hex) *</Label>
                            <Input
                                id="preimage"
                                value={formData.preimage}
                                onChange={(e) => setFormData(prev => ({ ...prev, preimage: e.target.value }))}
                                placeholder="0x1234abcd..."
                                required
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Enter the preimage that satisfies the current hash
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="actor_role">Your Role *</Label>
                            <select
                                id="actor_role"
                                value={formData.actor_role}
                                onChange={(e) => setFormData(prev => ({ ...prev, actor_role: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                required
                            >
                                <option value="">Select your role</option>
                                {userRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="location_tag">Location Tag</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="location_tag"
                                    value={formData.location_tag}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location_tag: e.target.value }))}
                                    placeholder="e.g., Warehouse A, Port B"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="new_owner">Transfer to New Owner (Optional)</Label>
                            <Input
                                id="new_owner"
                                value={formData.new_owner}
                                onChange={(e) => setFormData(prev => ({ ...prev, new_owner: e.target.value }))}
                                placeholder="0x..."
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                                Leave empty to keep current ownership
                            </p>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isAdvancing}>
                                {isAdvancing ? "Advancing..." : "Advance Stage"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
