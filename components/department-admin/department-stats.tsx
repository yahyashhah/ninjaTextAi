"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, AlertTriangle, Clock, BarChart3, Target, TrendingUp, TrendingDown } from "lucide-react";

interface Stats {
  totalMembers: number;
  totalReports: number;
  lowAccuracyCount: number;
  reviewQueueCount: number;
  overdueItems: number;
  averageAccuracy: number;
  slaLowAccuracy?: number;
  secondReviewRate?: number;
}

interface DepartmentStatsProps {
  stats: Stats | undefined;
  loading: boolean;
}

// Use the same threshold as backend
const REVIEW_THRESHOLD = 85;

export function DepartmentStats({ stats, loading }: DepartmentStatsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTrendIndicator = (value: number, target: number) => {
    if (value >= target) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const lowAccuracyRate = stats.totalReports > 0 
    ? Math.round((stats.lowAccuracyCount / stats.totalReports) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalMembers}</div>
          <p className="text-xs text-muted-foreground">
            Active department members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReports}</div>
          <p className="text-xs text-muted-foreground">
            All report types submitted
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Review Queue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reviewQueueCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.overdueItems > 0 ? (
              <span className="text-destructive">
                {stats.overdueItems} overdue
              </span>
            ) : (
              "All items on track"
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Accuracy</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(stats.averageAccuracy)}%</div>
          <p className="text-xs text-muted-foreground">
            Across all reports
          </p>
        </CardContent>
      </Card>

      {/* NIBRS-specific KPIs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.slaLowAccuracy || 0}%</div>
          <div className="flex items-center gap-1">
            {getTrendIndicator(stats.slaLowAccuracy || 0, 95)}
            <p className="text-xs text-muted-foreground">
              Reviews within 48h
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Second Review Rate</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.secondReviewRate || 0}%</div>
          <div className="flex items-center gap-1">
            {getTrendIndicator(5, stats.secondReviewRate || 0)}
            <p className="text-xs text-muted-foreground">
              Requiring second review
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Accuracy Rate</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowAccuracyRate}%</div>
          <p className="text-xs text-muted-foreground">
            Reports with accuracy &lt; {REVIEW_THRESHOLD}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.reviewQueueCount > 0 
              ? Math.round(((stats.reviewQueueCount - stats.overdueItems) / stats.reviewQueueCount) * 100)
              : 100
            }%
          </div>
          <p className="text-xs text-muted-foreground">
            Reviews completed on time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}