
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, User, DollarSign, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const escrowData = {
  id: "ESC-2024-001",
  amount: "$45,000",
  status: "locked" as const,
  buyer: "TechCorp Solutions",
  seller: "Global Manufacturing Ltd",
  releaseConditions: "Delivery confirmation required",
  lockedDate: "2024-01-15",
  estimatedRelease: "2024-02-01",
};

const statusConfig = {
  locked: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Lock,
    iconColor: "text-blue-600",
  },
  released: {
    color: "bg-green-100 text-green-800 border-green-200", 
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  disputed: {
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600",
  },
};

export function EscrowSection() {
  const config = statusConfig[escrowData.status];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="w-5 h-5" />
          <span>Escrow Payment - {escrowData.id}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Escrow Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-blue-100`}>
              <config.icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{escrowData.amount}</h3>
              <p className="text-sm text-muted-foreground">Escrow Amount</p>
            </div>
          </div>
          <Badge variant="outline" className={config.color}>
            {escrowData.status}
          </Badge>
        </div>

        {/* Parties Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Buyer</span>
            </div>
            <p className="text-sm text-foreground">{escrowData.buyer}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Seller</span>
            </div>
            <p className="text-sm text-foreground">{escrowData.seller}</p>
          </div>
        </div>

        {/* Release Conditions */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>Release Conditions</span>
          </div>
          <p className="text-sm text-foreground">{escrowData.releaseConditions}</p>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Locked Date</p>
            <p className="text-foreground font-medium">{escrowData.lockedDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Est. Release</p>
            <p className="text-foreground font-medium">{escrowData.estimatedRelease}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Raise Dispute
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
