// app/api/department/monthly-reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

// Enhanced NIBRS offense categories with proper mapping
const NIBRS_OFFENSE_CATEGORIES = {
  crimeAgainstPerson: {
    label: 'Crime Against Person',
    offenses: [
      'Aggravated Assault',
      'Simple Assault', 
      'Intimidation',
      'Murder and Non-Negligent Manslaughter',
      'Negligent Manslaughter',
      'Justifiable Homicide',
      'Human Trafficking, Commercial Sex Act',
      'Human Trafficking, Involuntary Servitude',
      'Kidnapping/Abduction',
      'Rape',
      'Fondling',
      'Incest',
      'Statutory Rape'
    ]
  },
  crimeAgainstProperty: {
    label: 'Crime Against Property',
    offenses: [
      'Arson',
      'Bribery',
      'Burglary/Breaking & Entering',
      'Counterfeiting/Forgery',
      'Destruction/Damage/Vandalism of Property',
      'Embezzlement',
      'Extortion/Blackmail',
      'False Pretenses/Swindle/Confidence Game',
      'Credit Card/Automated Teller Machine Fraud',
      'Impersonation/Identity Theft',
      'Welfare Fraud',
      'Wire Fraud',
      'Hacking/Computer Invasion',
      'Pocket-picking',
      'Snatching',
      'Shoplifting',
      'Theft from Building',
      'Theft from Coin Operated Machine or Device',
      'Theft from Motor Vehicle',
      'Theft of Motor Vehicle Parts or Accessories',
      'All Other Larceny', // This should catch uncategorized offenses
      'Motor Vehicle Theft',
      'Robbery',
      'Stolen Property Offenses'
    ]
  },
  crimeAgainstSociety: {
    label: 'Crime Against Society', 
    offenses: [
      'Animal Cruelty',
      'Drug/Narcotic Violations',
      'Drug Equipment Violations',
      'Pornography/Obscene Material',
      'Prostitution',
      'Assisting or Promoting Prostitution',
      'Purchasing Prostitution',
      'Weapon Law Violations'
    ]
  }
};

