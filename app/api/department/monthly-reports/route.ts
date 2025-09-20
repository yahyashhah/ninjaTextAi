import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Get organization by clerkOrgId
    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get monthly reports for the requested year
    const monthlyReports = await prismadb.departmentMonthlyReport.findMany({
      where: {
        organizationId: organization.id,
        year: year
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    return NextResponse.json({ reports: monthlyReports });
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { month, year } = body;
    
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // Get organization by clerkOrgId
    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Generate a specific monthly report
    const report = await generateMonthlyReport(organization.id, month, year);

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly report' },
      { status: 500 }
    );
  }
}

async function generateMonthlyReport(organizationId: string, month: number, year: number) {
  // Get all reports for this month and year
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const reports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: ['approved', 'submitted']
      }
    },
    include: {
      user: true
    }
  });
  
  // Get unique officers
  const officerIds = Array.from(new Set(reports.map(r => r.clerkUserId)));
  
  // Calculate offense statistics
  const offenseCounts: Record<string, number> = {};
  let totalAccuracy = 0;
  let validReports = 0;
  
  reports.forEach(report => {
    if (report.nibrsData) {
      try {
        const nibrsData = JSON.parse(report.nibrsData);
        if (nibrsData.offenses) {
          nibrsData.offenses.forEach((offense: any) => {
            const offenseCode = offense.code || 'unknown';
            offenseCounts[offenseCode] = (offenseCounts[offenseCode] || 0) + 1;
          });
        }
        
        if (report.accuracyScore) {
          totalAccuracy += report.accuracyScore;
          validReports++;
        }
      } catch (error) {
        console.error('Error parsing NIBRS data for report:', report.id, error);
      }
    }
  });
  
  const averageAccuracy = validReports > 0 ? totalAccuracy / validReports : 0;
  
  // Calculate comparison data (vs previous year)
  const prevYear = year - 1;
  const prevYearReports = await prismadb.departmentReport.count({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: new Date(prevYear, month - 1, 1),
        lte: new Date(prevYear, month, 0, 23, 59, 59)
      },
      status: {
        in: ['approved', 'submitted']
      }
    }
  });
  
  const ytdReports = await prismadb.departmentReport.count({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: new Date(year, 0, 1), // Jan 1 of current year
        lte: endDate
      },
      status: {
        in: ['approved', 'submitted']
      }
    }
  });
  
  const prevYtdReports = await prismadb.departmentReport.count({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: new Date(prevYear, 0, 1), // Jan 1 of previous year
        lte: new Date(prevYear, month, 0, 23, 59, 59)
      },
      status: {
        in: ['approved', 'submitted']
      }
    }
  });
  
  const comparisonData = {
    totalReports: reports.length,
    vsPreviousYear: prevYearReports > 0 
      ? ((reports.length - prevYearReports) / prevYearReports) * 100 
      : 0,
    ytd: ytdReports,
    ytdVsPreviousYear: prevYtdReports > 0
      ? ((ytdReports - prevYtdReports) / prevYtdReports) * 100
      : 0
  };
  
  // Create or update the monthly report
  const monthlyReport = await prismadb.departmentMonthlyReport.upsert({
    where: {
      organizationId_month_year: {
        organizationId: organizationId,
        month: month,
        year: year
      }
    },
    update: {
      totalReports: reports.length,
      totalOfficers: officerIds.length,
      averageAccuracy: averageAccuracy,
      offenses: JSON.stringify(offenseCounts),
      comparisonData: JSON.stringify(comparisonData),
      generatedAt: new Date()
    },
    create: {
      organizationId: organizationId,
      month: month,
      year: year,
      totalReports: reports.length,
      totalOfficers: officerIds.length,
      averageAccuracy: averageAccuracy,
      offenses: JSON.stringify(offenseCounts),
      comparisonData: JSON.stringify(comparisonData)
    }
  });
  
  return monthlyReport;
}