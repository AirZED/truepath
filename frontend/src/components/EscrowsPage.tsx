import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Users,
} from "lucide-react";

const EscrowsPage = () => {
  const [selectedTab, setSelectedTab] = useState("active");

  const escrows = [
    {
      id: "ESC-001",
      amount: "$25,000",
      buyer: "TechCorp Ltd",
      seller: "Global Manufacturing Co",
      product: "Industrial Sensors",
      status: "locked",
      created: "2024-01-15",
      releaseCondition: "Delivery confirmation",
      progress: 65,
    },
    {
      id: "ESC-002",
      amount: "$15,500",
      buyer: "MedDevice Inc",
      seller: "Precision Parts LLC",
      product: "Medical Equipment",
      status: "pending_release",
      created: "2024-01-10",
      releaseCondition: "Quality inspection",
      progress: 90,
    },
    {
      id: "ESC-003",
      amount: "$8,750",
      buyer: "AutoTech Solutions",
      seller: "Component Systems",
      product: "Automotive Parts",
      status: "released",
      created: "2024-01-05",
      releaseCondition: "Completed",
      progress: 100,
    },
    {
      id: "ESC-004",
      amount: "$32,000",
      buyer: "Smart Industries",
      seller: "Electronics Hub",
      product: "IoT Devices",
      status: "disputed",
      created: "2024-01-12",
      releaseCondition: "Dispute resolution",
      progress: 45,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "locked":
        return "bg-blue-100 text-blue-800";
      case "pending_release":
        return "bg-yellow-100 text-yellow-800";
      case "released":
        return "bg-green-100 text-green-800";
      case "disputed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "locked":
        return <Shield className="w-4 h-4" />;
      case "pending_release":
        return <Clock className="w-4 h-4" />;
      case "released":
        return <CheckCircle className="w-4 h-4" />;
      case "disputed":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const filteredEscrows = escrows.filter((escrow) => {
    if (selectedTab === "active")
      return escrow.status === "locked" || escrow.status === "pending_release";
    if (selectedTab === "completed") return escrow.status === "released";
    if (selectedTab === "disputed") return escrow.status === "disputed";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Escrow Management
          </h1>
          <p className="text-muted-foreground">
            Secure payment management for supply chain transactions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Locked</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$81,250</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Escrows
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 pending release</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">98.5% success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Urgent attention needed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Escrows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Transactions</CardTitle>
          <CardDescription>
            Manage and monitor all escrow payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value={selectedTab} className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escrow ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEscrows.map((escrow) => (
                    <TableRow key={escrow.id}>
                      <TableCell className="font-medium">{escrow.id}</TableCell>
                      <TableCell className="font-semibold">
                        {escrow.amount}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{escrow.buyer}</div>
                          <div className="text-xs text-muted-foreground">
                            ↓ {escrow.seller}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{escrow.product}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(escrow.status)}>
                          {getStatusIcon(escrow.status)}
                          <span className="ml-1 capitalize">
                            {escrow.status.replace("_", " ")}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${escrow.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {escrow.progress}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          {escrow.status === "pending_release" && (
                            <Button size="sm">Release</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EscrowsPage;
