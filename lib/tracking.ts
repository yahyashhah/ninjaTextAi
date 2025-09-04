// lib/tracking.ts

import prismadb from "./prismadb";

export interface ReportEvent {
  userId: string;
  reportType: string;
  processingTime?: number;
  success: boolean;
  templateUsed?: string;
  error?: string;
}

export interface UserActivity {
  userId: string;
  activity: string;
  metadata?: any;
}

export interface SystemError {
  type: string;
  message: string;
  userId?: string;
  metadata?: any;
}

export async function trackReportEvent(data: ReportEvent) {
  try {
    await prismadb.reportEvent.create({
      data: {
        userId: data.userId,
        reportType: data.reportType,
        processingTime: data.processingTime,
        success: data.success,
        templateUsed: data.templateUsed,
        error: data.error,
      }
    });
  } catch (error) {
    console.error("Error tracking report event:", error);
  }
}

export async function trackUserActivity(data: UserActivity) {
  try {
    await prismadb.userActivity.create({
      data: {
        userId: data.userId,
        activity: data.activity,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      }
    });
  } catch (error) {
    console.error("Error tracking user activity:", error);
  }
}

export async function trackSystemError(data: SystemError) {
  try {
    await prismadb.systemError.create({
      data: {
        type: data.type,
        message: data.message,
        userId: data.userId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      }
    });
  } catch (error) {
    console.error("Error tracking system error:", error);
  }
}