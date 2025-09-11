import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, X } from "lucide-react";
import { useProducts, CreateProductData } from "@/hooks/useProducts";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";

interface CreateProductModalProps {
  onProductCreated?: () => void;
}

export function CreateProductModal({
  onProductCreated,
}: CreateProductModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProductData>({
    sku: "",
    batch_id: "",
    price: "",
    total_steps: 5,
    stage_names: ["MANUFACTURED", "SHIPPED", "RECEIVED", "RETAIL", "SOLD"],
    stage_roles: ["MFR", "SHIPPER", "DISTRIBUTOR", "RETAILER", "CUSTOMER"],
  });

  const { createProduct, isCreating, canCreateProduct } = useProducts();
  const { isManufacturer } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreateProduct) {
      toast.error("Only manufacturers can create products");
      return;
    }

    try {
      await createProduct({
        ...formData,
      });

      toast.success("Product created successfully!");
      setIsOpen(false);
      setFormData({
        sku: "",
        batch_id: "",
        price: "",
        total_steps: 5,
        stage_names: ["MANUFACTURED", "SHIPPED", "RECEIVED", "RETAIL", "SOLD"],
        stage_roles: ["MFR", "SHIPPER", "DISTRIBUTOR", "RETAILER", "CUSTOMER"],
      });
      onProductCreated?.();
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create product"
      );
    }
  };

  const addStage = () => {
    setFormData((prev) => ({
      ...prev,
      total_steps: prev.total_steps + 1,
      stage_names: [...prev.stage_names, `STAGE_${prev.total_steps + 1}`],
      stage_roles: [...prev.stage_roles, `ROLE_${prev.total_steps + 1}`],
    }));
  };

  const removeStage = (index: number) => {
    if (formData.total_steps <= 1) return;

    setFormData((prev) => ({
      ...prev,
      total_steps: prev.total_steps - 1,
      stage_names: prev.stage_names.filter((_, i) => i !== index),
      stage_roles: prev.stage_roles.filter((_, i) => i !== index),
    }));
  };

  const updateStage = (
    index: number,
    field: "name" | "role",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field === "name" ? "stage_names" : "stage_roles"]: prev[
        field === "name" ? "stage_names" : "stage_roles"
      ].map((item, i) => (i === index ? value : item)),
    }));
  };

  if (!isManufacturer) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Create New Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Product SKU"
                required
              />
            </div>
            <div>
              <Label htmlFor="batch_id">Batch ID *</Label>
              <Input
                id="batch_id"
                value={formData.batch_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, batch_id: e.target.value }))
                }
                placeholder="Batch identifier"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price">Price (SUI) *</Label>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0.6"
              required
            />
          </div>

          <div>
            <Label>Supply Chain Stages</Label>
            <div className="space-y-3 mt-2">
              {formData.stage_names.map((name, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      value={name}
                      onChange={(e) =>
                        updateStage(index, "name", e.target.value)
                      }
                      placeholder={`Stage ${index + 1} name`}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={formData.stage_roles[index]}
                      onChange={(e) =>
                        updateStage(index, "role", e.target.value)
                      }
                      placeholder={`Role ${index + 1}`}
                      required
                    />
                  </div>
                  {formData.total_steps > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStage}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stage
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
