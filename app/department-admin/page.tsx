// app/department-admin/page.tsx
"use client";

import { useAuth, useOrganization } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Plus,
  Shield,
  AlertTriangle,
  Clock,
  Download,
  Upload,
  Bell,
  TrendingUp,
  TrendingDown,
  Target
} from "lucide-react";
import Link from "next/link";
import { ReviewQueue } from "@/components/department-admin/review-queue";
import { DepartmentStats } from "@/components/department-admin/department-stats";
import { OfficerActivity } from "@/components/department-admin/officer-activity";
import { MonthlyReports } from "@/components/department-admin/monthly-reports";
import { MemberManagement } from "@/components/department-admin/member-management";
import { KpiDashboard } from "@/components/department-admin/kpi-dashboard";
import { useRouter } from "next/navigation";
import { AuthLogs } from "@/components/department-admin/auth-logs";
// import { AuditLog } from "@/components/department-admin/audit-log";

interface DepartmentData {
  stats: {
    totalMembers: number;
    totalReports: number;
    lowAccuracyCount: number;
    reviewQueueCount: number;
    overdueItems: number;
    averageAccuracy: number;
    slaLowAccuracy: number; // % of low-accuracy reports reviewed within 48h
    secondReviewRate: number; // % of reports requiring second review
  };
  recentActivity: any[];
  reviewQueue: any[];
  kpis: {
    officerActivityCoverage: number; // % of officer activity recorded
    exportSuccessRate: number; // % of successful exports
    userManagementSuccess: number; // % of successful user management actions
    reviewSlaCompliance: number; // % of reviews within 48h
    backlogAge: number; // oldest backlog item in hours
    secondReviewRate: number; // % requiring second review
  };
}

export default function DepartmentAdminPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const { organization } = useOrganization();
  const [data, setData] = useState<DepartmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchDepartmentData = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/department/admin?orgId=${organization.id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Failed to fetch data: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching department data:", error);
      setError(error instanceof Error ? error.message : 'Failed to load department data');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (organization) {
      fetchDepartmentData();
      
      // const interval = setInterval(fetchDepartmentData, 5 * 60 * 1000);
      // return () => clearInterval(interval);
    }
  }, [organization, fetchDepartmentData]);

  const sendNotificationTest = async (type: 'email' | 'slack') => {
    try {
      const response = await fetch('/api/department/admin/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: organization?.id,
          type
        })
      });
      
      if (response.ok) {
        alert(`${type === 'email' ? 'Email' : 'Slack'} test notification sent successfully`);
      } else {
        alert('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const handleRoleSwitch = () => {
    // Store the current URL to return after role selection
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const returnUrl = encodeURIComponent(currentPath);
    router.push(`/role-selector?change=true&return=${returnUrl}`);
  };

  // Show loading state only for initial load, not tab switches
  if (isLoading && !data) {
    return (
      <div className="container min-h-screen bg-white w-full h-full mx-auto p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading department data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container min-h-screen bg-white w-full h-full mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchDepartmentData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container min-h-screen bg-white h-full mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Department Assigned</CardTitle>
            <CardDescription>
              You are not currently assigned to any department. Please contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen h-full mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{organization.name} Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage your department members, reports, and review queue
            {lastUpdated && (
              <span className="text-xs block mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Department Admin
          </Badge>
          {data && data.stats.lowAccuracyCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {data.stats.lowAccuracyCount} Low Accuracy Reports
            </Badge>
          )}
          {data && data.stats.overdueItems > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {data.stats.overdueItems} Overdue Reviews
            </Badge>
          )}
          
          {/* Add the Role Switcher Button here */}
          <Button 
            variant="outline" 
            onClick={handleRoleSwitch}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Switch Role
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDepartmentData}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review">Review Queue ({data?.stats?.reviewQueueCount || 0})</TabsTrigger>
          <TabsTrigger value="members">Members ({data?.stats?.totalMembers || 0})</TabsTrigger>
          <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
          <TabsTrigger value="activity">Officer Activity</TabsTrigger>
          <TabsTrigger value="auth-logs">Authentication Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Pass loading prop only if the component supports it */}
          <DepartmentStats stats={data?.stats} loading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions in your department
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : data?.recentActivity && data.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">{activity.activityType}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No recent activity</p>
                )}
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/department-admin/audit-logs">
                    View All Activity
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
    <CardDescription>
      Common administrative tasks
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-3">
    <Button 
      className="w-full justify-start" 
      onClick={() => setActiveTab("members")}
    >
      <Plus className="h-4 w-4 mr-2" />
      Invite New Member
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => setActiveTab("reports")}
    >
      <Download className="h-4 w-4 mr-2" />
      Export Reports
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => setActiveTab("members")}
    >
      <Upload className="h-4 w-4 mr-2" />
      Bulk Import Members
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => {
        setActiveTab("reports");
      }}
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      Generate Monthly Report
    </Button>
    <Button 
      variant="outline" 
      className="w-full justify-start"
      onClick={() => setActiveTab("review")}
    >
      <AlertTriangle className="h-4 w-4 mr-2" />
      Review Queue ({data?.stats?.reviewQueueCount || 0})
    </Button>
  </CardContent>
