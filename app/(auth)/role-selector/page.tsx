// app/role-selector/page.tsx
"use client";

import { useUser, useAuth, useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OrganizationMembership {
  organization: {
    id: string;
    name: string;
  };
  role: string;
}

export default function RoleSelector() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const { 
    isLoaded: orgsLoaded, 
    setActive
  } = useOrganizationList();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<OrganizationMembership[]>([]);

  useEffect(() => {
    console.log("🏢 Role selector - checking user organizations");
    console.log("👤 User object:", user ? { 
      id: user.id, 
      hasMemberships: !!user.organizationMemberships?.length,
      memberships: user.organizationMemberships 
    } : null);
    
    // If user is not signed in or doesn't have admin roles, redirect
    if (userLoaded && isSignedIn && orgsLoaded) {
      const isSuperAdmin = !!user?.publicMetadata?.admin;
      console.log("🦸 Super admin status:", isSuperAdmin);
      
      // FIX: Use organization memberships from the user object instead of useOrganizationList()
      const organizationMemberships = user?.organizationMemberships || [];
      console.log("👥 All organization memberships from user:", organizationMemberships);
      
      // Get organizations where user is admin
      const adminOrganizations = organizationMemberships.filter(
        (membership: any) => membership.role === "admin" || membership.role === "org:admin"
      );
      
      console.log("✅ Admin organizations found:", adminOrganizations.map(org => ({
        orgId: org.organization.id,
        orgName: org.organization.name,
        role: org.role
      })));
      
      if (!isSuperAdmin && adminOrganizations.length === 0) {
        console.log("🚀 No admin organizations found - redirecting to chat");
        router.replace('/chat?tutorial=true');
      } else {
        console.log("🎯 Admin organizations found - showing role selector");
        setUserOrganizations(adminOrganizations);
      }
    }
  }, [user, userLoaded, isSignedIn, orgsLoaded, router]);

  const handleRoleSelection = async (role: 'admin' | 'user', orgId?: string) => {
    setIsLoading(true);
    setSelectedRole(role);
    
    // Store the role preference in localStorage for future sessions
    if (user?.id) {
      localStorage.setItem(`rolePreference_${user.id}`, role);
      if (orgId) {
        localStorage.setItem(`lastOrg_${user.id}`, orgId);
      }
    }
    
    // Redirect based on selected role
    if (role === 'admin') {
      // Check if user is super admin or department admin
      const isSuperAdmin = !!user?.publicMetadata?.admin;
      if (isSuperAdmin) {
        console.log("🎯 Redirecting to super admin dashboard");
        router.push('/admin');
      } else if (orgId && setActive) {
        // Set the active organization and redirect to department admin
        console.log("🎯 Setting active organization:", orgId);
        try {
          await setActive({ organization: orgId });
          console.log("✅ Successfully set active organization");
        } catch (error) {
          console.error("❌ Error setting active organization:", error);
        }
        router.push('/department-admin');
      } else {
        console.log("🎯 Redirecting to department admin");
        router.push('/department-admin');
      }
    } else {
      console.log("🎯 Redirecting to user chat");
      router.push('/chat?tutorial=true');
    }
    setIsLoading(false);
  };

  const getAvailableRoles = () => {
    const roles = [];
    const isSuperAdmin = !!user?.publicMetadata?.admin;
    
    // Show admin option if user is super admin OR has admin organizations
    if (isSuperAdmin || userOrganizations.length > 0) {
      roles.push({
        id: 'admin',
        title: isSuperAdmin ? 'Super Admin Dashboard' : 'Department Admin',
        description: isSuperAdmin 
          ? 'Access the main admin panel to manage the entire application' 
          : 'Manage your department members, reports, and settings',
        icon: isSuperAdmin ? Shield : Building,
      });
    }
    
    // All authenticated users can access the user interface
    roles.push({
      id: 'user',
      title: 'Officer Interface',
      description: 'Access the reporting tools and dashboard as a regular user',
      icon: User,
    });
    
    return roles;
  };

  if (!userLoaded || !isSignedIn || !orgsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const availableRoles = getAvailableRoles();
  const isSuperAdmin = !!user?.publicMetadata?.admin;

  console.log("🎯 Available roles:", availableRoles);
  console.log("👤 User organizations:", userOrganizations);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {user?.firstName || 'Officer'}!
          </h1>
          <p className="text-gray-600">
            Choose how you'd like to access the system today
          </p>
        </div>

        {isSuperAdmin && userOrganizations.length > 0 && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Note:</strong> As a Super Admin, you have access to both the main admin panel and your department admin panel.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableRoles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedRole === role.id ? 'border-blue-500 ring-2 ring-blue-500' : ''
                }`}
                onClick={() => !isLoading && handleRoleSelection(role.id as 'admin' | 'user')}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    {selectedRole === role.id && (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {role.id === 'admin' && userOrganizations.length > 0 && !isSuperAdmin && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Select Department:</p>
                      <select 
                        className="w-full p-2 border rounded text-sm"
                        defaultValue={userOrganizations[0]?.organization.id}
                      >
                        {userOrganizations.map(org => (
                          <option key={org.organization.id} value={org.organization.id}>
                            {org.organization.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full" 
                    disabled={isLoading}
                    onClick={() => {
                      if (role.id === 'admin' && userOrganizations.length > 0 && !isSuperAdmin) {
                        const selectElem = document.querySelector('select');
                        const orgId = selectElem?.value || userOrganizations[0]?.organization.id;
                        handleRoleSelection(role.id as 'admin' | 'user', orgId);
                      } else {
                        handleRoleSelection(role.id as 'admin' | 'user');
                      }
                    }}
                  >
                    {isLoading && selectedRole === role.id ? (
                      <>Redirecting...</>
                    ) : (
                      <>
                        Select {role.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>You can change this selection at any time from your profile menu</p>
        </div>
      </div>
    </div>
  );
}