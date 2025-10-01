import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedData() {
  console.log('🔍 Cleaning up orphaned data...');
  
  try {
    // Get all organization members
    const allMembers = await prisma.organizationMember.findMany({
      include: {
        user: true
      }
    });

    // Find members where user is null
    const orphanedMembers = allMembers.filter(member => member.user === null);
    
    console.log(`🗑️ Found ${orphanedMembers.length} orphaned members to delete`);

    // Delete orphaned members
    for (const member of orphanedMembers) {
      await prisma.organizationMember.delete({
        where: { id: member.id }
      });
      console.log(`✅ Deleted orphaned member: ${member.id}`);
    }

    console.log('✅ Cleanup completed!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupOrphanedData()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });