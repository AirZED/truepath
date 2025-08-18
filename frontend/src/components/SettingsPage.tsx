
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Shield, Bell, Palette, Key, Users, Settings as SettingsIcon, Database } from "lucide-react";

const SettingsPage = () => {
  const [selectedTab, setSelectedTab] = useState("profile");
  const [notifications, setNotifications] = useState({
    escrowUpdates: true,
    disputeAlerts: true,
    shipmentTracking: false,
    systemMaintenance: true
  });

  const users = [
    { id: 1, name: "John Smith", email: "john@company.com", role: "Administrator", status: "Active", lastLogin: "2024-01-19" },
    { id: 2, name: "Sarah Johnson", email: "sarah@company.com", role: "Manager", status: "Active", lastLogin: "2024-01-18" },
    { id: 3, name: "Mike Chen", email: "mike@company.com", role: "Operator", status: "Inactive", lastLogin: "2024-01-15" },
  ];

  const apiKeys = [
    { id: 1, name: "Production API Key", lastUsed: "2024-01-19", status: "Active", permissions: "Full Access" },
    { id: 2, name: "Development API Key", lastUsed: "2024-01-18", status: "Active", permissions: "Read Only" },
    { id: 3, name: "Mobile App API Key", lastUsed: "2024-01-17", status: "Revoked", permissions: "Limited Access" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account, preferences, and system configuration</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>Update your personal information and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <div className="mt-1 p-2 border rounded text-sm">John Smith</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <div className="mt-1 p-2 border rounded text-sm">john.smith@company.com</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Company</label>
                      <div className="mt-1 p-2 border rounded text-sm">TechCorp Industries</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <div className="mt-1 p-2 border rounded text-sm">Supply Chain Manager</div>
                    </div>
                  </div>
                  <Button>Update Profile</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Login Notifications</h4>
                        <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="outline">Change Password</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="w-5 h-5" />
                    <span>Notification Preferences</span>
                  </CardTitle>
                  <CardDescription>Choose what notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Escrow Updates</h4>
                        <p className="text-sm text-muted-foreground">Notifications about escrow status changes</p>
                      </div>
                      <Switch 
                        checked={notifications.escrowUpdates}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, escrowUpdates: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Dispute Alerts</h4>
                        <p className="text-sm text-muted-foreground">Immediate alerts for new disputes</p>
                      </div>
                      <Switch 
                        checked={notifications.disputeAlerts}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, disputeAlerts: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Shipment Tracking</h4>
                        <p className="text-sm text-muted-foreground">Updates on shipment location and status</p>
                      </div>
                      <Switch 
                        checked={notifications.shipmentTracking}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, shipmentTracking: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">System Maintenance</h4>
                        <p className="text-sm text-muted-foreground">Notifications about scheduled maintenance</p>
                      </div>
                      <Switch 
                        checked={notifications.systemMaintenance}
                        onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemMaintenance: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>User Management</span>
                      </CardTitle>
                      <CardDescription>Manage user accounts and permissions</CardDescription>
                    </div>
                    <Button>Add User</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>
                            <Badge className={user.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">Edit</Button>
                              <Button variant="outline" size="sm">Remove</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Key className="w-5 h-5" />
                        <span>API Key Management</span>
                      </CardTitle>
                      <CardDescription>Manage API keys for system integrations</CardDescription>
                    </div>
                    <Button>Generate New Key</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key Name</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.name}</TableCell>
                          <TableCell>{key.permissions}</TableCell>
                          <TableCell>
                            <Badge className={key.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {key.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{key.lastUsed}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">View</Button>
                              <Button variant="outline" size="sm">Revoke</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <SettingsIcon className="w-5 h-5" />
                    <span>System Configuration</span>
                  </CardTitle>
                  <CardDescription>Configure system-wide settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Blockchain Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-confirm transactions</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Gas optimization</span>
                          <Switch />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Data Retention</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Archive old shipments</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Export data weekly</span>
                          <Switch />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex space-x-4">
                      <Button variant="outline">Backup Data</Button>
                      <Button variant="outline">System Logs</Button>
                      <Button variant="outline">Maintenance Mode</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
