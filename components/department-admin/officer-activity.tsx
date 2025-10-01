// components/department-admin/officer-activity.tsx (FULLY FIXED)
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, User, FileText, Target, AlertTriangle } from "lucide-react";

interface OfficerActivityProps {
  organizationId: string;
}

interface OfficerStats {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  reportCount: number;
  averageAccuracy: number;
  lastActivity: string | null;
  pendingReviews?: number;
  performance?: string;
}

interface ActivitySummary {
  totalOfficers: number;
  activeOfficers: number;
  totalReports: number;
  averageAccuracy: number;
  dateRange: {
    start: string;
    end: string;
    range: string;
  };
}

const REVIEW_THRESHOLD = 85;

export function OfficerActivity({ organizationId }: OfficerActivityProps) {
  const [officerStats, setOfficerStats] = useState<OfficerStats[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOfficerActivity();
  }, [organizationId, timeRange]);

  // In your frontend component, add this to the fetch function:
const fetchOfficerActivity = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    console.log(`🔄 Fetching officer activity for range: ${timeRange}, org: ${organizationId}`);
    
    const response = await fetch(
      `/api/department/officer-activity?orgId=${organizationId}&range=${timeRange}`
    );
    
    console.log(`📡 API Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', { status: response.status, errorText });
      throw new Error(`Failed to fetch officer activity: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('📊 Officer activity API result:', result);
    
    setOfficerStats(result.officers || []);
    setSummary(result.summary || null);
    
    console.log(`✅ Frontend state updated with ${result.officers?.length || 0} officers`);
  } catch (error) {
    console.error("❌ Error fetching officer activity:", error);
    setError(error instanceof Error ? error.message : 'Failed to load officer activity');
  } finally {
    setIsLoading(false);
  }
};

  // Prepare data for chart - only officers with activity
  const chartData = officerStats
    .filter(officer => officer.reportCount > 0)
    .slice(0, 10) // Limit to top 10 for readability
    .map(officer => ({
      name: `${officer.firstName} ${officer.lastName.charAt(0)}.`,
      reports: officer.reportCount,
      accuracy: Math.round(officer.averageAccuracy),
      fullName: `${officer.firstName} ${officer.lastName}`,
      officerId: officer.userId
    }));

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#10b981'; // green
    if (accuracy >= REVIEW_THRESHOLD) return '#3b82f6'; // blue
    if (accuracy >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getPerformanceBadge = (officer: OfficerStats) => {
    if (officer.reportCount === 0) {
      return <Badge variant="outline">No Activity</Badge>;
    }
    if (officer.averageAccuracy >= 90) {
      return <Badge variant="default">Excellent</Badge>;
    }
    if (officer.averageAccuracy >= REVIEW_THRESHOLD) {
      return <Badge variant="secondary">Good</Badge>;
    }
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const formatLastActivity = (dateString: string | null) => {
    if (!dateString) return 'No activity';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        Loading officer activity...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Error loading officer activity</p>
          <p className="text-sm mb-4 max-w-md">{error}</p>
          <Button onClick={fetchOfficerActivity}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeOfficers = officerStats.filter(o => o.reportCount > 0);
  const topPerformers = activeOfficers
    .filter(officer => officer.averageAccuracy >= REVIEW_THRESHOLD)
    .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
    .slice(0, 5);

  const needsImprovement = activeOfficers
    .filter(officer => officer.averageAccuracy < REVIEW_THRESHOLD)
    .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
    .slice(0, 5);

  const inactiveOfficers = officerStats.filter(o => o.reportCount === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Officer Activity</h2>
          <p className="text-muted-foreground">
            Report submissions and accuracy by officer
            {summary && (
              <span className="text-xs block mt-1">
                {new Date(summary.dateRange.start).toLocaleDateString()} - {new Date(summary.dateRange.end).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("week")}
          >
            Week
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("month")}
          >
            Month
          </Button>
          <Button
            variant={timeRange === "quarter" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("quarter")}
          >
            Quarter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOfficerActivity}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Total Officers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalOfficers || 0}</div>
            <p className="text-xs text-muted-foreground">Organization members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Active Officers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeOfficers || 0}</div>
            <p className="text-xs text-muted-foreground">Submitted reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg. Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.averageAccuracy || 0}%</div>
            <p className="text-xs text-muted-foreground">Active officers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Chart */}
        {chartData.length > 0 ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Reports by Officer (Top 10)</CardTitle>
              <CardDescription>
                Number of reports submitted in the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                        return [value, 'Reports'];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="reports" name="Reports">
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getAccuracyColor(entry.accuracy)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Activity Data</h3>
              <p className="text-muted-foreground">
                No officers have submitted reports in the selected time period.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Officers with accuracy scores ≥ {REVIEW_THRESHOLD}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.length > 0 ? topPerformers.map((officer) => (
                <div key={officer.userId} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {officer.firstName} {officer.lastName}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{officer.reportCount} reports</span>
                      {officer.pendingReviews && officer.pendingReviews > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {officer.pendingReviews} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{officer.averageAccuracy}%</div>
                    <div className="text-xs text-muted-foreground">
                      Last: {formatLastActivity(officer.lastActivity)}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No officers meet the accuracy threshold
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Needs Improvement */}
        <Card>
          <CardHeader>
            <CardTitle>Needs Improvement</CardTitle>
            <CardDescription>
              Officers with accuracy below {REVIEW_THRESHOLD}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsImprovement.length > 0 ? needsImprovement.map((officer) => (
                <div key={officer.userId} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {officer.firstName} {officer.lastName}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{officer.reportCount} reports</span>
                      {officer.pendingReviews && officer.pendingReviews > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {officer.pendingReviews} pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-destructive">{officer.averageAccuracy}%</div>
                    <div className="text-xs text-muted-foreground">
                      Last: {formatLastActivity(officer.lastActivity)}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  All active officers meet accuracy standards
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Officers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Officers</CardTitle>
          <CardDescription>
            Complete list of all officers in your department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Pending Reviews</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officerStats.map((officer) => (
                <TableRow key={officer.userId}>
                  <TableCell className="font-medium">
                    {officer.firstName} {officer.lastName}
                    <div className="text-xs text-muted-foreground">{officer.email}</div>
                  </TableCell>
                  <TableCell>{officer.reportCount}</TableCell>
                  <TableCell>
                    {officer.reportCount > 0 ? (
                      <span className={officer.averageAccuracy < REVIEW_THRESHOLD ? "text-destructive font-medium" : ""}>
                        {officer.averageAccuracy}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {officer.pendingReviews && officer.pendingReviews > 0 ? (
                      <Badge variant="outline" className="bg-orange-50">
                        {officer.pendingReviews}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatLastActivity(officer.lastActivity)}
                  </TableCell>
                  <TableCell>
                    {getPerformanceBadge(officer)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}