</Card>
          </div>
        </TabsContent>
        
        <TabsContent value="review">
          <ReviewQueue 
            items={data?.reviewQueue || []} 
            onRefresh={fetchDepartmentData}
          />
        </TabsContent>
        
        <TabsContent value="members">
          <MemberManagement 
            organizationId={organization.id}
            onRefresh={fetchDepartmentData}
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <MonthlyReports organizationId={organization.id} />
        </TabsContent>
        
        <TabsContent value="activity">
          <OfficerActivity organizationId={organization.id} />
        </TabsContent>
        
        <TabsContent value="auth-logs">
          <AuthLogs organizationId={organization.id} />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Email Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-new-items" className="text-sm">
                        New review queue items
                      </label>
                      <input 
                        id="email-new-items" 
                        type="checkbox" 
                        defaultChecked 
                        className="h-4 w-4 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-reminders" className="text-sm">
                        24-hour reminder notifications
                      </label>
                      <input 
                        id="email-reminders" 
                        type="checkbox" 
                        defaultChecked 
                        className="h-4 w-4 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-overdue" className="text-sm">
                        Overdue item alerts
                      </label>
                      <input 
                        id="email-overdue" 
                        type="checkbox" 
                        defaultChecked 
                        className="h-4 w-4 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Slack Notifications</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="slack-new-items" className="text-sm">
                        New review queue items
                      </label>
                      <input 
                        id="slack-new-items" 
                        type="checkbox" 
                        className="h-4 w-4 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="slack-critical" className="text-sm">
                        Critical priority items only
                      </label>
                      <input 
                        id="slack-critical" 
                        type="checkbox" 
                        className="h-4 w-4 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => sendNotificationTest('email')}>
                    Test Email
                  </Button>
                  <Button variant="outline" onClick={() => sendNotificationTest('slack')}>
                    Test Slack
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Review Settings</CardTitle>
                <CardDescription>
                  Configure review workflow and thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Accuracy Thresholds</h3>
                  <div className="space-y-2">
                    <div className="flex flex-col space-y-1">
                      <label htmlFor="accuracy-threshold" className="text-sm">
                        Low accuracy threshold (currently: 80%)
                      </label>
                      <input 
                        id="accuracy-threshold" 
                        type="range" 
                        min="50" 
                        max="95" 
                        defaultValue="80" 
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50%</span>
                        <span>80%</span>
                        <span>95%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">SLA Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="sla-hours" className="text-sm">
                        Review SLA hours (default: 48)
                      </label>
                      <input 
                        id="sla-hours" 
                        type="number" 
                        min="24" 
                        max="72" 
                        defaultValue="48" 
                        className="w-20 p-2 border rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="auto-assign" className="text-sm">
                        Auto-assign review items
                      </label>
                      <input 
                        id="auto-assign" 
                        type="checkbox" 
                        className="h-4 w-4 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Audit Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="audit-retention" className="text-sm">
                        Audit log retention (days)
                      </label>
                      <select 
                        id="audit-retention" 
                        className="w-20 p-2 border rounded"
                        defaultValue="365"
                      >
                        <option value="30">30</option>
                        <option value="90">90</option>
                        <option value="180">180</option>
                        <option value="365">365</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <Button>Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}