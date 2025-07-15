import { db, Supporters, Campaigns } from 'astro:db';

export default async function resetAndSeed() {
  // Clear existing data
  await db.delete(Supporters);
  await db.delete(Campaigns);

  // Create the Best Buddies Challenge campaign
  await db.insert(Campaigns).values([
    {
      id: 1,
      name: 'Best Buddies Challenge 2025',
      goal_amount: 1800,
      current_amount: 200,
      description: 'Fundraising for Best Buddies International to support people with intellectual and developmental disabilities',
      created_at: new Date().toISOString()
    }
  ]);

  // Insert supporters with donation amounts and campaign reference
  const now = new Date().toISOString();
  const supporters = [
    { id: 1, name: 'COLE TOWNSEND', donation_amount: 50, campaign_id: 1, created_at: now },
    { id: 2, name: 'BARBARA TOWNSEND', donation_amount: 100, campaign_id: 1, created_at: now },
    { id: 3, name: 'MICHAEL CHEN', donation_amount: 25, campaign_id: 1, created_at: now },
    { id: 4, name: 'SARAH JOHNSON', donation_amount: 75, campaign_id: 1, created_at: now },
    { id: 5, name: 'DAVID RODRIGUEZ', donation_amount: 30, campaign_id: 1, created_at: now },
    { id: 6, name: 'EMILY DAVIS', donation_amount: 40, campaign_id: 1, created_at: now },
    { id: 7, name: 'JAMES WILSON', donation_amount: 60, campaign_id: 1, created_at: now },
    { id: 8, name: 'MARIA GARCIA', donation_amount: 35, campaign_id: 1, created_at: now },
    { id: 9, name: 'ROBERT BROWN', donation_amount: 45, campaign_id: 1, created_at: now },
    { id: 10, name: 'JENNIFER TAYLOR', donation_amount: 20, campaign_id: 1, created_at: now },
    { id: 11, name: 'WILLIAM ANDERSON', donation_amount: 80, campaign_id: 1, created_at: now },
    { id: 12, name: 'ELIZABETH THOMAS', donation_amount: 55, campaign_id: 1, created_at: now },
    { id: 13, name: 'CHRISTOPHER LEE', donation_amount: 25, campaign_id: 1, created_at: now },
    { id: 14, name: 'AMANDA WHITE', donation_amount: 90, campaign_id: 1, created_at: now },
    { id: 15, name: 'DANIEL MARTINEZ', donation_amount: 40, campaign_id: 1, created_at: now },
    { id: 16, name: 'MELISSA CLARK', donation_amount: 65, campaign_id: 1, created_at: now },
    { id: 17, name: 'ANTHONY LEWIS', donation_amount: 30, campaign_id: 1, created_at: now },
    { id: 18, name: 'STEPHANIE WALKER', donation_amount: 50, campaign_id: 1, created_at: now },
    { id: 19, name: 'MARK HALL', donation_amount: 35, campaign_id: 1, created_at: now },
    { id: 20, name: 'JESSICA YOUNG', donation_amount: 70, campaign_id: 1, created_at: now }
  ];

  await db.insert(Supporters).values(supporters);
  
  console.log('Database reset and seeded successfully!');
}