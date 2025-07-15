import { db, Supporters } from 'astro:db';
import { deleteSupporter } from './utils.js';

async function testSupporterDelete() {
  console.log('🧪 Testing supporter delete functionality...\n');

  try {
    // First, let's see the current state
    const initialSupporters = await db.select().from(Supporters);
    
    console.log(`📊 Initial state:`);
    console.log(`   Supporters: ${initialSupporters.length}\n`);

    // Find a supporter to delete
    const supporterToDelete = initialSupporters[0];

    if (!supporterToDelete) {
      console.log('❌ No supporter found to test delete');
      return;
    }

    const supporterId = supporterToDelete.id;
    
    console.log(`🎯 Testing deletion of supporter ID ${supporterId} (${supporterToDelete.name})`);
    console.log(`   Donation amount: $${supporterToDelete.donation_amount}\n`);

    // Perform delete
    const result = await deleteSupporter(supporterId);
    
    console.log(`✅ Delete completed:`);
    console.log(`   Deleted supporter: ${result.deletedSupporter}\n`);

    // Verify the deletion
    const finalSupporters = await db.select().from(Supporters);
    
    console.log(`📊 Final state:`);
    console.log(`   Supporters: ${finalSupporters.length} (was ${initialSupporters.length})\n`);

    // Check if the specific supporter is gone
    const deletedSupporterStillExists = finalSupporters.some(s => s.id === supporterId);

    if (!deletedSupporterStillExists) {
      console.log('🎉 SUCCESS: Delete worked correctly!');
      console.log('   - Supporter was deleted');
    } else {
      console.log('❌ FAILURE: Delete did not work correctly');
      console.log('   - Supporter still exists');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testSupporterDelete();