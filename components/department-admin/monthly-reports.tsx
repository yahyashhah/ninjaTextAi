// components/department-admin/monthly-reports.tsx (FIXED)
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, TrendingDown, RefreshCw, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface MonthlyReportsProps {
  organizationId: string;
}

interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  totalReports: number;
  totalOfficers: number;
  averageAccuracy: number;
  offenses: string;
  comparisonData: string;
  generatedAt: string;
}

interface NIBRSData {
  monthlyComparison: any;
  ytdComparison: any;
  summary: any;
}

const NIBRS_OFFENSE_CATEGORIES = {
  crimeAgainstPerson: 'Crime Against Person',
  crimeAgainstProperty: 'Crime Against Property', 
  crimeAgainstSociety: 'Crime Against Society'
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MonthlyReports({ organizationId }: MonthlyReportsProps) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyReports();
  }, [organizationId, selectedYear]);

  const fetchMonthlyReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/department/monthly-reports?orgId=${organizationId}&year=${selectedYear}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }
      
      const result = await response.json();
      setReports(result.reports || []);
      
      // Auto-select the most recent report if available
      if (result.reports && result.reports.length > 0) {
        setSelectedReport(result.reports[0]);
      }
    } catch (error) {
      console.error("Error fetching monthly reports:", error);
      setError(error instanceof Error ? error.message : 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const response = await fetch('/api/department/monthly-reports?orgId=' + organizationId, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Monthly report generated successfully!');
        fetchMonthlyReports();
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
      alert('Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  // FIXED: Proper report selection handler
  const handleReportSelect = (report: MonthlyReport) => {
    setSelectedReport(report);
  };

  // NEW: Export functionality
  const exportReport = async (format: 'csv' | 'json') => {
    if (!selectedReport) {
      alert('Please select a report to export');
      return;
    }

    try {
      const response = await fetch(
        `/api/department/monthly-reports?orgId=${organizationId}&reportId=${selectedReport.id}&format=${format}`,
        {
          method: 'PUT'
        }
      );

      if (response.ok && format === 'csv') {
        // For CSV, create download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nibrs-report-${MONTH_NAMES[selectedReport.month - 1]}-${selectedReport.year}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (response.ok) {
        const data = await response.json();
        console.log('Exported data:', data);
        alert('JSON data exported to console');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const formatPercentage = (value: number) => {
    if (value === 0) return '0%';
    if (!value && value !== 0) return 'NC';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(0)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3 mr-1 text-green-500" />;
    if (value < 0) return <TrendingDown className="h-3 w-3 mr-1 text-red-500" />;
    return null;
  };

  const renderNIBRSTable = (nibrsData: NIBRSData) => {
    if (!nibrsData.monthlyComparison) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No NIBRS Data Available</h3>
            <p className="text-muted-foreground">
              This report doesn't contain NIBRS offense data. Please generate a new report.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Main NIBRS Table */}
        <Card>
          <CardHeader>
            <CardTitle>NIBRS Monthly Report - {MONTH_NAMES[selectedReport!.month - 1]} {selectedReport!.year}</CardTitle>
            <CardDescription>
              Group A Offense Statistics - Generated: {new Date(selectedReport!.generatedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">OFFENSE</TableHead>
                    <TableHead>{MONTH_NAMES[selectedReport!.month - 1]} {selectedReport!.year - 1}</TableHead>
                    <TableHead>{MONTH_NAMES[selectedReport!.month - 1]} {selectedReport!.year}</TableHead>
                    <TableHead>+/-</TableHead>
                    <TableHead>YTD {selectedReport!.year - 1}</TableHead>
                    <TableHead>YTD {selectedReport!.year}</TableHead>
                    <TableHead>YTD +/-</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(NIBRS_OFFENSE_CATEGORIES).map(([categoryKey, categoryLabel]) => {
                    const categoryData = nibrsData.monthlyComparison[categoryKey];
                    const ytdCategoryData = nibrsData.ytdComparison[categoryKey];
                    
                    if (!categoryData) return null;
                    
                    return (
                      <>
                        {/* Category Total Row */}
                        <TableRow key={categoryKey} className="bg-muted/50 font-semibold">
                          <TableCell className="font-bold">{categoryLabel}</TableCell>
                          <TableCell>{categoryData.total?.previous || 0}</TableCell>
                          <TableCell>{categoryData.total?.current || 0}</TableCell>
                          <TableCell>
                            <span className="flex items-center">
                              {getTrendIcon(categoryData.total?.change)}
                              {formatPercentage(categoryData.total?.change)}
                            </span>
                          </TableCell>
                          <TableCell>{ytdCategoryData?.total?.previous || 0}</TableCell>
                          <TableCell>{ytdCategoryData?.total?.current || 0}</TableCell>
                          <TableCell>
                            <span className="flex items-center">
                              {getTrendIcon(ytdCategoryData?.total?.change)}
                              {formatPercentage(ytdCategoryData?.total?.change)}
                            </span>
                          </TableCell>
                        </TableRow>
                        
                        {/* Individual Offenses */}
                        {categoryData.offenses && Object.entries(categoryData.offenses).map(([offense, data]: [string, any]) => (
                          <TableRow key={offense} className="text-sm">
                            <TableCell className="pl-8">{offense}</TableCell>
                            <TableCell>{data.previous || 0}</TableCell>
                            <TableCell>{data.current || 0}</TableCell>
                            <TableCell>
                              <span className="flex items-center">
                                {getTrendIcon(data.change)}
                                {formatPercentage(data.change)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {ytdCategoryData?.offenses[offense]?.previous || 0}
                            </TableCell>
                            <TableCell>
                              {ytdCategoryData?.offenses[offense]?.current || 0}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center">
                                {getTrendIcon(ytdCategoryData?.offenses[offense]?.change)}
                                {formatPercentage(ytdCategoryData?.offenses[offense]?.change)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    );
                  })}
                  
                  {/* Grand Total */}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell>TOTAL:</TableCell>
                    <TableCell>{nibrsData.summary?.totalReports?.previousYear || 0}</TableCell>
                    <TableCell>{nibrsData.summary?.totalReports?.currentMonth || 0}</TableCell>
                    <TableCell>
                      <span className="flex items-center">
                        {getTrendIcon(nibrsData.monthlyComparison?.totalChange)}
                        {formatPercentage(nibrsData.monthlyComparison?.totalChange)}
                      </span>
                    </TableCell>
                    <TableCell>{nibrsData.summary?.totalReports?.ytdPrevious || 0}</TableCell>
                    <TableCell>{nibrsData.summary?.totalReports?.ytdCurrent || 0}</TableCell>
                    <TableCell>
                      <span className="flex items-center">
                        {getTrendIcon(nibrsData.ytdComparison?.totalChange)}
                        {formatPercentage(nibrsData.ytdComparison?.totalChange)}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              *NC = Not Calculable
            </div>
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle>Export Report</CardTitle>
            <CardDescription>
              Download this report for external analysis or record keeping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => exportReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button variant="outline" onClick={() => exportReport('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Officers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nibrsData.summary?.totalOfficers || 0}</div>
              <div className="text-xs text-muted-foreground">Active this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Report Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(nibrsData.summary?.averageAccuracy || 0)}%</div>
              <div className="text-xs text-muted-foreground">Average accuracy score</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nibrsData.summary?.totalReports?.currentMonth || 0}</div>
              <div className="text-xs text-muted-foreground">Reports this month</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading monthly reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <p>Error loading reports</p>
          <p className="text-sm">{error}</p>
          <Button onClick={fetchMonthlyReports} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NIBRS Monthly Reports</h2>
          <p className="text-muted-foreground">
            Group A offense statistics and trends analysis
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <Button onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Current Month'}
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No NIBRS Reports</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first NIBRS monthly report to see detailed offense statistics.
            </p>
            <Button onClick={generateReport} disabled={isGenerating}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Report Selection - FIXED */}
          <Card>
            <CardHeader>
              <CardTitle>Select Report</CardTitle>
              <CardDescription>
                Choose a monthly report to view detailed statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {reports.map(report => (
                  <Button
                    key={report.id}
                    variant={selectedReport?.id === report.id ? "default" : "outline"}
                    onClick={() => handleReportSelect(report)}
                    className="flex items-center gap-2"
                  >
                    {MONTH_NAMES[report.month - 1]} {report.year}
                    <Badge variant="secondary">
                      {report.totalReports} reports
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* NIBRS Report Display */}
          {selectedReport && (
            renderNIBRSTable(JSON.parse(selectedReport.offenses || '{}'))
          )}
        </>
      )}
    </div>
  );
}