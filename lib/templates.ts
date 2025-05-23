import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Save a new template
export const saveUploadTemplate = async (
  userId: string,
  templateName: string,
  instructions: string,
  examples: string | undefined,
  reportTypes: string[] // Change to array
) => {
  if (!userId) {
    return;
  }

  await prisma.uploadTemplates.create({
    data: {
      userId,
      templateName,
      instructions,
      reportTypes,
      ...(examples ? { examples } : {}),
    },
  });
};

export const updateTemplate = async (
  id: string,
  templateName: string,
  instructions: string,
) => {
  if (!id) {
    return;
  }
  // Update the template with the new values
  await prisma.uploadTemplates.update({
    where: { id: id },
    data: {
      templateName,
      instructions,
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
    where: { 
      userId: userId, 
      reportTypes: {
        has: reportType // Check if array contains the type
      }
    },
  });

  return filteredTemplates;
};