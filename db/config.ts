import { defineDb, defineTable, column } from 'astro:db';

const Campaigns = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    goal_amount: column.number(),
    current_amount: column.number(),
    description: column.text({ optional: true }),
    created_at: column.text()
  }
});

const Supporters = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.text(),
    donation_amount: column.number(),
    campaign_id: column.number({ references: () => Campaigns.columns.id }),
    created_at: column.text()
  }
});

export default defineDb({
  tables: { Campaigns, Supporters }
});