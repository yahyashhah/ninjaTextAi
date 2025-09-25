// lib/user-reports.ts - ENHANCED
import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

// Enhanced save report with NIBRS data
export const saveReport = async (
  userId: string,
  reportName: string,
  reportText: string,
  tag: string,
  nibrsData?: any, // NEW: Optional NIBRS data
  xmlData?: string, // NEW: Optional XML data
) => {
  if (!userId) {
    return;
  }
  
  await prismadb.userReports.create({
    data: {
      userId: userId,
      reportName: reportName,
      reportText: reportText,
      tag: tag,
      // NEW: Store NIBRS data if provided
      nibrsData: nibrsData ? JSON.stringify(nibrsData) : null,
      xmlData: xmlData || null,
    },
  });
};

// Enhanced update report with NIBRS data
export const updateReport = async (
  reportId: string, 
  text: string, 
  reportName: string,
  nibrsData?: any, // NEW: Optional NIBRS data updates
  xmlData?: string // NEW: Optional XML updates
) => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  const updateData: any = {
    reportText: text,
    reportName: reportName
  };

  // Add NIBRS data if provided
  if (nibrsData !== undefined) {
    updateData.nibrsData = JSON.stringify(nibrsData);
  }
  
  if (xmlData !== undefined) {
    updateData.xmlData = xmlData;
  }

  await prismadb.userReports.update({
    where: { id: reportId },
    data: updateData,
  });
};

// Get report with parsed NIBRS data
export const getReportWithNibrs = async (reportId: string) => {
  const { userId } = auth();

  if (!userId) return null;

  const report = await prismadb.userReports.findFirst({
    where: { 
      id: reportId,
      userId: userId 
    },
  });

  if (report && report.nibrsData) {
    return {
      ...report,
      nibrsData: JSON.parse(report.nibrsData)
    };
  }

  return report;
};

// Existing functions remain the same
export const getAllReports = async () => {
  const { userId } = auth();
  if (!userId) return;
  return await prismadb.userReports.findMany({ where: { userId: userId } });
};

export const filterReports = async (tag: string) => {
  const { userId } = auth();
  if (!userId) return;
  return await prismadb.userReports.findMany({ 
    where: { userId: userId, tag: tag } 
  });
};

export const searchReportByName = async (name: string) => {
  const { userId } = auth();
  if (!userId) return;
  return await prismadb.userReports.findMany({ 
    where: { userId: userId, reportName: name } 
  });
};