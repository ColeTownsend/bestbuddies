import { CampaignQueries, SupporterQueries, initializeTables } from '../src/lib/db';

export default async function seed() {
  // Initialize tables first
  await initializeTables();

  // Create the Best Buddies Challenge campaign
  await CampaignQueries.createCampaign({
    name: 'Best Buddies Challenge 2025',
    goal_amount: 1800,
    current_amount: 250,
    description: 'Fundraising for Best Buddies International to support people with intellectual and developmental disabilities',
    created_at: new Date().toISOString()
  });

  // Insert supporters with donation amounts and campaign reference
  const now = new Date().toISOString();
  const supporters = [
    { name: 'COLE TOWNSEND', donation_amount: 250, campaign_id: 1, created_at: now },
  ];

  for (const supporter of supporters) {
    await SupporterQueries.createSupporter(supporter);
  }
}