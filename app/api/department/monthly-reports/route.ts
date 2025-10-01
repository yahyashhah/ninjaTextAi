// app/api/department/monthly-reports/route.ts (FIXED TYPES)
import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';
import { ensureOrganizationExists } from '@/lib/organization-utils';

// Define proper TypeScript interfaces
interface NIBRSOffenseCategory {
  label: string;
  offenses: Record<string, string>;
}

interface NIBRSOffenseCategories {
  crimeAgainstPerson: NIBRSOffenseCategory;
  crimeAgainstProperty: NIBRSOffenseCategory;
  crimeAgainstSociety: NIBRSOffenseCategory;
}

// Enhanced NIBRS offense categories with proper code mapping
const NIBRS_OFFENSE_CATEGORIES: NIBRSOffenseCategories = {
  crimeAgainstPerson: {
    label: 'Crime Against Person',
    offenses: {
      '13A': 'Aggravated Assault',
      '13B': 'Simple Assault', 
      '13C': 'Intimidation',
      '09A': 'Murder and Non-Negligent Manslaughter',
      '09B': 'Negligent Manslaughter',
      '09C': 'Justifiable Homicide',
      '100': 'Human Trafficking, Commercial Sex Act',
      '101': 'Human Trafficking, Involuntary Servitude',
      '120': 'Kidnapping/Abduction',
      '11A': 'Rape',
      '11B': 'Fondling',
      '36A': 'Incest',
      '36B': 'Statutory Rape'
    }
  },
  crimeAgainstProperty: {
    label: 'Crime Against Property',
    offenses: {
      '200': 'Arson',
      '510': 'Bribery',
      '220': 'Burglary/Breaking & Entering',
      '250': 'Counterfeiting/Forgery',
      '290': 'Destruction/Damage/Vandalism of Property',
      '270': 'Embezzlement',
      '210': 'Extortion/Blackmail',
      '26A': 'False Pretenses/Swindle/Confidence Game',
      '26B': 'Credit Card/Automated Teller Machine Fraud',
      '26C': 'Impersonation/Identity Theft',
      '26D': 'Welfare Fraud',
      '26E': 'Wire Fraud',
      '26F': 'Hacking/Computer Invasion',
      '23A': 'Pocket-picking',
      '23B': 'Snatching',
      '23C': 'Shoplifting',
      '23D': 'Theft from Building',
      '23E': 'Theft from Coin Operated Machine or Device',
      '23F': 'Theft from Motor Vehicle',
      '23G': 'Theft of Motor Vehicle Parts or Accessories',
      '23H': 'All Other Larceny',
      '240': 'Motor Vehicle Theft',
      '120': 'Robbery',
      '280': 'Stolen Property Offenses'
    }
  },
  crimeAgainstSociety: {
    label: 'Crime Against Society', 
    offenses: {
      '720': 'Animal Cruelty',
      '35A': 'Drug/Narcotic Violations',
      '35B': 'Drug Equipment Violations',
      '370': 'Pornography/Obscene Material',
      '40A': 'Prostitution',
      '40B': 'Assisting or Promoting Prostitution',
      '40C': 'Purchasing Prostitution',
      '520': 'Weapon Law Violations'
    }
  }
};

// Report type to NIBRS category mapping
const REPORT_TYPE_MAPPING: { [key: string]: string } = {
  'accident_report': 'crimeAgainstProperty',
  'arrest_report': 'crimeAgainstProperty', 
  'incident_report': 'crimeAgainstProperty',
  'domestic_violence': 'crimeAgainstPerson',
  'field_interview': 'crimeAgainstProperty',
  'use_of_force': 'crimeAgainstPerson',
  'witness_report': 'crimeAgainstProperty',
  'supplemental_report': 'crimeAgainstProperty',
  'dual_report': 'crimeAgainstProperty',
  'nibrs': 'crimeAgainstProperty'
};

// Define interfaces for the data structures
interface OffenseCounts {
  [category: string]: {
    total: number;
    offenses: { [offenseName: string]: number };
  };
}

// FIXED: Proper interface definition without index signature conflict
interface CategoryComparison {
  total: {
    current: number;
    previous: number;
    change: number;
  };
  offenses: {
    [offenseName: string]: {
      current: number;
      previous: number;
      change: number;
    };
  };
}

interface ComparisonData {
  categories: {
    [category: string]: CategoryComparison;
  };
  totalChange: number;
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const organization = await ensureOrganizationExists(orgId);

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

    return NextResponse.json({ 
      reports: monthlyReports,
      organization: {
        name: organization.name,
        id: organization.id
      }
    });
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

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Month must be between 1 and 12' }, { status: 400 });
    }

    if (year < 2000 || year > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    const organization = await ensureOrganizationExists(orgId);

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const report = await generateEnhancedMonthlyReport(organization.id, month, year);
    return NextResponse.json({ 
      report,
      message: `Monthly report for ${month}/${year} generated successfully`
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    return NextResponse.json({ error: 'Failed to generate monthly report' }, { status: 500 });
  }
}

async function generateEnhancedMonthlyReport(organizationId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  console.log(`📊 Generating monthly report for ${month}/${year}, organization: ${organizationId}`);
  console.log(`Date range: ${startDate} to ${endDate}`);

  // FIXED: Use broader date filtering to include all relevant reports
  const currentMonthReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      OR: [
        {
          // Include reports from current month (using createdAt)
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          // Include reports submitted in current month (regardless of when created)
          submittedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      ],
      // FIXED: Include all statuses to get complete picture
      status: {
        in: ['draft', 'submitted', 'approved']
      }
    },
    // FIXED: Remove user include since it's causing issues
    select: {
      id: true,
      clerkUserId: true,
      reportType: true,
      accuracyScore: true,
      submittedAt: true,
      createdAt: true,
      status: true,
      nibrsData: true
    }
  });

  console.log(`📋 Found ${currentMonthReports.length} reports for current month`);

  // FIXED: Get reports for previous year same month with same logic
  const prevYearStart = new Date(year - 1, month - 1, 1);
  const prevYearEnd = new Date(year - 1, month, 0, 23, 59, 59);
  const prevYearReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      OR: [
        {
          createdAt: {
            gte: prevYearStart,
            lte: prevYearEnd
          }
        },
        {
          submittedAt: {
            gte: prevYearStart,
            lte: prevYearEnd
          }
        }
      ]
    }
  });

  // Get YTD reports
  const ytdStart = new Date(year, 0, 1);
  const ytdReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      OR: [
        {
          createdAt: {
            gte: ytdStart,
            lte: endDate
          }
        },
        {
          submittedAt: {
            gte: ytdStart,
            lte: endDate
          }
        }
      ]
    }
  });

  // Get previous year YTD reports
  const prevYtdStart = new Date(year - 1, 0, 1);
  const prevYtdEnd = new Date(year - 1, month, 0, 23, 59, 59);
  const prevYtdReports = await prismadb.departmentReport.findMany({
    where: {
      organizationId: organizationId,
      OR: [
        {
          createdAt: {
            gte: prevYtdStart,
            lte: prevYtdEnd
          }
        },
        {
          submittedAt: {
            gte: prevYtdStart,
            lte: prevYtdEnd
          }
        }
      ]
    }
  });

  // FIXED: Enhanced offense counting function with proper typing
  const countOffensesByPeriod = (reports: any[]): OffenseCounts => {
    const counts: OffenseCounts = {};
    
    // Initialize all offense categories
    Object.keys(NIBRS_OFFENSE_CATEGORIES).forEach(category => {
      counts[category] = {
        total: 0,
        offenses: {}
      };
      const categoryData = NIBRS_OFFENSE_CATEGORIES[category as keyof NIBRSOffenseCategories];
      Object.values(categoryData.offenses).forEach((offense: string) => {
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
          console.log(`🔍 Processing NIBRS data for report ${report.id}:`, nibrsData);
          
          if (nibrsData.offenses && Array.isArray(nibrsData.offenses)) {
            nibrsData.offenses.forEach((offense: any) => {
              const offenseCode = offense.code;
              const offenseName = getOffenseNameByCode(offenseCode);
              
              if (offenseName) {
                categorizeAndCountOffense(offenseName, counts);
                offenseFound = true;
                console.log(`✅ Counted NIBRS offense: ${offenseName} (Code: ${offenseCode})`);
              } else {
                console.log(`❌ Unknown NIBRS offense code: ${offenseCode}`);
              }
            });
          } else {
            console.log(`⚠️ No offenses array in NIBRS data for report ${report.id}`);
          }
        } catch (error) {
          console.error('❌ Error parsing NIBRS data:', error);
        }
      }
      
      // If no offense found in nibrsData, use report type mapping
      if (!offenseFound && report.reportType) {
        const category = REPORT_TYPE_MAPPING[report.reportType] || 'crimeAgainstProperty';
        const defaultOffense = category === 'crimeAgainstPerson' ? 'Simple Assault' : 'All Other Larceny';
        
        categorizeAndCountOffense(defaultOffense, counts);
        console.log(`📝 Mapped report type "${report.reportType}" to category "${category}", offense: "${defaultOffense}"`);
      }
    });

    console.log('📈 Final offense counts:', counts);
    return counts;
  };

  // FIXED: Helper function to get offense name by code with proper typing
  const getOffenseNameByCode = (code: string): string | null => {
    for (const category of Object.values(NIBRS_OFFENSE_CATEGORIES)) {
      // Use type assertion to tell TypeScript this is a string-indexable object
      const offenses = category.offenses as Record<string, string>;
      if (offenses[code]) {
        return offenses[code];
      }
    }
    return null;
  };

  // FIXED: Helper function to categorize and count offenses with proper typing
  const categorizeAndCountOffense = (offenseName: string, counts: OffenseCounts) => {
    let categorized = false;
    
    // Try to find the offense in predefined categories
    Object.keys(NIBRS_OFFENSE_CATEGORIES).forEach(category => {
      const categoryData = NIBRS_OFFENSE_CATEGORIES[category as keyof NIBRSOffenseCategories];
      const offenseValues = Object.values(categoryData.offenses);
      
      if (offenseValues.includes(offenseName)) {
        counts[category].total++;
        counts[category].offenses[offenseName] = (counts[category].offenses[offenseName] || 0) + 1;
        categorized = true;
      }
    });

    // If not found in predefined categories, add to "All Other Larceny"
    if (!categorized) {
      counts.crimeAgainstProperty.total++;
      counts.crimeAgainstProperty.offenses['All Other Larceny'] = 
        (counts.crimeAgainstProperty.offenses['All Other Larceny'] || 0) + 1;
      console.log(`⚠️ Uncategorized offense "${offenseName}" added to "All Other Larceny"`);
    }
  };

  // Count offenses for each period
  const currentMonthCounts = countOffensesByPeriod(currentMonthReports);
  const prevYearCounts = countOffensesByPeriod(prevYearReports);
  const ytdCounts = countOffensesByPeriod(ytdReports);
  const prevYtdCounts = countOffensesByPeriod(prevYtdReports);

  console.log('📊 Offense summary:', {
    currentMonthTotal: Object.values(currentMonthCounts).reduce((sum: number, cat: any) => sum + cat.total, 0),
    previousYearTotal: Object.values(prevYearCounts).reduce((sum: number, cat: any) => sum + cat.total, 0)
  });

  // FIXED: Calculate comparisons with proper typing
const calculateComparisons = (current: OffenseCounts, previous: OffenseCounts): ComparisonData => {
  const categories: { [category: string]: CategoryComparison } = {};
  
  Object.keys(current).forEach(category => {
    categories[category] = {
      total: {
        current: current[category].total,
        previous: previous[category].total,
        change: previous[category].total > 0 
          ? ((current[category].total - previous[category].total) / previous[category].total) * 100
          : current[category].total > 0 ? 100 : 0
      },
      offenses: {}
    };
    
    Object.keys(current[category].offenses).forEach(offense => {
      const currentCount = current[category].offenses[offense];
      const prevCount = previous[category].offenses[offense] || 0;
      categories[category].offenses[offense] = {
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
  const totalChange = totalPrevious > 0 
    ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
    : totalCurrent > 0 ? 100 : 0;

  return {
    categories,
    totalChange
  };
};

  const monthlyComparison = calculateComparisons(currentMonthCounts, prevYearCounts);
  const ytdComparison = calculateComparisons(ytdCounts, prevYtdCounts);

  // FIXED: Get ALL unique officers from reports (not just organization members)
  const officerIds = Array.from(new Set(currentMonthReports.map(r => r.clerkUserId)));
  console.log(`👥 DEBUG: Unique officers from reports: ${officerIds.length}`, officerIds);

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
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
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
        ytdChange: ytdComparison.totalChange,
        threshold: 85
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
        ytdChange: ytdComparison.totalChange,
        threshold: 85
      })
    }
  });

  console.log(`✅ Monthly report generated: ${monthlyReport.id}`);
  
  return monthlyReport;
}

// Export endpoint remains the same
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
        
        if (offenseData.current > 0 || offenseData.previous > 0) {
          csvRows.push([
            `  ${offense}`,
            offenseData.previous,
            offenseData.current,
            formatPercentageForExport(offenseData.change),
            ytdOffenseData?.previous || 0,
            ytdOffenseData?.current || 0,
            formatPercentageForExport(ytdOffenseData?.change || 0)
          ]);
        }
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