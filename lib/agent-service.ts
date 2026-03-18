import fs from "node:fs/promises";
import crypto from "node:crypto";

import { dbRun, getLastInsertId, queryAll, queryOne, withRead, withWrite } from "@/lib/db";
import { AGENT_MODELS } from "@/lib/types";
import type {
  AgentCardGradient,
  AgentListingStatus,
  AgentModel,
  AgentRecord,
  CreditLedgerKind,
  CreditLedgerRecord,
  RunRecord,
  TopupOrderRecord,
  TopupRail,
  TopupStatus,
  UserRecord,
} from "@/lib/types";

export const DEMO_USER_ID = 1;

type AgentRow = {
  id: number;
  name: string;
  description: string;
  category: string;
  model: AgentModel;
  system_prompt: string;
  price_per_run: number;
  creator_id: number;
  storage_hash: string | null;
  manifest_uri: string | null;
  manifest_tx_hash: string | null;
  knowledge_uri: string | null;
  knowledge_tx_hash: string | null;
  card_image_data_url: string | null;
  card_gradient: AgentCardGradient;
  knowledge_local_path: string | null;
  knowledge_filename: string | null;
  published: number;
  avg_rating: number;
  total_reviews: number;
  listing_status: AgentListingStatus;
  created_at: string;
};

type RunRow = {
  id: number;
  user_id: number;
  agent_id: number;
  input: string;
  output: string;
  cost: number;
  compute_mode: string;
  created_at: string;
};

type UserRow = {
  id: number;
  wallet_address: string;
  credits: number;
  integrity_score: number;
};

type CreditLedgerRow = {
  id: number;
  user_id: number;
  kind: CreditLedgerKind;
  amount: number;
  reference_type: string | null;
  reference_id: number | null;
  note: string | null;
  created_at: string;
};

type TopupOrderRow = {
  id: number;
  user_id: number;
  rail: TopupRail;
  currency: string;
  amount: number;
  credits: number;
  status: TopupStatus;
  provider_reference: string;
  created_at: string;
  completed_at: string | null;
};

function mapAgent(row: AgentRow): AgentRecord {
  const model = AGENT_MODELS.includes(row.model) ? row.model : AGENT_MODELS[0];

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    model,
    systemPrompt: row.system_prompt,
    pricePerRun: Number(row.price_per_run),
    creatorId: row.creator_id,
    storageHash: row.storage_hash,
    manifestUri: row.manifest_uri,
    manifestTxHash: row.manifest_tx_hash,
    knowledgeUri: row.knowledge_uri,
    knowledgeTxHash: row.knowledge_tx_hash,
    cardImageDataUrl: row.card_image_data_url,
    cardGradient: row.card_gradient,
    knowledgeLocalPath: row.knowledge_local_path,
    knowledgeFilename: row.knowledge_filename,
    published:
      row.published === 1 &&
      Boolean(row.storage_hash) &&
      Boolean(row.manifest_uri) &&
      Boolean(row.manifest_tx_hash),
    avgRating: Number(row.avg_rating ?? 0),
    totalReviews: Number(row.total_reviews ?? 0),
    listingStatus: (row.listing_status as AgentListingStatus) ?? "active",
    createdAt: row.created_at,
  };
}

function mapRun(row: RunRow): RunRecord {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    input: row.input,
    output: row.output,
    cost: Number(row.cost),
    computeMode: row.compute_mode,
    createdAt: row.created_at,
  };
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    credits: Number(row.credits),
    integrityScore: Number(row.integrity_score ?? 80),
  };
}

