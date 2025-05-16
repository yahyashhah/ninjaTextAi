// scripts/cleanEmails.ts
import { createClerkClient } from '@clerk/backend';
import { PrismaClient } from '@prisma/client';

// Initialize Clerk with your secret key
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const prisma = new PrismaClient();

interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
  }[];
}

async function cleanUserEmails() {
  try {
    console.log('Starting email cleanup process...');

    // Get all users from Clerk in batches
    let allUsers: ClerkUser[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await clerk.users.getUserList({ limit, offset });
      allUsers = [...allUsers, ...response.data];
      offset += limit;
      hasMore = response.data.length === limit;
      console.log(`Fetched ${offset} users so far...`);
    }

    console.log(`Total users to process: ${allUsers.length}`);

    // Update MongoDB users to match Clerk data
    for (const clerkUser of allUsers) {
      try {
        const primaryEmail = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || null;

        await prisma.user.updateMany({
          where: { clerkUserId: clerkUser.id },
          data: {
            email: primaryEmail,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            profileImageUrl: clerkUser.imageUrl || null
          }
        });
      } catch (error) {
        console.error(`Error processing Clerk user ${clerkUser.id}:`, error);
      }
    }

    // Handle any remaining null emails
    const nullEmailUsers = await prisma.user.findMany({
      where: { 
        OR: [
          { email: null },
          { email: undefined }
        ]
      }
    });

    console.log(`Found ${nullEmailUsers.length} users with null emails`);

    for (const user of nullEmailUsers) {
      try {
        if (!user.clerkUserId) {
          console.warn(`User ${user.id} has no clerkUserId`);
          continue;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: `temp-${user.clerkUserId}@example.com`
          }
        });
      } catch (error) {
        console.error(`Error updating user ${user.id}:`, error);
      }
    }

    console.log('✅ Email cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error in cleanUserEmails:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanUserEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });