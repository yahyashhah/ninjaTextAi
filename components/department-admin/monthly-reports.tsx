"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart3, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export function MonthlyReports({ organizationId }: MonthlyReportsProps) {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyReports();
  }, [organizationId, selectedYear]);

  const fetchMonthlyReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching monthly reports for year:', selectedYear);
      
      const response = await fetch(
        `/api/department/monthly-reports?orgId=${organizationId}&year=${selectedYear}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Monthly reports data:', result);
      setReports(result.reports || []);
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
      
      console.log('Generating report for:', { month: currentMonth, year: currentYear });
      
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
        console.log('Report generated successfully:', result);
        alert('Monthly report generated successfully!');
        fetchMonthlyReports(); // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate report');
      alert('Failed to generate report. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf' | 'excel') => {
  try {
    // Get the most recent report for export
    const latestReport = reports[0];
    if (!latestReport) {
      alert('No reports available for export');
      return;
    }

    // Create export data
    const exportData = {
      month: latestReport.month,
      year: latestReport.year,
      totalReports: latestReport.totalReports,
      totalOfficers: latestReport.totalOfficers,
      averageAccuracy: latestReport.averageAccuracy,
      offenses: JSON.parse(latestReport.offenses || '{}'),
      comparisonData: JSON.parse(latestReport.comparisonData || '{}')
    };

    // For CSV export
    if (format === 'csv') {
      const csvContent = [
        ['Metric', 'Value'],
        ['Month', `${exportData.month}/${exportData.year}`],
        ['Total Reports', exportData.totalReports.toString()],
        ['Total Officers', exportData.totalOfficers.toString()],
        ['Average Accuracy', `${exportData.averageAccuracy.toFixed(2)}%`],
        ['', ''],
        ['Offense Type', 'Count']
      ];

      // Add offense counts with proper type casting
      Object.entries(exportData.offenses).forEach(([offense, count]) => {
        csvContent.push([offense, (count as number).toString()]);
      });

      // Create and download CSV
      const csvString = csvContent.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly-report-${exportData.month}-${exportData.year}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } else {
      alert(`${format.toUpperCase()} export would be implemented here`);
      // Implement PDF/Excel export logic
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    alert('Failed to export report');
  }
};

  // Prepare data for charts
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const report = reports.find(r => r.month === month && r.year === selectedYear);
    return {
      name: new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' }),
      reports: report?.totalReports || 0,
      accuracy: report?.averageAccuracy || 0
    };
  });

  // Calculate YTD totals
  const currentMonth = new Date().getMonth() + 1;
  const ytdReports = monthlyData.slice(0, currentMonth).reduce((sum, month) => sum + month.reports, 0);
  const ytdAccuracy = monthlyData.slice(0, currentMonth).reduce((sum, month) => sum + month.accuracy, 0) / Math.max(1, currentMonth);

  // Get comparison data from the most recent report
  const latestReport = reports[0]; // Reports are sorted descending
  const comparisonData = latestReport ? JSON.parse(latestReport.comparisonData || '{}') : {};

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
          <h2 className="text-2xl font-bold">Monthly Reports</h2>
          <p className="text-muted-foreground">
            Performance metrics and trends analysis
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
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Monthly Reports</h3>
            <p className="text-muted-foreground mb-4">
              Generate your first monthly report to see analytics and trends.
            </p>
            <Button onClick={generateReport} disabled={isGenerating}>
              Generate Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">YTD Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ytdReports}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {comparisonData.ytdVsPreviousYear > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : comparisonData.ytdVsPreviousYear < 0 ? (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  ) : null}
                  {Math.abs(comparisonData.ytdVsPreviousYear || 0).toFixed(1)}% vs previous year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">YTD Accuracy</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(ytdAccuracy)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average across all reports
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Officers</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestReport?.totalOfficers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reports by Month</CardTitle>
                <CardDescription>
                  Monthly report submission trends for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="reports" stroke="#3b82f6" name="Reports" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accuracy by Month</CardTitle>
                <CardDescription>
                  Monthly accuracy trends for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                      <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>
                Download monthly reports for external analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => exportReport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV Export
                </Button>
                <Button variant="outline" onClick={() => exportReport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF Summary
                </Button>
                <Button variant="outline" onClick={() => exportReport('excel')}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel Format
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}