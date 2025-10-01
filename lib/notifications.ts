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
      // FIXED: Add null check for admin.user
      if (admin.user?.email) {
        // FIXED: Add null checks for user properties
        const officerName = report.user 
          ? `${report.user.firstName || ''} ${report.user.lastName || ''}`.trim()
          : 'Unknown Officer';
        
        await sendEmail({
          to: admin.user.email,
          subject: `Low Accuracy Report Needs Review - ${Math.round(accuracyScore)}%`,
          template: 'low-accuracy-alert',
          variables: {
            reportTitle: report.title,
            officerName: officerName,
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
      // Skip if report is missing
      if (!item.report) continue;
      
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
        // FIXED: Add null check for admin.user
        if (admin.user?.email) {
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

// FIXED: Implement the sendEmail function or import it
async function sendEmail(emailData: { 
  to: string; 
  subject: string; 
  template: string; 
  variables: { 
    reportTitle: string; 
    officerName?: string; 
    accuracyScore?: number; 
    dueDate: string; 
    reviewLink: string; 
    hoursRemaining?: number; 
  }; 
}) {
  try {
    // Implement your email sending logic here
    // This could be using SendGrid, Resend, Nodemailer, etc.
    console.log('Sending email:', {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
      variables: emailData.variables
    });
    
    // Example implementation (replace with your actual email service):
    /*
    const response = await fetch('https://api.your-email-service.com/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EMAIL_API_KEY}`
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }
    */
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}