function mapCreditLedger(row: CreditLedgerRow): CreditLedgerRecord {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    amount: Number(row.amount),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapTopupOrder(row: TopupOrderRow): TopupOrderRecord {
  return {
    id: row.id,
    userId: row.user_id,
    rail: row.rail,
    currency: row.currency,
    amount: Number(row.amount),
    credits: Number(row.credits),
    status: row.status,
    providerReference: row.provider_reference,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export async function listAgents(options: {
  search?: string;
  category?: string;
  includeDrafts?: boolean;
} = {}): Promise<AgentRecord[]> {
  const where: string[] = [];
  const params: Array<number | string | Uint8Array | null> = [];

  // Never show suspended agents in public listings
  where.push("listing_status != 'suspended'");

  if (!options.includeDrafts) {
    where.push(
      "published = 1 AND storage_hash IS NOT NULL AND manifest_uri IS NOT NULL AND manifest_tx_hash IS NOT NULL",
    );
  }

  if (options.search?.trim()) {
    where.push("(name LIKE ? OR description LIKE ?)");
    const q = `%${options.search.trim()}%`;
    params.push(q, q);
  }

  if (options.category?.trim()) {
    where.push("category = ?");
    params.push(options.category.trim());
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  return withRead(async (db) => {
    const rows = await queryAll<AgentRow>(
      db,
      `
        SELECT *
        FROM agents
        ${whereSql}
        ORDER BY
          CASE WHEN avg_rating >= 4.5 AND total_reviews >= 10 THEN 0 ELSE 1 END,
          avg_rating DESC,
          total_reviews DESC,
          created_at DESC;
      `,
      params,
    );
    return rows.map(mapAgent);
  });
}

export async function listAgentsByCreator(creatorId: number): Promise<AgentRecord[]> {
  return withRead(async (db) => {
    const rows = await queryAll<AgentRow>(
      db,
      `
        SELECT *
        FROM agents
        WHERE creator_id = ?
          AND COALESCE(is_seed, 0) = 0
        ORDER BY created_at DESC;
      `,
      [creatorId],
    );
    return rows.map(mapAgent);
  });
}

export async function getAgentById(id: number): Promise<AgentRecord | null> {
  return withRead(async (db) => {
    const row = await queryOne<AgentRow>(db, "SELECT * FROM agents WHERE id = ?", [id]);
    return row ? mapAgent(row) : null;
  });
}

export async function createAgent(input: {
  name: string;
  description: string;
  category: string;
  model: AgentModel;
  systemPrompt: string;
  pricePerRun: number;
  cardImageDataUrl: string | null;
  cardGradient: AgentCardGradient;
  creatorId?: number;
  listingFee?: number;
}): Promise<AgentRecord> {
  return withWrite(async (db) => {
    const creatorId = input.creatorId ?? DEMO_USER_ID;
    const fee = input.listingFee ?? 0;

    // Deduct listing fee if applicable
    if (fee > 0) {
      const user = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [creatorId]);
      if (!user || Number(user.credits) < fee) {
        throw new Error("INSUFFICIENT_CREDITS");
      }
      await dbRun(db, "UPDATE users SET credits = credits - ? WHERE id = ?", [fee, creatorId]);
      await dbRun(db,
        `INSERT INTO credit_ledger (user_id, kind, amount, reference_type, note)
         VALUES (?, 'run_debit', ?, 'agent_listing', ?)`,
        [creatorId, -fee, `Agent listing fee`],
      );
    }

    await dbRun(db,
      `
        INSERT INTO agents (
          name,
          description,
          category,
          model,
          system_prompt,
          card_image_data_url,
          card_gradient,
          creator_id,
          price_per_run
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        input.name,
        input.description,
        input.category,
        input.model,
        input.systemPrompt,
        input.cardImageDataUrl,
        input.cardGradient,
        creatorId,
        input.pricePerRun,
      ],
    );

    const id = await getLastInsertId(db);
    const row = await queryOne<AgentRow>(db, "SELECT * FROM agents WHERE id = ?", [id]);
    if (!row) {
      throw new Error("Failed to create agent");
    }
    return mapAgent(row);
  });
}

export async function attachKnowledgeFile(
  agentId: number,
  knowledgeLocalPath: string,
  knowledgeFilename: string,
): Promise<void> {
  await withWrite(async (db) => {
    await dbRun(db,
      `
        UPDATE agents
        SET knowledge_local_path = ?,
            knowledge_filename = ?
        WHERE id = ?;
      `,
      [knowledgeLocalPath, knowledgeFilename, agentId],
    );
  });
}

export async function applyPublishResult(params: {
  agentId: number;
  storageHash: string;
  manifestUri: string;
  manifestTxHash: string | null;
  knowledgeUri: string | null;
  knowledgeTxHash: string | null;
}): Promise<AgentRecord> {
  return withWrite(async (db) => {
    await dbRun(db,
      `
        UPDATE agents
        SET storage_hash = ?,
            manifest_uri = ?,
            manifest_tx_hash = ?,
            knowledge_uri = ?,
            knowledge_tx_hash = ?,
            published = 1
        WHERE id = ?;
      `,
      [
        params.storageHash,
        params.manifestUri,
        params.manifestTxHash,
        params.knowledgeUri,
        params.knowledgeTxHash,
        params.agentId,
      ],
    );

    const row = await queryOne<AgentRow>(db, "SELECT * FROM agents WHERE id = ?", [params.agentId]);
    if (!row) {
      throw new Error("Agent not found after publish");
    }

    return mapAgent(row);
  });
}

export async function getUserById(userId: number): Promise<UserRecord | null> {
  return withRead(async (db) => {
    const row = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [userId]);
    return row ? mapUser(row) : null;
  });
}

/** Find user by wallet or create with 100 starter credits. Returns user ID. */
export async function getOrCreateUser(walletAddress: string): Promise<number> {
  return withWrite(async (db) => {
    const addr = walletAddress.toLowerCase();
    const existing = await queryOne<{ id: number }>(
      db,
      "SELECT id FROM users WHERE wallet_address = ?",
      [addr],
    );
    if (existing) return existing.id;

    await dbRun(db, "INSERT INTO users (wallet_address, credits) VALUES (?, 100)", [addr]);
    return await getLastInsertId(db);
  });
}

/** Resolve user from x-wallet-address header. Auto-creates on first visit. */
export async function resolveUserId(request: Request): Promise<number> {
  const wallet = request.headers.get("x-wallet-address");
  if (wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return getOrCreateUser(wallet);
  }
  return DEMO_USER_ID;
}

export async function listRunsForAgent(agentId: number): Promise<RunRecord[]> {
  return withRead(async (db) => {
    const rows = await queryAll<RunRow>(
      db,
      `
        SELECT *
        FROM runs
        WHERE agent_id = ?
        ORDER BY created_at DESC
        LIMIT 25;
      `,
      [agentId],
    );
    return rows.map(mapRun);
  });
}

export async function listRecentRuns(limit = 40): Promise<RunRecord[]> {
  return withRead(async (db) => {
    const rows = await queryAll<RunRow>(
      db,
      `
        SELECT *
        FROM runs
        ORDER BY created_at DESC
        LIMIT ?;
      `,
      [limit],
    );
    return rows.map(mapRun);
  });
}

export async function runAgentForUser(params: {
  userId: number;
  agentId: number;
  input: string;
  output: string;
  computeMode: string;
}): Promise<{ run: RunRecord; user: UserRecord }> {
  return withWrite(async (db) => {
    const user = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [params.userId]);
    if (!user) {
      throw new Error("User not found");
    }

    const agent = await queryOne<AgentRow>(db, "SELECT * FROM agents WHERE id = ?", [params.agentId]);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const price = Number(agent.price_per_run);
    const credits = Number(user.credits);
    if (credits < price) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    await dbRun(db, "UPDATE users SET credits = credits - ? WHERE id = ?", [price, params.userId]);
    await dbRun(db,
      `
        INSERT INTO runs (user_id, agent_id, input, output, cost, compute_mode)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
      [params.userId, params.agentId, params.input, params.output, price, params.computeMode],
    );

    const runId = await getLastInsertId(db);
    await dbRun(db,
      `
        INSERT INTO credit_ledger (user_id, kind, amount, reference_type, reference_id, note)
        VALUES (?, 'run_debit', ?, 'run', ?, ?);
      `,
      [params.userId, -price, runId, `Agent ${params.agentId} run`],
    );

    const runRow = await queryOne<RunRow>(db, "SELECT * FROM runs WHERE id = ?", [runId]);
    const userRow = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [params.userId]);

    if (!runRow || !userRow) {
      throw new Error("Failed to persist run");
    }

    return { run: mapRun(runRow), user: mapUser(userRow) };
  });
}

export async function listCreditLedgerForUser(userId: number, limit = 50): Promise<CreditLedgerRecord[]> {
  return withRead(async (db) => {
    const rows = await queryAll<CreditLedgerRow>(
      db,
      `
        SELECT *
        FROM credit_ledger
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?;
      `,
      [userId, limit],
    );
    return rows.map(mapCreditLedger);
  });
}

export async function listTopupOrdersForUser(userId: number, limit = 50): Promise<TopupOrderRecord[]> {
  return withRead(async (db) => {
    const rows = await queryAll<TopupOrderRow>(
      db,
      `
        SELECT *
        FROM topup_orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?;
      `,
      [userId, limit],
    );
    return rows.map(mapTopupOrder);
  });
}

export async function createTopupOrder(params: {
  userId: number;
  rail: TopupRail;
  currency: string;
  amount: number;
}): Promise<TopupOrderRecord> {
  return withWrite(async (db) => {
    const providerReference = `topup_${crypto.randomUUID()}`;
    await dbRun(db,
      `
        INSERT INTO topup_orders (user_id, rail, currency, amount, credits, status, provider_reference)
        VALUES (?, ?, ?, ?, ?, 'pending', ?);
      `,
      [params.userId, params.rail, params.currency, params.amount, params.amount, providerReference],
    );

    const id = await getLastInsertId(db);
    const row = await queryOne<TopupOrderRow>(db, "SELECT * FROM topup_orders WHERE id = ?", [id]);
    if (!row) {
      throw new Error("Failed to create top-up order");
    }
    return mapTopupOrder(row);
  });
}

export async function completeOnchainTopup(params: {
  userId: number;
  txHash: string;
  fromAddress: string;
  chainId: number;
  currency: string;
  amount: number;
}): Promise<{ order: TopupOrderRecord; user: UserRecord; created: boolean }> {
  return withWrite(async (db) => {
    const user = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [params.userId]);
    if (!user) {
      throw new Error("User not found");
    }

    const existing = await queryOne<TopupOrderRow>(
      db,
      "SELECT * FROM topup_orders WHERE provider_reference = ?",
      [params.txHash],
    );

    if (existing) {
      return {
        order: mapTopupOrder(existing),
        user: mapUser(user),
        created: false,
      };
    }

    await dbRun(db,
      `
        INSERT INTO topup_orders (
          user_id,
          rail,
          currency,
          amount,
          credits,
          status,
          provider_reference,
          completed_at
        )
        VALUES (?, 'native', ?, ?, ?, 'completed', ?, CURRENT_TIMESTAMP);
      `,
      [params.userId, params.currency, params.amount, params.amount, params.txHash],
    );

    const topupId = await getLastInsertId(db);

    await dbRun(db, "UPDATE users SET credits = credits + ? WHERE id = ?", [params.amount, params.userId]);
    await dbRun(db,
      `
        INSERT INTO credit_ledger (user_id, kind, amount, reference_type, reference_id, note)
        VALUES (?, 'topup', ?, 'topup_order', ?, ?);
      `,
      [
        params.userId,
        params.amount,
        topupId,
        `Onchain top-up (${params.currency}) on chain ${params.chainId} from ${params.fromAddress}`,
      ],
    );

    const order = await queryOne<TopupOrderRow>(db, "SELECT * FROM topup_orders WHERE id = ?", [topupId]);
    const updatedUser = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [params.userId]);

    if (!order || !updatedUser) {
      throw new Error("Failed to persist onchain top-up");
    }

    return {
      order: mapTopupOrder(order),
      user: mapUser(updatedUser),
      created: true,
    };
  });
}

