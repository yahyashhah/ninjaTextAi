// components/department-admin/auth-logs.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface AuthLog {
  id: string;
  userId: string;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    clerkUserId: string;
  };
  activity: string;
  metadata: string | null;
  createdAt: Date;
}

interface AuthLogsProps {
  organizationId: string;
}

export function AuthLogs({ organizationId }: AuthLogsProps) {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activityType, setActivityType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  const fetchAuthLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        orgId: organizationId,
        page: page.toString(),
        limit: "20",
        ...(activityType !== "all" && { type: activityType })
      });

      const response = await fetch(`/api/department/auth-logs?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch auth logs: ${response.status}`);
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setAvailableTypes(data.filters.activityTypes || []);
    } catch (error) {
      console.error("Error fetching auth logs:", error);
      setError(error instanceof Error ? error.message : "Failed to load authentication logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchAuthLogs();
    }
  }, [organizationId, page, activityType]);

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/department/auth-logs/export?orgId=${organizationId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `auth-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to export authentication logs");
      }
    } catch (error) {
      console.error("Error exporting auth logs:", error);
      alert("Failed to export authentication logs");
    }
  };

  const getActivityBadgeVariant = (activity: string) => {
    switch (activity) {
      case 'login':
      case 'session_created':
        return 'default';
      case 'logout':
      case 'session_ended':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getActivityDisplayName = (activity: string) => {
    switch (activity) {
      case 'login':
      case 'session_created':
        return 'Sign In';
      case 'logout':
      case 'session_ended':
        return 'Sign Out';
      default:
        return activity;
    }
  };

  const filteredLogs = logs.filter(log => 
    searchQuery === "" || 
    (log.user.firstName && log.user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.user.lastName && log.user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.user.email && log.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Authentication Logs</CardTitle>
            <CardDescription>
              Sign-in and sign-out history for your department members
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAuthLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="login">Sign Ins</SelectItem>
              <SelectItem value="logout">Sign Outs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16 ml-4"></div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length > 0 ? (
          <>
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">
                      {log.user.firstName} {log.user.lastName} ({log.user.email})
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                      {log.metadata && (
                        <>
                          <span>•</span>
                          <span className="text-xs">
                            {JSON.parse(log.metadata).sessionId ? `Session: ${JSON.parse(log.metadata).sessionId.substring(0, 8)}...` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant={getActivityBadgeVariant(log.activity)} 
                    className="ml-0 sm:ml-4 mt-2 sm:mt-0"
                  >
                    {getActivityDisplayName(log.activity)}
                  </Badge>
                </div>
              ))}
            </div>

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
            No authentication logs found
          </div>
        )}
      </CardContent>
    </Card>
  );
}