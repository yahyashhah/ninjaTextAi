// components/admin/UserDetail.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  User, 
  Mail, 
  Calendar, 
  FileText, 
  Clock, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface UserDetailProps {
  userId: string;
  onBack: () => void;
}

interface UserData {
  clerkUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: { emailAddress: string }[];
    lastSignInAt: Date | null;
    createdAt: Date;
    publicMetadata: { admin?: boolean };
  };
  dbUser: any;
  statistics: {
    totalReports: number;
    successRate: number;
    reportTypes: Array<{ reportType: string; _count: { id: number }; _avg: { processingTime: number } }>;
    weeklyActivity: Array<{ createdAt: Date; _count: { id: number } }>;
  };
}

const UserDetail = ({ userId, onBack }: UserDetailProps) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-8">
        <p>User not found</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const { clerkUser, dbUser, statistics } = userData;

  // Prepare data for charts
  const reportTypeData = statistics.reportTypes.map(stat => ({
    name: stat.reportType,
    value: stat._count.id,
    avgTime: stat._avg.processingTime ? Math.round(stat._avg.processingTime / 1000) : 0
  }));

  const successData = [
    { name: 'Success', value: statistics.successRate },
    { name: 'Failure', value: 100 - statistics.successRate }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-500" />
            <span className="text-lg font-semibold">
              {clerkUser.firstName} {clerkUser.lastName}
            </span>
          </div>
          <Badge variant={clerkUser.publicMetadata?.admin ? "default" : "secondary"}>
            {clerkUser.publicMetadata?.admin ? "Admin" : "User"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <Button
          variant={activeTab === 'overview' ? "default" : "ghost"}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'reports' ? "default" : "ghost"}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </Button>
        <Button
          variant={activeTab === 'activity' ? "default" : "ghost"}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* User Info */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalReports}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.successRate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dbUser?.templates?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Active</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {clerkUser.lastSignInAt 
                    ? new Date(clerkUser.lastSignInAt).toLocaleDateString()
                    : "Never"
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Report Types</CardTitle>
                <CardDescription>Distribution of report types created</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {reportTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>Report generation success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={successData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* User Details */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{clerkUser.emailAddresses[0]?.emailAddress}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Joined: {new Date(clerkUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span>Status: {clerkUser.lastSignInAt ? "Active" : "Inactive"}</span>
              </div>
              {dbUser?.subscription && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Pro Subscription: Active</span>
                </div>
              )}
              {dbUser?.apiLimit && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Credits: {dbUser.apiLimit.credits}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Last 10 reports generated by this user</CardDescription>
          </CardHeader>
          <CardContent>
            {dbUser?.reports?.length > 0 ? (
              <div className="space-y-4">
                {dbUser.reports.map((report: any) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{report.reportName || "Unnamed Report"}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        {report.tag && (
                          <Badge variant="outline" className="mt-2">
                            {report.tag}
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {report.tag || "No tag"}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2 text-gray-600 line-clamp-2">
                      {report.reportText}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reports found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 20 user activities</CardDescription>
          </CardHeader>
          <CardContent>
            {dbUser?.userActivities?.length > 0 ? (
              <div className="space-y-3">
                {dbUser.userActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.activity === 'login' ? 'bg-green-100' :
                        activity.activity === 'report_created' ? 'bg-blue-100' :
                        activity.activity === 'report_failed' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {activity.activity === 'login' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : activity.activity === 'report_created' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : activity.activity === 'report_failed' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{activity.activity.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {activity.metadata && (
                      <Badge variant="outline">
                        Details
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No activity found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDetail;