// components/role-switcher.tsx
"use client";

import { useUser, useOrganizationList } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User, Shield, Building, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationMembership {
  organization: {
    id: string;
    name: string;
  };
  role: string;
}

interface RoleOption {
  id: string;
  label: string;
  icon: any;
  active: boolean;
  orgId?: string;
}

export function RoleSwitcher() {
  const { user } = useUser();
  const { setActive, userMemberships } = useOrganizationList();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const isSuperAdmin = !!user?.publicMetadata?.admin;
  const departmentAdminOrgs = (userMemberships.data || []).filter(
    (membership: any) => membership.role === "admin" || membership.role === "org:admin"
  );
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const getCurrentRole = () => {
    if (currentPath.startsWith('/admin')) return 'super-admin';
    if (currentPath.startsWith('/department-admin')) return 'department-admin';
    return 'user';
  };

  const handleRoleSwitch = async (role: string, orgId?: string) => {
    setIsSwitching(true);
    
    // Store the role preference
    if (user?.id) {
      localStorage.setItem(`rolePreference_${user.id}`, role);
      if (orgId) {
        localStorage.setItem(`lastOrg_${user.id}`, orgId);
      }
    }
    
    // Redirect based on selected role
    if (role === 'super-admin' && isSuperAdmin) {
      router.push('/admin');
    } else if (role === 'department-admin') {
      // Set the active organization if specific org is selected
      if (orgId && setActive) {
        try {
          await setActive({ organization: orgId });
        } catch (error) {
          console.error("Error setting active organization:", error);
        }
      }
      router.push('/department-admin');
    } else if (role === 'user') {
      router.push('/chat');
    }
    
    setIsSwitching(false);
  };

  const getAvailableRoles = (): RoleOption[] => {
    const roles: RoleOption[] = [];
    
    if (isSuperAdmin) {
      roles.push({
        id: 'super-admin',
        label: 'Super Admin',
        icon: Shield,
        active: getCurrentRole() === 'super-admin'
      });
    }
    
    if (departmentAdminOrgs.length > 0) {
      departmentAdminOrgs.forEach((org: OrganizationMembership) => {
        roles.push({
          id: 'department-admin',
          label: `Dept Admin: ${org.organization.name}`,
          icon: Building,
          active: getCurrentRole() === 'department-admin',
          orgId: org.organization.id
        });
      });
    }
    
    roles.push({
      id: 'user',
      label: 'Officer View',
      icon: User,
      active: getCurrentRole() === 'user'
    });
    
    return roles;
  };

  const availableRoles = getAvailableRoles();
  const currentRole = availableRoles.find(role => role.active) || availableRoles[0];

  if (availableRoles.length <= 1) {
    return null; // Don't show switcher if user only has one role
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={isSwitching}>
          {currentRole?.icon && <currentRole.icon className="h-4 w-4" />}
          <span className="max-w-xs truncate">{currentRole?.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-sm">
        {availableRoles.map((role) => (
          <DropdownMenuItem
            key={`${role.id}-${role.orgId || 'default'}`}
            onClick={() => handleRoleSwitch(role.id, role.orgId)}
            disabled={role.active || isSwitching}
            className="flex items-center gap-2"
          >
            <role.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{role.label}</span>
            {role.active && <span className="ml-2 text-xs text-muted-foreground">(Current)</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}