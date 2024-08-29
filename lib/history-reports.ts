import prismadb from "./prismadb";
import { auth } from "@clerk/nextjs/server";

// save user report
export const saveHistoryReport = async (
  userId: string,
  reportName: string,
  reportText: string,
  tag: string
) => {
  if (!userId) {
    return;
  }
  await prismadb.reportsHistory.create({
    data: {
      userId: userId,
      reportName: reportName,
      reportText: reportText,
      tag: tag,
    },
  });
};

export const getAllHistroyReports = async () => {
  const { userId } = auth();

  if (!userId) return;

  const userReports = await prismadb.reportsHistory.findMany({
    where: { userId: userId },
  });

  return userReports;
};

// filter reports by tags
export const filterHistoryReports = async (tag: string) => {
  const { userId } = auth();

  if (!userId) return;

  const filteredReports = await prismadb.reportsHistory.findMany({
    where: { userId: userId, tag: tag },
  });

  return filteredReports;
};

// export const searchReportByName = async (name: string) => {
//   const { userId } = auth();

//   if (!userId) return;

//   const filteredReports = await prismadb.userReports.findMany({
//     where: { userId: userId, reportName: name },
//   });

//   return filteredReports;
// };

// export const updateReport = async (reportId: string, text: string) => {
//   const { userId } = auth();

//   if (!userId) {
//     return;
//   }

//   await prismadb.userReports.update({
//     where: { id: reportId },
//     data: { reportText: text },
//   });
// };
