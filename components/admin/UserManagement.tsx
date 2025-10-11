// components/admin/UserManagement.tsx - FIXED VERSION
"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import UserDetail from "./UserDetail";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
  publicMetadata: { admin?: boolean };
  lastSignInAt: Date | null;
  createdAt: Date;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (selectedUserId) {
    return (
      <UserDetail 
        userId={selectedUserId} 
        onBack={() => setSelectedUserId(null)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-gray-500">Total Users: {users.length}</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50">
              <TableCell 
                className="font-medium"
                onClick={() => setSelectedUserId(user.id)}
              >
                {user.firstName} {user.lastName}
                {!user.firstName && !user.lastName && (
                  <span className="text-gray-400">No name</span>
                )}
              </TableCell>
              <TableCell onClick={() => setSelectedUserId(user.id)}>
                {user.emailAddresses[0]?.emailAddress || "No email"}
              </TableCell>
              <TableCell onClick={() => setSelectedUserId(user.id)}>
                <Badge variant={user.publicMetadata?.admin ? "default" : "secondary"}>
                  {user.publicMetadata?.admin ? "Admin" : "User"}
                </Badge>
              </TableCell>
              <TableCell onClick={() => setSelectedUserId(user.id)}>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell onClick={() => setSelectedUserId(user.id)}>
                {user.lastSignInAt 
                  ? new Date(user.lastSignInAt).toLocaleDateString()
                  : "Never"
                }
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {users.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserManagement;