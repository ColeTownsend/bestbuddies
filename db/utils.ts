import { db, Supporters, eq } from 'astro:db';

/**
 * Deletes a supporter (donation data is included in the supporter record)
 * @param supporterId - The ID of the supporter to delete
 * @returns Promise<{ deletedSupporter: boolean }>
 */
export async function deleteSupporter(supporterId: number) {
  try {
    // Delete the supporter (which includes their donation data)
    const deletedSupporter = await db
      .delete(Supporters)
      .where(eq(Supporters.id, supporterId));

    return {
      deletedSupporter: (deletedSupporter.changes || 0) > 0
    };
  } catch (error) {
    console.error('Error deleting supporter:', error);
    throw error;
  }
}

/**
 * Deletes multiple supporters
 * @param supporterIds - Array of supporter IDs to delete
 * @returns Promise<{ deletedSupporters: number }>
 */
export async function deleteSupporters(supporterIds: number[]) {
  try {
    let totalDeletedSupporters = 0;

    for (const supporterId of supporterIds) {
      const result = await deleteSupporter(supporterId);
      totalDeletedSupporters += result.deletedSupporter ? 1 : 0;
    }

    return {
      deletedSupporters: totalDeletedSupporters
    };
  } catch (error) {
    console.error('Error deleting supporters:', error);
    throw error;
  }
}