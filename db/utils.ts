import { SupporterQueries } from '../src/lib/db';

/**
 * Deletes a supporter (donation data is included in the supporter record)
 * @param supporterId - The ID of the supporter to delete
 * @returns Promise<{ deletedSupporter: boolean }>
 */
export async function deleteSupporter(supporterId: number) {
  try {
    const deletedSupporter = await SupporterQueries.deleteSupporter(supporterId);

    return {
      deletedSupporter
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
    const totalDeletedSupporters = await SupporterQueries.deleteSupporters(supporterIds);

    return {
      deletedSupporters: totalDeletedSupporters
    };
  } catch (error) {
    console.error('Error deleting supporters:', error);
    throw error;
  }
}