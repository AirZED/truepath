
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Search, Filter, Eye, Package, MapPin, Clock, Truck } from "lucide-react";

const shipments = [
  {
    id: "SC-2024-001",
    product: "Electronic Components",
    origin: "Shanghai, China",
    destination: "Seattle, WA",
    status: "in-transit",
    progress: 60,
    estimatedDelivery: "2024-01-30",
    carrier: "Ocean Freight Inc.",
    trackingNumber: "OF-891234567",
    value: "$45,000",
    weight: "2.5 tons"
  },
  {
    id: "SC-2024-002", 
    product: "Medical Supplies",
    origin: "Mumbai, India",
    destination: "New York, NY",
    status: "completed",
    progress: 100,
    estimatedDelivery: "2024-01-25",
    carrier: "Global Express",
    trackingNumber: "GE-456789012",
    value: "$78,500",
    weight: "1.8 tons"
  },
  {
    id: "SC-2024-003",
    product: "Automotive Parts",
    origin: "Detroit, MI",
    destination: "Los Angeles, CA",
    status: "pending",
    progress: 0,
    estimatedDelivery: "2024-02-05",
    carrier: "Cross Country Logistics",
    trackingNumber: "CCL-234567890",
    value: "$125,000",
    weight: "5.2 tons"
  },
  {
    id: "SC-2024-004",
    product: "Textile Materials",
    origin: "Bangkok, Thailand",
    destination: "Miami, FL",
    status: "delayed",
    progress: 35,
    estimatedDelivery: "2024-02-08",
    carrier: "Maritime Solutions",
    trackingNumber: "MS-567890123",
    value: "$32,000",
    weight: "3.1 tons"
  }
];

const statusColors = {
  completed: "bg-green-100 text-green-800 border-green-200",
  "in-transit": "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  delayed: "bg-red-100 text-red-800 border-red-200",
};

export function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Shipments</h1>
          <p className="text-muted-foreground">Monitor and manage all your supply chain shipments</p>
        </div>
        <Button>
          <Package className="w-4 h-4 mr-2" />
          New Shipment
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Shipments</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by ID, product, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-transit">In Transit</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Shipments ({filteredShipments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Est. Delivery</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-medium">{shipment.id}</TableCell>
                      <TableCell>{shipment.product}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          <span>{shipment.origin} → {shipment.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[shipment.status]}>
                          {shipment.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${shipment.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">{shipment.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <Clock className="w-3 h-3" />
                          <span>{shipment.estimatedDelivery}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{shipment.value}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedShipment(shipment.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShipments.map((shipment) => (
              <Card key={shipment.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{shipment.id}</CardTitle>
                    <Badge variant="outline" className={statusColors[shipment.status]}>
                      {shipment.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{shipment.product}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{shipment.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all" 
                        style={{ width: `${shipment.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-1 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Route:</span>
                    </div>
                    <p className="text-sm font-medium">{shipment.origin} → {shipment.destination}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Est. Delivery:</span>
                    </div>
                    <span className="font-medium">{shipment.estimatedDelivery}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Truck className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Value:</span>
                    </div>
                    <span className="font-medium text-primary">{shipment.value}</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => setSelectedShipment(shipment.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
