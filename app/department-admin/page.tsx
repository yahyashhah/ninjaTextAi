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
  Eye,
  Search,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { ReviewQueue } from "@/components/department-admin/review-queue";
import { DepartmentStats } from "@/components/department-admin/department-stats";
import { OfficerActivity } from "@/components/department-admin/officer-activity";
import { MonthlyReports } from "@/components/department-admin/monthly-reports";
import { MemberManagement } from "@/components/department-admin/member-management";
import { useRouter } from "next/navigation";
import { AuthLogs } from "@/components/department-admin/auth-logs";
import { ReportViewModal } from "@/components/department-admin/report-view-modal";

interface DepartmentData {
  stats: {
    totalMembers: number;
    totalReports: number;
    lowAccuracyCount: number;
    reviewQueueCount: number;
    overdueItems: number;
    averageAccuracy: number;
    slaLowAccuracy: number;
    secondReviewRate: number;
  };
  recentActivity: any[];
  reviewQueue: any[];
  kpis: {
    officerActivityCoverage: number;
    exportSuccessRate: number;
    userManagementSuccess: number;
    reviewSlaCompliance: number;
    backlogAge: number;
    secondReviewRate: number;
  };
}

interface Report {
  id: string;
  title: string;
  reportType: string;
  status: string;
  submittedAt: string;
  accuracyScore?: number;
  content: string;
  rawText?: string;
  finalNarrative?: string;
  nibrsData?: string;
  flagged?: boolean;
  flagReason?: string;
  missingFields?: string[];
  warnings?: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewQueueItems: any[];
}

interface ReportsResponse {
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: {
    statusTypes: string[];
    reportTypes: string[];
  };
  summary: {
    totalReports: number;
    needsReview: number;
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
  
  // Reports tab state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsPagination, setReportsPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  });
  const [reportsFilters, setReportsFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  // Modal state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch department data
  const fetchDepartmentData = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/department/admin?orgId=${organization.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
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

  // Fetch reports data
  const fetchReports = useCallback(async (page = 1, filters = reportsFilters) => {
    if (!organization?.id) return;
    
    try {
      setReportsLoading(true);
      const params = new URLSearchParams({
        orgId: organization.id,
        page: page.toString(),
        limit: '20',
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type })
      });

      const response = await fetch(`/api/department/reports?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const result: ReportsResponse = await response.json();
      setReports(result.reports);
      setReportsPagination(result.pagination);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setReportsLoading(false);
    }
  }, [organization?.id, reportsFilters]);

  useEffect(() => {
    if (organization) {
      fetchDepartmentData();
    }
  }, [organization, fetchDepartmentData]);

  // Fetch reports when reports tab is active
  useEffect(() => {
    if (activeTab === "all-reports" && organization?.id) {
      fetchReports();
    }
  }, [activeTab, organization?.id, fetchReports]);

  const handleRoleSwitch = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const returnUrl = encodeURIComponent(currentPath);
    router.push(`/role-selector?change=true&return=${returnUrl}`);
  };

  const handleReportFilterChange = (key: string, value: string) => {
    const newFilters = { ...reportsFilters, [key]: value };
    setReportsFilters(newFilters);
    fetchReports(1, newFilters);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handlePageChange = (newPage: number) => {
    fetchReports(newPage);
  };

  // Filter reports based on search
  const filteredReports = reports.filter(report => {
    if (!reportsFilters.search) return true;
    
    const searchTerm = reportsFilters.search.toLowerCase();
    return (
      report.title.toLowerCase().includes(searchTerm) ||
      report.content.toLowerCase().includes(searchTerm) ||
      report.user.firstName.toLowerCase().includes(searchTerm) ||
      report.user.lastName.toLowerCase().includes(searchTerm) ||
      report.reportType.toLowerCase().includes(searchTerm)
    );
  });

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
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="review">Review Queue ({data?.stats?.reviewQueueCount || 0})</TabsTrigger>
          <TabsTrigger value="members">Members ({data?.stats?.totalMembers || 0})</TabsTrigger>
          <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
          <TabsTrigger value="all-reports">All Reports ({reportsPagination.totalCount || 0})</TabsTrigger>
          <TabsTrigger value="activity">Officer Activity</TabsTrigger>
          <TabsTrigger value="auth-logs">Authentication Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
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
                  onClick={() => setActiveTab("reports")}
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
        
        <TabsContent value="all-reports">
          <Card>
            <CardHeader>
              <CardTitle>All Department Reports</CardTitle>
              <CardDescription>
                View and manage all reports submitted by department members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Search reports..."
                      className="pl-8 w-full p-2 border rounded"
                      value={reportsFilters.search}
                      onChange={(e) => handleReportFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    className="p-2 border rounded"
                    value={reportsFilters.status}
                    onChange={(e) => handleReportFilterChange('status', e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="pending_review">Pending Review</option>
                  </select>
                  <select
                    className="p-2 border rounded"
                    value={reportsFilters.type}
                    onChange={(e) => handleReportFilterChange('type', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="incident">Incident</option>
                    <option value="nibrs">NIBRS</option>
                    <option value="dual_report">Dual Report</option>
                  </select>
                </div>
              </div>

              {/* Reports Table */}
              {reportsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded animate-pulse">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : filteredReports.length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{report.title}</h3>
                          <Badge variant="outline">{report.reportType}</Badge>
                          <Badge 
                            variant={
                              report.status === 'approved' ? 'default' :
                              report.status === 'rejected' ? 'destructive' :
                              report.status === 'pending_review' ? 'secondary' : 'outline'
                            }
                          >
                            {report.status}
                          </Badge>
                          {report.accuracyScore && (
                            <Badge variant={report.accuracyScore < 85 ? 'destructive' : 'default'}>
                              {report.accuracyScore}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Submitted by {report.user?.firstName || 'Unknown'} {report.user?.lastName || 'User'} • 
                          {new Date(report.submittedAt).toLocaleDateString()}
                        </p>
                        {report.reviewQueueItems.length > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            {report.reviewQueueItems.length} pending review(s)
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {reportsPagination.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                      <p className="text-sm text-muted-foreground">
                        Showing page {reportsPagination.page} of {reportsPagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reportsPagination.page <= 1}
                          onClick={() => handlePageChange(reportsPagination.page - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reportsPagination.page >= reportsPagination.totalPages}
                          onClick={() => handlePageChange(reportsPagination.page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Reports Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {reportsFilters.status || reportsFilters.type || reportsFilters.search 
                      ? "Try adjusting your filters to see more results." 
                      : "No reports have been submitted yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
          <OfficerActivity organizationId={organization.id} />
        </TabsContent>
        
        <TabsContent value="auth-logs">
          <AuthLogs organizationId={organization.id} />
        </TabsContent>
      </Tabs>

      {/* Report View Modal */}
      <ReportViewModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}