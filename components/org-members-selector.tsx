"use client";

import { useOrganization } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw } from "lucide-react";

interface User {
  clerkUserId: string;
  isPro: boolean;
  proAccessGrantedBy: string | null;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  user: User | null;
}

export const OrgMembersSelector = () => {
  const { organization } = useOrganization();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchMembers();
    }
  }, [organization?.id]);

  const fetchMembers = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/organization/members?orgId=${organization.id}`);

      if (!res.ok) throw new Error("Failed to fetch members");

      const data = await res.json();
      setMembers(data);

      // Pre-select members who have pro access granted by this org
      const preselected = data
        .filter((m: OrganizationMember) => 
          m.user?.isPro && m.user?.proAccessGrantedBy === organization.id
        )
        .map((m: OrganizationMember) => m.userId);

      setSelectedMembers(preselected);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load members",
      });
    } finally {
      setLoading(false);
    }
  };

const syncMembers = async () => {
  if (!organization?.id) return;

  try {
    setSyncing(true);
    const res = await fetch("/api/organization/sync-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: organization.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to sync members");
    }

    toast({
      title: "Sync completed",
      description: `Successfully processed ${data.stats.success} members. ${
        data.stats.skipped ? `${data.stats.skipped} skipped. ` : ''
      }${
        data.stats.errors ? `${data.stats.errors} errors.` : ''
      }`,
      ...(data.stats.errors > 0 && {
        variant: "destructive",
        description: `Errors: ${data.errorMessages?.join(", ")}`,
      }),
    });

    await fetchMembers(); // Refresh the list
  } catch (error) {
    console.error("Error syncing members:", error);
    toast({
      variant: "destructive",
      title: "Sync failed",
      description: error instanceof Error ? error.message : "Failed to sync members",
    });
  } finally {
    setSyncing(false);
  }
};

  const handleSelectionChange = (userId: string, checked: boolean) => {
    setSelectedMembers((prev) => 
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  const saveSeatAssignments = async () => {
    if (!organization?.id) return;

    try {
      setSaving(true);
      const res = await fetch("/api/organization/assign-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: organization.id,
          memberIds: selectedMembers,
        }),
      });

      if (!res.ok) throw new Error("Failed to save assignments");

      toast({ title: "Seat assignments updated successfully" });
      await fetchMembers(); // Refresh the list
    } catch (error) {
      console.error("Error saving seat assignments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update seat assignments",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">Assign Pro Access</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Select members to grant pro access (up to your available seats)
          </p>
        </div>
        <Button 
          onClick={syncMembers} 
          disabled={syncing || saving}
          variant="outline"
          size="sm"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync Members
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {members.length === 0 ? (
          <div className="text-center py-4">
            <p>No members found in this organization</p>
            <Button 
              onClick={syncMembers} 
              disabled={syncing}
              variant="link"
              className="mt-2"
            >
              {syncing ? "Syncing..." : "Sync Members"}
            </Button>
          </div>
        ) : (
          members.map((member) => (
  <div 
    key={member.id} 
    className="flex items-center gap-4 p-3 border rounded hover:bg-muted/50"
  >
    <Checkbox
      checked={selectedMembers.includes(member.userId)}
      onCheckedChange={(checked: boolean | "indeterminate") =>
        handleSelectionChange(member.userId, checked === true)
      }
      disabled={
        member.user?.isPro &&
        member.user?.proAccessGrantedBy !== organization?.id
      }
    />
    
    {/* Profile Image */}
    {member.user?.profileImageUrl ? (
      <img 
        src={member.user.profileImageUrl} 
        alt="Profile"
        className="h-10 w-10 rounded-full"
      />
    ) : (
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-xs">
          {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
        </span>
      </div>
    )}
    
    <div className="flex-1">
      {/* Name */}
      <p className="font-medium">
        {member.user?.firstName || member.user?.lastName 
          ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
          : 'Unnamed User'}
      </p>
      
      {/* Email */}
      {member.user?.email && (
        <p className="text-xs text-muted-foreground">
          {member.user.email}
        </p>
      )}
      
      {/* Clerk User ID */}
      {member.user?.clerkUserId && (
        <p className="text-xs text-muted-foreground">
          ID: {member.user.clerkUserId}
        </p>
      )}
    </div>
    
    <div className="flex flex-col items-end">
      <span className="text-sm font-medium">
        {member.role === "org:admin" ? "Admin" : "Member"}
      </span>
      <span className="text-xs text-muted-foreground">
        {member.user?.isPro ? (
          member.user?.proAccessGrantedBy === organization?.id ? (
            <span className="text-green-600">Pro (from this org)</span>
          ) : (
            <span className="text-amber-600">Pro (external)</span>
          )
        ) : (
          <span className="text-muted-foreground">Basic</span>
        )}
      </span>
    </div>
  </div>
  )))}
      </div>

      {members.length > 0 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm">
            Selected: {selectedMembers.length} members
          </div>
          <div className="space-x-2">
            <Button 
              onClick={syncMembers} 
              disabled={syncing || saving}
              variant="outline"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync
            </Button>
            <Button 
              onClick={saveSeatAssignments} 
              disabled={saving || loading || syncing}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {saving ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};