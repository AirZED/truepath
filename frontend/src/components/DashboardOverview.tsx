
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Lock, Bell, CheckCircle } from "lucide-react";

const stats = [
  {
    title: "Total Shipments",
    value: "1,247",
    change: "+12%",
    icon: Truck,
    changeType: "positive" as const,
  },
  {
    title: "Active Escrows",
    value: "$2.4M",
    change: "+8%",
    icon: Lock,
    changeType: "positive" as const,
  },
  // {
  //   title: "Pending Disputes",
  //   value: "3",
  //   change: "-2",
  //   icon: Bell,
  //   changeType: "negative" as const,
  // },
  {
    title: "Delivery Success Rate",
    value: "98.7%",
    change: "+0.3%",
    icon: CheckCircle,
    changeType: "positive" as const,
  },
];

export function DashboardOverview() {
  return (
    <div className="flex w-full gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="flex-1 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
              {stat.change} from last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
