import { createClient, type Row } from '@libsql/client';

const TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTI4NzE0ODYsImlkIjoiODhhMDlmNTAtOGY1ZS00NWQ5LThmY2EtMjc0ZWQxNmFkMGMzIiwicmlkIjoiOThjZTAwNWItMmNjYS00NDlkLTkxMWEtMGViMGFmNjY5M2RlIn0.ycxlA93s3zBSOiofpXnpiEgDhQjV5WG-vnemmnt7rmifC4nYstM6zFiplxU2NmZtX2m7_TgSJpj6oEIlQGF6Aw';
const DB_URL = 'libsql://best-buddies-coletownsend.aws-us-east-1.turso.io';

export const db = createClient({
  url: DB_URL,
  authToken: TOKEN,
  offline: false,
});

export interface Campaign {
  id: number;
  name: string;
  goal_amount: number;
  current_amount: number;
  description?: string;
  created_at: string;
}

export interface Supporter {
  id: number;
  name: string;
  donation_amount: number;
  campaign_id: number;
  created_at: string;
}

// Helper functions to convert database rows to typed objects
function rowToCampaign(row: Row): Campaign {
  return {
    id: row.id as number,
    name: row.name as string,
    goal_amount: row.goal_amount as number,
    current_amount: row.current_amount as number,
    description: row.description as string | undefined,
    created_at: row.created_at as string,
  };
}

function rowToSupporter(row: Row): Supporter {
  return {
    id: row.id as number,
    name: row.name as string,
    donation_amount: row.donation_amount as number,
    campaign_id: row.campaign_id as number,
    created_at: row.created_at as string,
  };
}

export class CampaignQueries {
  static async getCampaign(id: number): Promise<Campaign | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM Campaigns WHERE id = ?',
      args: [id]
    });

    const row = result.rows[0];
    return row ? rowToCampaign(row) : null;
  }

  static async getAllCampaigns(): Promise<Campaign[]> {
    const result = await db.execute('SELECT * FROM Campaigns ORDER BY created_at DESC');
    return result.rows.map(rowToCampaign);
  }

  static async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    const result = await db.execute({
      sql: 'INSERT INTO Campaigns (name, goal_amount, current_amount, description, created_at) VALUES (?, ?, ?, ?, ?) RETURNING *',
      args: [campaign.name, campaign.goal_amount, campaign.current_amount, campaign.description || null, campaign.created_at]
    });

    return rowToCampaign(result.rows[0]);
  }

  static async updateCampaign(id: number, updates: Partial<Omit<Campaign, 'id'>>): Promise<Campaign | null> {
    const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    const result = await db.execute({
      sql: `UPDATE Campaigns SET ${setClauses} WHERE id = ? RETURNING *`,
      args: [...values, id]
    });

    const row = result.rows[0];
    return row ? rowToCampaign(row) : null;
  }
}

export class SupporterQueries {
  static async getSupporter(id: number): Promise<Supporter | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM Supporters WHERE id = ?',
      args: [id]
    });

    const row = result.rows[0];
    return row ? rowToSupporter(row) : null;
  }

  static async getSupportersByCampaign(campaignId: number): Promise<Supporter[]> {
    const result = await db.execute({
      sql: 'SELECT * FROM Supporters WHERE campaign_id = ? AND NOT (LOWER(name) = ? AND donation_amount = ?) ORDER BY id DESC',
      args: [campaignId, 'cole townsend', 575]
    });

    return result.rows.map(rowToSupporter);
  }

  static async getAllSupporters(): Promise<Supporter[]> {
    const result = await db.execute({
      sql: 'SELECT * FROM Supporters WHERE NOT (LOWER(name) = ? AND donation_amount = ?) ORDER BY id DESC',
      args: ['cole townsend', 575]
    });
    return result.rows.map(rowToSupporter);
  }

  static async createSupporter(supporter: Omit<Supporter, 'id'>): Promise<Supporter> {
    // Guard: prevent storing Cole Townsend's $575 donation in Turso
    const normalizedName = supporter.name.trim().toLowerCase();
    if (normalizedName === 'cole townsend' && supporter.donation_amount === 575) {
      console.warn('[SupporterQueries] Skipping insert for filtered supporter: Cole Townsend $575');
      throw new Error('Filtered supporter skipped: Cole Townsend $575');
    }

    const result = await db.execute({
      sql: 'INSERT INTO Supporters (name, donation_amount, campaign_id, created_at) VALUES (?, ?, ?, ?) RETURNING *',
      args: [supporter.name, supporter.donation_amount, supporter.campaign_id, supporter.created_at]
    });

    return rowToSupporter(result.rows[0]);
  }

  static async deleteSupporter(id: number): Promise<boolean> {
    const result = await db.execute({
      sql: 'DELETE FROM Supporters WHERE id = ?',
      args: [id]
    });

    return result.rowsAffected > 0;
  }

  static async deleteSupporters(ids: number[]): Promise<number> {
    let deleted = 0;

    for (const id of ids) {
      const success = await this.deleteSupporter(id);
      if (success) deleted++;
    }

    return deleted;
  }
}

export async function initializeTables() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      goal_amount INTEGER NOT NULL,
      current_amount INTEGER NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Supporters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      donation_amount INTEGER NOT NULL,
      campaign_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES Campaigns(id)
    )
  `);
}