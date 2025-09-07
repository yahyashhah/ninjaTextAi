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
import { SafeSelect } from "@/components/ui/safe-select";

interface SystemError {
  id: string;
  type: string;
  message: string;
  userId: string | null;
  metadata: string | null;
  createdAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
}

const SystemHealth = () => {
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [errorType, setErrorType] = useState('');
  const [errorCounts, setErrorCounts] = useState<{type: string, _count: {id: number}}[]>([]);

  useEffect(() => {
    const fetchErrors = async () => {
      try {
        setLoading(true);
        const url = `/api/admin/errors?page=${page}&limit=20${errorType ? `&type=${errorType}` : ''}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setErrors(data.errors);
          setTotalPages(data.totalPages);
          setErrorCounts(data.errorCounts);
        }
      } catch (error) {
        console.error("Error fetching system errors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchErrors();
  }, [page, errorType]);

  const formatMetadata = (metadata: string | null) => {
    if (!metadata) return '-';
    
    try {
      const parsed = JSON.parse(metadata);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return metadata;
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'api_error': return 'bg-red-100 text-red-800';
      case 'login_error': return 'bg-orange-100 text-orange-800';
      case 'report_generation_error': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare items for SafeSelect
  const errorItems = errorCounts
    .filter(count => count.type && count.type.trim() !== "")
    .map(count => ({
      value: count.type,
      label: `${count.type} (${count._count.id})`
    }));

  if (loading && errors.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  console.log("error Items", errorItems);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Errors</h2>
        
        <SafeSelect
          value={errorType}
          onValueChange={setErrorType}
          placeholder="Filter by type"
          items={errorItems}
          className="w-[180px]"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={error.id}>
                <TableCell>
                  <Badge className={getErrorColor(error.type)}>
                    {error.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {error.message}
                </TableCell>
                <TableCell>
                  {error.user ? (
                    <div>
                      <div className="font-medium">{error.user.firstName} {error.user.lastName}</div>
                      <div className="text-sm text-gray-500">{error.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-gray-500">System</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {formatMetadata(error.metadata)}
                </TableCell>
                <TableCell>
                  {new Date(error.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;