// Map report types to NIBRS offenses
const REPORT_TYPE_TO_NIBRS_MAP: { [key: string]: string } = {
  'accident_report': 'All Other Larceny', // Default mapping
  'arrest_report': 'Arrest',
  'incident_report': 'All Other Larceny',
  'domestic_violence': 'Simple Assault',
  'field_interview': 'All Other Larceny',
  'use_of_force': 'Aggravated Assault',
  'witness_report': 'All Other Larceny',
  'supplemental_report': 'All Other Larceny'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

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
    return NextResponse.json({ error: 'Failed to fetch monthly reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { month, year } = body;
    
    if (!month || !year) {
      return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
    }

    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const report = await generateEnhancedMonthlyReport(organization.id, month, year);
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json({ error: 'Failed to generate monthly report' }, { status: 500 });
  }
}

async function generateEnhancedMonthlyReport(organizationId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  // Get reports for current month
  const currentMonthReports = await prismadb.departmentReport.findMany({
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

  // Get reports for previous year same month
  const prevYearStart = new Date(year - 1, month - 1, 1);
  const prevYearEnd = new Date(year - 1, month, 0, 23, 59, 59);
  const prevYearReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: prevYearStart,
        lte: prevYearEnd
      },
      status: {
        in: ['approved', 'submitted']
      }
    }
  });

  // Get YTD reports
  const ytdStart = new Date(year, 0, 1);
  const ytdReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: ytdStart,
        lte: endDate
      },
      status: {
        in: ['approved', 'submitted']
      }
    }
  });

  // Get previous year YTD reports
  const prevYtdStart = new Date(year - 1, 0, 1);
  const prevYtdEnd = new Date(year - 1, month, 0, 23, 59, 59);
  const prevYtdReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      submittedAt: {
        gte: prevYtdStart,
        lte: prevYtdEnd
      },
      status: {
        in: ['approved', 'submitted']
      }
    }
  });

  // Enhanced offense counting function
  const countOffensesByPeriod = (reports: any[]) => {
    const counts: any = {};
    
    // Initialize all offense categories
    Object.keys(NIBRS_OFFENSE_CATEGORIES).forEach(category => {
      counts[category] = {
        total: 0,
        offenses: {}
      };
      NIBRS_OFFENSE_CATEGORIES[category as keyof typeof NIBRS_OFFENSE_CATEGORIES].offenses.forEach(offense => {
        counts[category].offenses[offense] = 0;
      });
    });

    // Count offenses from reports
    reports.forEach(report => {
      let offenseFound = false;
      
      // First, try to get offense from nibrsData
      if (report.nibrsData) {
        try {
          const nibrsData = JSON.parse(report.nibrsData);
          if (nibrsData.offenses && Array.isArray(nibrsData.offenses)) {
            nibrsData.offenses.forEach((offense: any) => {
              const offenseName = offense.name || offense.type || 'Unknown';
              categorizeAndCountOffense(offenseName, counts);
              offenseFound = true;
            });
          }
        } catch (error) {
          console.error('Error parsing NIBRS data:', error);
        }
      }
      
      // If no offense found in nibrsData, use report type mapping
      if (!offenseFound && report.reportType) {
        const mappedOffense = REPORT_TYPE_TO_NIBRS_MAP[report.reportType] || 'All Other Larceny';
        categorizeAndCountOffense(mappedOffense, counts);
      }
    });

    return counts;
  };

  // Helper function to categorize and count offenses
  const categorizeAndCountOffense = (offenseName: string, counts: any) => {
    let categorized = false;
    
    // Try to find the offense in predefined categories
    Object.keys(NIBRS_OFFENSE_CATEGORIES).forEach(category => {
      const categoryData = NIBRS_OFFENSE_CATEGORIES[category as keyof typeof NIBRS_OFFENSE_CATEGORIES];
      if (categoryData.offenses.includes(offenseName)) {
        counts[category].total++;
        counts[category].offenses[offenseName]++;
        categorized = true;
      }
    });

    // If not found in predefined categories, add to "All Other Larceny"
    if (!categorized) {
      counts.crimeAgainstProperty.total++;
      counts.crimeAgainstProperty.offenses['All Other Larceny']++;
    }
  };

  // Count offenses for each period
  const currentMonthCounts = countOffensesByPeriod(currentMonthReports);
  const prevYearCounts = countOffensesByPeriod(prevYearReports);
  const ytdCounts = countOffensesByPeriod(ytdReports);
  const prevYtdCounts = countOffensesByPeriod(prevYtdReports);

  // Calculate comparisons
  const calculateComparisons = (current: any, previous: any) => {
    const comparisons: any = {};
    
    Object.keys(current).forEach(category => {
      comparisons[category] = {
        total: {
          current: current[category].total,
          previous: previous[category].total,
          change: previous[category].total > 0 
            ? ((current[category].total - previous[category].total) / previous[category].total) * 100
            : current[category].total > 0 ? 100 : 0 // Handle zero previous year cases
        },
        offenses: {}
      };
      
      Object.keys(current[category].offenses).forEach(offense => {
        const currentCount = current[category].offenses[offense];
        const prevCount = previous[category].offenses[offense] || 0;
        comparisons[category].offenses[offense] = {
          current: currentCount,
          previous: prevCount,
          change: prevCount > 0 
            ? ((currentCount - prevCount) / prevCount) * 100
            : currentCount > 0 ? 100 : 0
        };
      });
    });

    // Calculate total changes
    const totalCurrent = Object.values(current).reduce((sum: number, cat: any) => sum + cat.total, 0);
    const totalPrevious = Object.values(previous).reduce((sum: number, cat: any) => sum + cat.total, 0);
    comparisons.totalChange = totalPrevious > 0 
      ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
      : totalCurrent > 0 ? 100 : 0;

    return comparisons;
  };

  const monthlyComparison = calculateComparisons(currentMonthCounts, prevYearCounts);
  const ytdComparison = calculateComparisons(ytdCounts, prevYtdCounts);

  // Get unique officers
  const officerIds = Array.from(new Set(currentMonthReports.map(r => r.clerkUserId)));

  // Calculate accuracy
  const validReports = currentMonthReports.filter(r => r.accuracyScore !== null && r.accuracyScore !== undefined);
  const averageAccuracy = validReports.length > 0 
    ? validReports.reduce((sum, r) => sum + (r.accuracyScore || 0), 0) / validReports.length
    : 0;

  // Prepare comprehensive data
  const nibrsData = {
    monthlyComparison,
    ytdComparison,
    summary: {
      totalReports: {
        currentMonth: currentMonthReports.length,
        previousYear: prevYearReports.length,
        ytdCurrent: ytdReports.length,
        ytdPrevious: prevYtdReports.length
      },
      totalOfficers: officerIds.length,
      averageAccuracy: averageAccuracy,
      generatedAt: new Date().toISOString()
    },
    rawCounts: {
      currentMonth: currentMonthCounts,
      previousYear: prevYearCounts,
      ytdCurrent: ytdCounts,
      ytdPrevious: prevYtdCounts
    }
  };

  // Create or update monthly report
  const monthlyReport = await prismadb.departmentMonthlyReport.upsert({
    where: {
      organizationId_month_year: {
        organizationId: organizationId,
        month: month,
        year: year
      }
    },
    update: {
      totalReports: currentMonthReports.length,
      totalOfficers: officerIds.length,
      averageAccuracy: averageAccuracy,
      offenses: JSON.stringify(nibrsData),
      comparisonData: JSON.stringify({
        monthlyChange: monthlyComparison.totalChange,
        ytdChange: ytdComparison.totalChange
      }),
      generatedAt: new Date()
    },
    create: {
      organizationId: organizationId,
      month: month,
      year: year,
      totalReports: currentMonthReports.length,
      totalOfficers: officerIds.length,
      averageAccuracy: averageAccuracy,
      offenses: JSON.stringify(nibrsData),
      comparisonData: JSON.stringify({
        monthlyChange: monthlyComparison.totalChange,
        ytdChange: ytdComparison.totalChange
      })
    }
  });
  
  return monthlyReport;
}

