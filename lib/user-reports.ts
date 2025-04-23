import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

// save user report
export const saveReport = async (
  userId: string,
  reportName: string,
  reportText: string,
  tag: string
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
    },
  });
};

export const getAllReports = async () => {
  const { userId } = auth();

  if (!userId) return;

  const userReports = await prismadb.userReports.findMany({
    where: { userId: userId },
  });

  return userReports;
};

// filter reports by tags
export const filterReports = async (tag: string) => {
  const { userId } = auth();

  if (!userId) return;

  const filteredReports = await prismadb.userReports.findMany({
    where: { userId: userId, tag: tag },
  });

  return filteredReports;
};

export const searchReportByName = async (name: string) => {
  const { userId } = auth();

  if (!userId) return;

  const filteredReports = await prismadb.userReports.findMany({
    where: { userId: userId, reportName: name },
  });

  return filteredReports;
};

export const updateReport = async (reportId: string, text: string, reportName: string) => {
  const { userId } = auth();

  if (!userId) {
    return;
  }

  await prismadb.userReports.update({
    where: { id: reportId },
    data: { reportText: text,
      reportName: reportName
     },
  });
};