export async function getTopupOrderById(id: number): Promise<TopupOrderRecord | null> {
  return withRead(async (db) => {
    const row = await queryOne<TopupOrderRow>(db, "SELECT * FROM topup_orders WHERE id = ?", [id]);
    return row ? mapTopupOrder(row) : null;
  });
}

export async function reconcileTopupOrder(params: {
  providerReference: string;
  status: "completed" | "failed";
  note?: string;
}): Promise<TopupOrderRecord> {
  return withWrite(async (db) => {
    const order = await queryOne<TopupOrderRow>(
      db,
      "SELECT * FROM topup_orders WHERE provider_reference = ?",
      [params.providerReference],
    );
    if (!order) {
      throw new Error("Top-up order not found");
    }

    if (order.status === "completed" || order.status === "failed") {
      return mapTopupOrder(order);
    }

    if (params.status === "completed") {
      await dbRun(db, "UPDATE users SET credits = credits + ? WHERE id = ?", [order.credits, order.user_id]);
      await dbRun(db,
        `
          INSERT INTO credit_ledger (user_id, kind, amount, reference_type, reference_id, note)
          VALUES (?, 'topup', ?, 'topup_order', ?, ?);
        `,
        [order.user_id, order.credits, order.id, params.note ?? `${order.rail} top-up`],
      );
      await dbRun(db,
        `
          UPDATE topup_orders
          SET status = 'completed',
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?;
        `,
        [order.id],
      );
    } else {
      await dbRun(db,
        `
          UPDATE topup_orders
          SET status = 'failed',
              completed_at = CURRENT_TIMESTAMP
          WHERE id = ?;
        `,
        [order.id],
      );
    }

    const updated = await queryOne<TopupOrderRow>(db, "SELECT * FROM topup_orders WHERE id = ?", [order.id]);
    if (!updated) {
      throw new Error("Top-up order missing after reconciliation");
    }
    return mapTopupOrder(updated);
  });
}

export async function getCreditStats(userId: number): Promise<{
  remaining: number;
  used: number;
  toppedUp: number;
}> {
  return withRead(async (db) => {
    const user = await queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      throw new Error("User not found");
    }

    const usedRow = await queryOne<{ total: number | null }>(
      db,
      "SELECT SUM(cost) AS total FROM runs WHERE user_id = ?",
      [userId],
    );
    const toppedUpRow = await queryOne<{ total: number | null }>(
      db,
      "SELECT SUM(amount) AS total FROM credit_ledger WHERE user_id = ? AND kind = 'topup'",
      [userId],
    );

    return {
      remaining: Number(user.credits),
      used: Number(usedRow?.total ?? 0),
      toppedUp: Number(toppedUpRow?.total ?? 0),
    };
  });
}

export async function readKnowledgeFromLocal(agent: AgentRecord): Promise<string> {
  if (!agent.knowledgeLocalPath) {
    return "";
  }
  const content = await fs.readFile(agent.knowledgeLocalPath);
  return content.toString("utf-8");
}
