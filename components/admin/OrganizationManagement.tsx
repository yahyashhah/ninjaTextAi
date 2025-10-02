// components/admin/OrganizationManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, RefreshCw, Edit, Trash2, Users, FileText, UserPlus, Shield, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Organization {
  id: string;
  clerkOrgId: string;
  name: string;
  description: string | null;
  location: string | null;
  type: string | null;
  memberCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
    reports: number;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

interface OrganizationAdmin {
  id: string;
  userId: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  assignedAt: Date;
}

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    type: "law_enforcement"
  });

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/organizations?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }
      
      const data = await response.json();
      setOrganizations(data.organizations);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setError(error instanceof Error ? error.message : "Failed to load organizations");
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizationAdmins = async (orgId: string) => {
    try {
      setIsLoadingAdmins(true);
      const response = await fetch(`/api/admin/organizations/${orgId}/admins`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admins: ${response.status}`);
      }
      
      const data = await response.json();
      setAdmins(data.admins);
    } catch (error) {
      console.error("Error fetching organization admins:", error);
      toast({
        title: "Error",
        description: "Failed to load organization admins",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [page]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Organization "${data.organization.name}" created successfully`,
      });

      // Reset form and refresh list
      setFormData({
        name: "",
        description: "",
        location: "",
        type: "law_enforcement"
      });
      setShowCreateForm(false);
      fetchOrganizations();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddAdmin = async (orgId: string) => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingAdmin(true);
      const response = await fetch(`/api/admin/organizations/${orgId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add admin");
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message,
      });

      setNewAdminEmail("");
      fetchOrganizationAdmins(orgId);
      fetchOrganizations(); // Refresh organization list to update member counts
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add admin",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (orgId: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/admins?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove admin");
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message,
      });

      fetchOrganizationAdmins(orgId);
      fetchOrganizations(); // Refresh organization list to update member counts
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove admin",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const organizationTypes = [
    { value: "law_enforcement", label: "Law Enforcement" },
    { value: "security", label: "Security Agency" },
    { value: "government", label: "Government Agency" },
    { value: "corporate", label: "Corporate Security" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Organization Management</h2>
          <p className="text-muted-foreground">
            Create and manage organizations and assign admins
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchOrganizations}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Organization
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Organization</CardTitle>
            <CardDescription>
              Add a new organization to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter organization name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Organization Type</Label>
                  <Select value={formData.type} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location (city, state, etc.)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter organization description"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Organization"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            List of all organizations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded animate-pulse">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16 ml-4"></div>
                </div>
              ))}
            </div>
          ) : organizations.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Admins</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {organizationTypes.find(t => t.value === org.type)?.label || org.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.location || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {org._count?.members || org.memberCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {org._count?.reports || org.reportCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1" />
                          {org.members?.filter(m => m.role === 'admin').length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(org.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrganization(org);
                                  fetchOrganizationAdmins(org.id);
                                }}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Manage Admins - {org.name}</DialogTitle>
                                <DialogDescription>
                                  Add or remove organization administrators
                                </DialogDescription>
                              </DialogHeader>
                              
                              {/* Add Admin Form */}
                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter user email"
                                    value={newAdminEmail}
                                    onChange={(e) => setNewAdminEmail(e.target.value)}
                                    type="email"
                                  />
                                  <Button 
                                    onClick={() => handleAddAdmin(org.id)}
                                    disabled={isAddingAdmin || !newAdminEmail.trim()}
                                  >
                                    {isAddingAdmin ? "Adding..." : "Add Admin"}
                                  </Button>
                                </div>

                                {/* Current Admins List */}
                                <div>
                                  <h4 className="font-medium mb-2">Current Admins</h4>
                                  {isLoadingAdmins ? (
                                    <div className="space-y-2">
                                      {[...Array(2)].map((_, i) => (
                                        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
                                      ))}
                                    </div>
                                  ) : admins.length > 0 ? (
                                    <div className="space-y-2">
                                      {admins.map((admin) => (
                                        <div key={admin.id} className="flex items-center justify-between p-3 border rounded">
                                          <div className="flex items-center space-x-3">
                                            <Shield className="h-4 w-4 text-green-600" />
                                            <div>
                                              <p className="font-medium">
                                                {admin.firstName} {admin.lastName}
                                              </p>
                                              <p className="text-sm text-gray-500">{admin.email}</p>
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              if (confirm(`Remove ${admin.firstName} ${admin.lastName} as admin?`)) {
                                                handleRemoveAdmin(org.id, admin.userId);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-500">
                                      <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p>No admins assigned yet</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedOrganization(null)}>
                                  Close
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No organizations found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}