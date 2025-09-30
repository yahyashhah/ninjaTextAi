import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// Save a new template with strict validation fields
export const saveUploadTemplate = async (
  userId: string,
  templateName: string,
  instructions: string,
  examples: string | undefined,
  reportTypes: string[],
  requiredFields: string[],
  fieldDefinitions: any,
  strictMode: boolean = true
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
      requiredFields,
      fieldDefinitions,
      strictMode,
      ...(examples ? { examples } : {}),
    },
  });
};

export const updateTemplate = async (
  id: string,
  templateName: string,
  instructions: string,
  requiredFields: string[],
  fieldDefinitions: any,
  strictMode: boolean
) => {
  if (!id) {
    return;
  }
  
  await prisma.uploadTemplates.update({
    where: { id: id },
    data: {
      templateName,
      instructions,
      requiredFields,
      fieldDefinitions,
      strictMode,
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
        has: reportType
      }
    },
  });

  return filteredTemplates;
};

// Get template by ID
export const getTemplateById = async (id: string) => {
  const { userId } = auth();
  
  if (!userId) return null;

  const template = await prisma.uploadTemplates.findFirst({
    where: { 
      id: id,
      userId: userId 
    },
  });

  return template;
};