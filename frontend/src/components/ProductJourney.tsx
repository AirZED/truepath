
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Factory, Truck, Warehouse, Store, User, Clock, MapPin } from "lucide-react";

const journeySteps = [
  {
    id: 1,
    title: "Manufacturer",
    icon: Factory,
    status: "completed" as const,
    timestamp: "2024-01-15 09:00",
    location: "Shanghai, China",
    details: "Product manufactured and quality checked. All specifications met.",
  },
  {
    id: 2,
    title: "Transport",
    icon: Truck,
    status: "completed" as const,
    timestamp: "2024-01-16 14:30",
    location: "Shanghai Port",
    details: "Shipped via container vessel MV Ocean Star. ETA: 2024-01-28",
  },
  {
    id: 3,
    title: "Warehouse",
    icon: Warehouse,
    status: "in-transit" as const,
    timestamp: "2024-01-28 10:00",
    location: "Los Angeles, CA",
    details: "Currently in transit to distribution center.",
  },
  {
    id: 4,
    title: "Retailer",
    icon: Store,
    status: "pending" as const,
    timestamp: "Est. 2024-01-30",
    location: "Seattle, WA",
    details: "Awaiting delivery to retail location.",
  },
  {
    id: 5,
    title: "Customer",
    icon: User,
    status: "pending" as const,
    timestamp: "Est. 2024-02-01",
    location: "Seattle, WA",
    details: "Final delivery to customer address.",
  },
];

const statusColors = {
  completed: "bg-green-100 text-green-800 border-green-200",
  "in-transit": "bg-blue-100 text-blue-800 border-blue-200", 
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  delayed: "bg-red-100 text-red-800 border-red-200",
};

const iconColors = {
  completed: "text-green-600 bg-green-100",
  "in-transit": "text-blue-600 bg-blue-100",
  pending: "text-gray-600 bg-gray-100", 
  delayed: "text-red-600 bg-red-100",
};

interface ProductJourneyProps {
  highlightedStep?: number | null;
  onStepClick?: (stepId: number) => void;
}

export function ProductJourney({ highlightedStep, onStepClick }: ProductJourneyProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const handleStepClick = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
    onStepClick?.(stepId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Truck className="w-5 h-5" />
          <span>Product Journey - Shipment #SC-2024-001</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {journeySteps.map((step, index) => {
            const isExpanded = expandedStep === step.id;
            const isHighlighted = highlightedStep === step.id;
            const isLastStep = index === journeySteps.length - 1;
            
            return (
              <div key={step.id} className="relative">
                <div 
                  className={`flex items-start space-x-4 cursor-pointer p-3 rounded-lg transition-colors ${
                    isHighlighted 
                      ? 'bg-amber-50 border border-amber-200' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => handleStepClick(step.id)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColors[step.status]} ${
                    isHighlighted ? 'ring-2 ring-amber-400' : ''
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">{step.title}</h3>
                      <Badge variant="outline" className={statusColors[step.status]}>
                        {step.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{step.timestamp}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{step.location}</span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{step.details}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {!isLastStep && (
                  <div className="absolute left-5 top-16 w-px h-4 bg-border"></div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