// Add export endpoint
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const reportId = searchParams.get('reportId');
    const format = searchParams.get('format') || 'csv';
    
    if (!orgId || !reportId) {
      return NextResponse.json({ error: 'Organization ID and Report ID are required' }, { status: 400 });
    }

    const organization = await prismadb.organization.findFirst({
      where: { clerkOrgId: orgId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const report = await prismadb.departmentMonthlyReport.findFirst({
      where: {
        id: reportId,
        organizationId: organization.id
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const nibrsData = JSON.parse(report.offenses || '{}');
    
    if (format === 'csv') {
      return generateCSVExport(report, nibrsData);
    } else if (format === 'json') {
      return NextResponse.json({ report: nibrsData });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}

function generateCSVExport(report: any, nibrsData: any) {
  const monthName = new Date(report.year, report.month - 1, 1).toLocaleString('default', { month: 'long' });
  
  const csvRows = [];
  
  // Header
  csvRows.push(['NIBRS Monthly Report', `${monthName} ${report.year}`]);
  csvRows.push([]);
  csvRows.push(['OFFENSE', `${monthName} ${report.year - 1}`, `${monthName} ${report.year}`, '+/-', `YTD ${report.year - 1}`, `YTD ${report.year}`, 'YTD +/-']);
  
  // Data rows
  Object.keys(NIBRS_OFFENSE_CATEGORIES).forEach(categoryKey => {
    const category = NIBRS_OFFENSE_CATEGORIES[categoryKey as keyof typeof NIBRS_OFFENSE_CATEGORIES];
    const monthlyComp = nibrsData.monthlyComparison?.[categoryKey];
    const ytdComp = nibrsData.ytdComparison?.[categoryKey];
    
    if (monthlyComp) {
      // Category total
      csvRows.push([
        category.label,
        monthlyComp.total.previous,
        monthlyComp.total.current,
        formatPercentageForExport(monthlyComp.total.change),
        ytdComp?.total.previous || 0,
        ytdComp?.total.current || 0,
        formatPercentageForExport(ytdComp?.total.change || 0)
      ]);
      
      // Individual offenses
      Object.keys(monthlyComp.offenses || {}).forEach(offense => {
        const offenseData = monthlyComp.offenses[offense];
        const ytdOffenseData = ytdComp?.offenses[offense];
        
        csvRows.push([
          `  ${offense}`,
          offenseData.previous,
          offenseData.current,
          formatPercentageForExport(offenseData.change),
          ytdOffenseData?.previous || 0,
          ytdOffenseData?.current || 0,
          formatPercentageForExport(ytdOffenseData?.change || 0)
        ]);
      });
    }
  });
  
  // Grand total
  csvRows.push([
    'TOTAL:',
    nibrsData.summary?.totalReports?.previousYear || 0,
    nibrsData.summary?.totalReports?.currentMonth || 0,
    formatPercentageForExport(nibrsData.monthlyComparison?.totalChange || 0),
    nibrsData.summary?.totalReports?.ytdPrevious || 0,
    nibrsData.summary?.totalReports?.ytdCurrent || 0,
    formatPercentageForExport(nibrsData.ytdComparison?.totalChange || 0)
  ]);
  
  const csvContent = csvRows.map(row => row.join(',')).join('\n');
  
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="nibrs-report-${monthName.toLowerCase()}-${report.year}.csv"`
    }
  });
}

function formatPercentageForExport(value: number): string {
  if (value === 0) return '0%';
  if (!value && value !== 0) return 'NC';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(0)}%`;
}