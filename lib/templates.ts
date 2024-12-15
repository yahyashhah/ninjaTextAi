import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Save a new template
export const saveUploadTemplate = async (
  userId: string,
  templateName: string,
  instructions: string,
  examples: string | undefined,
  reportType: string
) => {
  if (!userId) {
    return;
  }

  await prisma.uploadTemplates.create({
    data: {
      userId,
      templateName,
      instructions,
      reportType,
      ...(examples ? { examples } : {}),  // Add examples only if it has a value
    },
  });
};


// Get all templates for the current user
export const getAllUploadTemplates = async () => {
  const { userId } = auth();

  if (!userId) return;

  const userTemplates = await prisma.uploadTemplates.findMany({
    where: { userId: userId },
  });

  return userTemplates;
};

// Filter templates by reportType
export const filterUploadTemplatesByReportType = async (reportType: string) => {
  const { userId } = auth();

  if (!userId) return;

  const filteredTemplates = await prisma.uploadTemplates.findMany({
    where: { userId: userId, reportType: reportType },
  });

  return filteredTemplates;
};