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

interface AuditLog {
  id: string;
  userId: string;
  activity: string;
  metadata: string | null;
  createdAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activityType, setActivityType] = useState('');
  const [activityCounts, setActivityCounts] = useState<{activity: string, _count: {id: number}}[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const url = `/api/admin/audit-logs?page=${page}&limit=20${activityType ? `&type=${activityType}` : ''}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setLogs(data.auditLogs);
          setTotalPages(data.totalPages);
          setActivityCounts(data.activityCounts);
        }
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, activityType]);

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

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-blue-100 text-blue-800';
      case 'report_created': return 'bg-purple-100 text-purple-800';
      case 'report_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Prepare items for SafeSelect
  const activityItems = activityCounts
    .filter(count => count.activity && count.activity.trim() !== "")
    .map(count => ({
      value: count.activity,
      label: `${count.activity} (${count._count.id})`
    }));

  if (loading && logs.length === 0) {
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

  console.log(activityItems, "activityItems");
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        
        <SafeSelect
          value={activityType}
          onValueChange={setActivityType}
          placeholder="Filter by activity"
          items={activityItems}
          className="w-[180px]"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {log.user ? (
                    <div>
                      <div className="font-medium">{log.user.firstName} {log.user.lastName}</div>
                      <div className="text-sm text-gray-500">{log.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unknown User</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getActivityColor(log.activity)}>
                    {log.activity}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {formatMetadata(log.metadata)}
                </TableCell>
                <TableCell>
                  {new Date(log.createdAt).toLocaleString()}
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

export default AuditLogs;