// app/(dashboard)/(routes)/department-admin/components/officer-activity.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  lastActivity: string;
}

export function OfficerActivity({ organizationId }: OfficerActivityProps) {
  const [officerStats, setOfficerStats] = useState<OfficerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  useEffect(() => {
    fetchOfficerActivity();
  }, [organizationId, timeRange]);

  const fetchOfficerActivity = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/department/officer-activity?orgId=${organizationId}&range=${timeRange}`
      );
      const result = await response.json();
      setOfficerStats(result.officers || []);
    } catch (error) {
      console.error("Error fetching officer activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare data for chart
  const chartData = officerStats.map(officer => ({
    name: `${officer.firstName} ${officer.lastName}`.substring(0, 15),
    reports: officer.reportCount,
    accuracy: officer.averageAccuracy
  }));

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading officer activity...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Officer Activity</h2>
          <p className="text-muted-foreground">
            Report submissions and accuracy by officer
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Reports by Officer</CardTitle>
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
                  <Tooltip />
                  <Bar dataKey="reports" fill="#3b82f6" name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Officers with highest accuracy scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {officerStats
                .filter(officer => officer.reportCount > 0)
                .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
                .slice(0, 5)
                .map((officer, index) => (
                  <div key={officer.userId} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {officer.firstName} {officer.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {officer.reportCount} reports
                      </p>
                    </div>
                    <Badge variant={officer.averageAccuracy >= 90 ? "default" : "secondary"}>
                      {Math.round(officer.averageAccuracy)}%
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs Improvement</CardTitle>
            <CardDescription>
              Officers with lowest accuracy scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {officerStats
                .filter(officer => officer.reportCount > 0 && officer.averageAccuracy < 85)
                .sort((a, b) => a.averageAccuracy - b.averageAccuracy)
                .slice(0, 5)
                .map((officer, index) => (
                  <div key={officer.userId} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">
                        {officer.firstName} {officer.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {officer.reportCount} reports
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {Math.round(officer.averageAccuracy)}%
                    </Badge>
                  </div>
                ))}
              {officerStats.filter(officer => officer.reportCount > 0 && officer.averageAccuracy < 85).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  All officers meet accuracy standards
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}