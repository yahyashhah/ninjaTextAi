// lib/notifications.ts
import prismadb from "./prismadb";

export async function sendLowAccuracyNotification(
  organizationId: string, 
  reportId: string, 
  accuracyScore: number
) {
  try {
    // Get organization admins
    const admins = await prismadb.organizationMember.findMany({
      where: {
        organizationId: organizationId,
        role: 'admin'
      },
      include: {
        user: true
      }
    });
    
    // Get report details
    const report = await prismadb.departmentReport.findUnique({
      where: { id: reportId },
      include: {
        user: true
      }
    });
    
    if (!report) return;
    
    // Send emails to admins
    for (const admin of admins) {
      if (admin.user.email) {
        await sendEmail({
          to: admin.user.email,
          subject: `Low Accuracy Report Needs Review - ${Math.round(accuracyScore)}%`,
          template: 'low-accuracy-alert',
          variables: {
            reportTitle: report.title,
            officerName: `${report.user.firstName} ${report.user.lastName}`,
            accuracyScore: Math.round(accuracyScore),
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString(),
            reviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/department-admin/review`
          }
        });
      }
    }
  } catch (error) {
    console.error('Error sending low accuracy notification:', error);
  }
}

export async function sendReviewReminderNotifications() {
  try {
    // Find items due in the next 24 hours that are still pending
    const dueSoonItems = await prismadb.reviewQueueItem.findMany({
      where: {
        status: {
          in: ['pending', 'in_review']
        },
        dueDate: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in next 24 hours
          gte: new Date() // Not already overdue
        }
      },
      include: {
        report: {
          include: {
            user: true
          }
        },
        organization: true
      }
    });
    
    for (const item of dueSoonItems) {
      // Get assigned admin or all admins if not assigned
      let admins;
      if (item.assignedTo) {
        admins = await prismadb.organizationMember.findMany({
          where: {
            organizationId: item.organizationId,
            userId: item.assignedTo,
            role: 'admin'
          },
          include: {
            user: true
          }
        });
      } else {
        admins = await prismadb.organizationMember.findMany({
          where: {
            organizationId: item.organizationId,
            role: 'admin'
          },
          include: {
            user: true
          }
        });
      }
      
      // Send reminders
      for (const admin of admins) {
        if (admin.user.email) {
          await sendEmail({
            to: admin.user.email,
            subject: `Reminder: Review Item Due Soon - ${item.report.title}`,
            template: 'review-reminder',
            variables: {
              reportTitle: item.report.title,
              dueDate: new Date(item.dueDate).toLocaleDateString(),
              hoursRemaining: Math.round((item.dueDate.getTime() - Date.now()) / (60 * 60 * 1000)),
              reviewLink: `${process.env.NEXT_PUBLIC_APP_URL}/department-admin/review`
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error sending review reminders:', error);
  }
}

// Cron job to run daily (set up via Vercel Cron, AWS EventBridge, etc.)
export async function scheduledNotificationHandler() {
  await sendReviewReminderNotifications();
}

function sendEmail(arg0: { to: string; subject: string; template: string; variables: { reportTitle: string; officerName?: string; accuracyScore?: number; dueDate: string; reviewLink: string; hoursRemaining?: number; }; }) {
  throw new Error("Function not implemented.");
}