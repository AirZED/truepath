
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, RotateCcw, Factory, Truck, Warehouse, Store, User } from "lucide-react";

interface MapLocation {
  id: number;
  title: string;
  position: { x: number; y: number };
  status: "completed" | "in-transit" | "pending" | "delayed";
  timestamp: string;
  location: string;
  details: string;
  icon: React.ComponentType<any>;
}

const locations: MapLocation[] = [
  {
    id: 1,
    title: "Manufacturer",
    position: { x: 15, y: 70 },
    status: "completed",
    timestamp: "2024-01-15 09:00",
    location: "Shanghai, China",
    details: "Product manufactured and quality checked",
    icon: Factory,
  },
  {
    id: 2,
    title: "Transport",
    position: { x: 25, y: 60 },
    status: "completed",
    timestamp: "2024-01-16 14:30",
    location: "Shanghai Port",
    details: "Shipped via container vessel MV Ocean Star",
    icon: Truck,
  },
  {
    id: 3,
    title: "Warehouse",
    position: { x: 60, y: 45 },
    status: "in-transit",
    timestamp: "2024-01-28 10:00",
    location: "Los Angeles, CA",
    details: "Currently in transit to distribution center",
    icon: Warehouse,
  },
  {
    id: 4,
    title: "Retailer",
    position: { x: 75, y: 35 },
    status: "pending",
    timestamp: "Est. 2024-01-30",
    location: "Seattle, WA",
    details: "Awaiting delivery to retail location",
    icon: Store,
  },
  {
    id: 5,
    title: "Customer",
    position: { x: 85, y: 25 },
    status: "pending",
    timestamp: "Est. 2024-02-01",
    location: "Seattle, WA",
    details: "Final delivery to customer address",
    icon: User,
  },
];

const statusColors = {
  completed: "#22c55e",
  "in-transit": "#3b82f6",
  pending: "#6b7280",
  delayed: "#ef4444",
};

const statusFillColors = {
  completed: "#dcfce7",
  "in-transit": "#dbeafe",
  pending: "#f3f4f6",
  delayed: "#fee2e2",
};

interface SupplyChainMapProps {
  highlightedStep?: number | null;
  onStepClick?: (stepId: number) => void;
}

export function SupplyChainMap({ highlightedStep, onStepClick }: SupplyChainMapProps) {
  const [hoveredLocation, setHoveredLocation] = useState<number | null>(null);

  const generatePath = () => {
    const pathData = locations.map((location, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${location.position.x} ${location.position.y}`;
    }).join(' ');
    
    return pathData;
  };

  const generateCompletedPath = () => {
    const completedLocations = locations.filter(loc => loc.status === 'completed');
    if (completedLocations.length < 2) return '';
    
    const pathData = completedLocations.map((location, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${location.position.x} ${location.position.y}`;
    }).join(' ');
    
    return pathData;
  };

  const generateInTransitPath = () => {
    const completedCount = locations.filter(loc => loc.status === 'completed').length;
    const inTransitLocation = locations.find(loc => loc.status === 'in-transit');
    
    if (!inTransitLocation || completedCount === 0) return '';
    
    const lastCompleted = locations.filter(loc => loc.status === 'completed').pop();
    if (!lastCompleted) return '';
    
    return `M ${lastCompleted.position.x} ${lastCompleted.position.y} L ${inTransitLocation.position.x} ${inTransitLocation.position.y}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Supply Chain Movement Trail</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-border overflow-hidden">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            className="absolute inset-0"
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Full route path (pending) */}
            <path
              d={generatePath()}
              stroke="#d1d5db"
              strokeWidth="0.8"
              fill="none"
              strokeDasharray="2,2"
              opacity="0.6"
            />
            
            {/* Completed route path */}
            <path
              d={generateCompletedPath()}
              stroke={statusColors.completed}
              strokeWidth="1.2"
              fill="none"
            />
            
            {/* In-transit route path */}
            <path
              d={generateInTransitPath()}
              stroke={statusColors["in-transit"]}
              strokeWidth="1.2"
              fill="none"
              strokeDasharray="3,3"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="0;6"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
            
            {/* Location markers */}
            {locations.map((location) => {
              const isHighlighted = highlightedStep === location.id;
              const isHovered = hoveredLocation === location.id;
              const scale = isHighlighted || isHovered ? 1.3 : 1;
              
              return (
                <g key={location.id}>
                  {/* Marker circle */}
                  <circle
                    cx={location.position.x}
                    cy={location.position.y}
                    r={2.5 * scale}
                    fill={statusFillColors[location.status]}
                    stroke={statusColors[location.status]}
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onStepClick?.(location.id)}
                    onMouseEnter={() => setHoveredLocation(location.id)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  />
                  
                  {/* Highlight ring */}
                  {(isHighlighted || isHovered) && (
                    <circle
                      cx={location.position.x}
                      cy={location.position.y}
                      r={4 * scale}
                      fill="none"
                      stroke={isHighlighted ? "#f59e0b" : statusColors[location.status]}
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  )}
                  
                  {/* Location label */}
                  <text
                    x={location.position.x}
                    y={location.position.y - 4}
                    textAnchor="middle"
                    fontSize="3"
                    fill="#374151"
                    className="font-medium pointer-events-none"
                  >
                    {location.title}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Hover tooltip */}
          {hoveredLocation && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-border p-3 max-w-xs z-10">
              {(() => {
                const location = locations.find(loc => loc.id === hoveredLocation);
                if (!location) return null;
                
                return (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <location.icon className="w-4 h-4" style={{ color: statusColors[location.status] }} />
                      <h4 className="font-medium text-sm">{location.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{location.timestamp}</p>
                    <p className="text-xs text-muted-foreground mb-1">{location.location}</p>
                    <p className="text-xs">{location.details}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize text-muted-foreground">
                {status.replace('-', ' ')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
