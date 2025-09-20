"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Search, Upload, Download, Shield, User } from "lucide-react";

interface MemberManagementProps {
  organizationId: string;
  onRefresh: () => void;
}

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
}

export function MemberManagement({ organizationId, onRefresh }: MemberManagementProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMembers();
  }, [organizationId]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/department/members?orgId=${organizationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const result = await response.json();
      setMembers(result.members || []);
    } catch (error) {
      console.error("Error fetching members:", error);
      alert('Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const response = await fetch('/api/department/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: organizationId,
          email: inviteEmail,
          role: inviteRole
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setInviteEmail("");
        setInviteRole("member");
        onRefresh();
        fetchMembers();
        alert('Member invited successfully!');
      } else {
        alert(result.error || 'Failed to invite member');
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      alert('Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/department/members?orgId=${organizationId}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
        fetchMembers();
        alert('Member removed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('File input changed');
  const file = event.target.files?.[0];
  console.log('Selected file:', file);
  
  if (!file) {
    console.log('No file selected');
    return;
  }

  // Validate file type
  if (!file.name.endsWith('.csv')) {
    alert('Please select a CSV file');
    return;
  }

  setIsImporting(true);
  console.log('Starting import process...');
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    console.log('FormData created');

    const response = await fetch(`/api/department/bulk-import?orgId=${organizationId}`, {
      method: 'POST',
      body: formData,
    });

    console.log('API response status:', response.status);
    const result = await response.json();
    console.log('API response:', result);

    if (response.ok) {
      alert(`Bulk import completed: ${result.importedCount} successful, ${result.failedCount} failed`);
      if (result.errors && result.errors.length > 0) {
        console.log('Import errors:', result.errors);
        if (result.errors.length <= 5) {
          alert(`Errors:\n${result.errors.join('\n')}`);
        } else {
          alert(`There were ${result.errors.length} errors. Check console for details.`);
        }
      }
      fetchMembers();
      onRefresh();
    } else {
      alert(result.error || 'Failed to process bulk import');
    }
  } catch (error) {
    console.error('Error processing bulk import:', error);
    alert('Failed to process bulk import');
  } finally {
    setIsImporting(false);
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  }
};

  const triggerFileInput = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const filteredMembers = members.filter(member =>
    member.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Member Management</h2>
          <p className="text-muted-foreground">
            Manage department members and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => triggerFileInput(fileInputRef)}
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Bulk Import'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleBulkImport}
            className="hidden"
            disabled={isImporting}
          />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Members</CardTitle>
            <CardDescription>
              {members.length} members in your department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="border rounded-lg">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Member</th>
                    <th className="p-3 text-left text-sm font-medium">Email</th>
                    <th className="p-3 text-left text-sm font-medium">Role</th>
                    <th className="p-3 text-left text-sm font-medium">Joined</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {member.user.profileImageUrl ? (
                            <img
                              src={member.user.profileImageUrl}
                              alt={`${member.user.firstName} ${member.user.lastName}`}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">{member.user.email}</td>
                      <td className="p-3">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? 'No members found' : 'No members in this department'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>
              Send an invitation to join your department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="officer@department.gov"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <select
                  id="role"
                  className="w-full p-2 border rounded"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">Officer</option>
                  <option value="admin">Department Admin</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={isInviting}>
                {isInviting ? (
                  <>Sending Invitation...</>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Bulk Import
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Import multiple members via CSV file with columns: email, firstName, lastName, role
              </p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => triggerFileInput(sidebarFileInputRef)}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Upload CSV'}
              </Button>
              <input
                ref={sidebarFileInputRef}
                type="file"
                accept=".csv"
                onChange={handleBulkImport}
                className="hidden"
                disabled={isImporting}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}