// components/department-admin/kpi-dashboard.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Clock } from "lucide-react";

interface KpiDashboardProps {
  kpis: {
    officerActivityCoverage: number;
    exportSuccessRate: number;
    userManagementSuccess: number;
    reviewSlaCompliance: number;
    backlogAge: number;
    secondReviewRate: number;
  } | undefined;
}

export function KpiDashboard({ kpis }: KpiDashboardProps) {
  if (!kpis) {
    return <div>Loading KPI data...</div>;
  }

  console.log('KPI Data:', kpis);
  
  const getStatusColor = (value: number, target: number) => {
    if (value >= target) return "text-green-600";
    if (value >= target * 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (value: number, target: number) => {
    if (value >= target) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (value >= target * 0.8) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <Clock className="h-5 w-5 text-red-500" />;
  };

  const kpiData = [
    {
      title: "Officer Activity Coverage",
      value: kpis.officerActivityCoverage,
      target: 95,
      description: "Percentage of officer activity recorded in stats",
      icon: <Target className="h-6 w-6" />
    },
    {
      title: "Export Success Rate",
      value: kpis.exportSuccessRate,
      target: 100,
      description: "Percentage of successful report exports",
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      title: "User Management Success",
      value: kpis.userManagementSuccess,
      target: 100,
      description: "Percentage of successful user management actions",
      icon: <CheckCircle className="h-6 w-6" />
    },
    {
      title: "Review SLA Compliance",
      value: kpis.reviewSlaCompliance,
      target: 95,
      description: "Percentage of low-accuracy reviews within 48 hours",
      icon: <Clock className="h-6 w-6" />
    },
    {
      title: "Backlog Age",
      value: kpis.backlogAge,
      target: 72,
      reverse: true, // Lower is better
      description: "Oldest backlog item in hours (target: <72h)",
      icon: <AlertTriangle className="h-6 w-6" />
    },
    {
      title: "Second Review Rate",
      value: kpis.secondReviewRate,
      target: 5,
      reverse: true, // Lower is better
      description: "Percentage of reviews requiring second review",
      icon: <TrendingDown className="h-6 w-6" />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">KPI Dashboard</h2>
        <p className="text-muted-foreground">
          Key performance indicators for department administration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => {
          const isOnTarget = kpi.reverse 
            ? kpi.value <= kpi.target 
            : kpi.value >= kpi.target;
          
          const displayValue = kpi.title === "Backlog Age" 
            ? `${kpi.value}h` 
            : `${kpi.value}%`;

          return (
            <Card key={index} className={isOnTarget ? "border-green-200" : "border-red-200"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayValue}</div>
                <p className="text-xs text-muted-foreground mb-2">
                  {kpi.description}
                </p>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Target: {kpi.title === "Backlog Age" ? `<${kpi.target}h` : `${kpi.target}%`}
                  </span>
                  {getStatusIcon(kpi.value, kpi.target)}
                </div>
                <Progress 
                  value={kpi.reverse 
                    ? Math.max(0, 100 - (kpi.value / kpi.target) * 100)
                    : (kpi.value / kpi.target) * 100
                  } 
                  className={getStatusColor(kpi.value, kpi.target).replace('text', 'bg')}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Overall department performance against targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {kpiData.filter(kpi => 
                  kpi.reverse ? kpi.value <= kpi.target : kpi.value >= kpi.target
                ).length}
              </div>
              <div className="text-sm text-green-600">Targets Met</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {kpiData.filter(kpi => {
                  const meets80 = kpi.reverse 
                    ? kpi.value <= kpi.target * 1.2 
                    : kpi.value >= kpi.target * 0.8;
                  const meetsTarget = kpi.reverse 
                    ? kpi.value <= kpi.target 
                    : kpi.value >= kpi.target;
                  return meets80 && !meetsTarget;
                }).length}
              </div>
              <div className="text-sm text-yellow-600">Near Target</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {kpiData.filter(kpi => {
                  const meets80 = kpi.reverse 
                    ? kpi.value <= kpi.target * 1.2 
                    : kpi.value >= kpi.target * 0.8;
                  return !meets80;
                }).length}
              </div>
              <div className="text-sm text-red-600">Below Target</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}