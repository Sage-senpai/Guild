import { createClient, type Client, type InValue } from "@libsql/client";

// ── Turso / libSQL client ────────────────────────────────────────────────────
// When TURSO_DATABASE_URL is set → remote Turso database (persistent, shared)
// When unset → local file:data/guild.sqlite (dev/fallback)

const DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "file:data/guild.sqlite";
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "";

let _client: Client | null = null;
let _initialized = false;

function getClient(): Client {
  if (!_client) {
    _client = createClient({
      url: DATABASE_URL,
      authToken: AUTH_TOKEN || undefined,
    });
  }
  return _client;
}

// ── Model migrations ─────────────────────────────────────────────────────────

const MODEL_MIGRATIONS: ReadonlyArray<readonly [from: string, to: string]> = [
  ["deepseek/deepseek-r1:free", "deepseek/deepseek-r1-0528:free"],
  ["google/gemini-2.5-flash-image-preview", "google/gemini-2.5-flash-image"],
  ["black-forest-labs/flux.2-flex", "google/gemini-3-pro-image-preview"],
  ["black-forest-labs/flux.2-pro", "openai/gpt-5-image-mini"],
  ["sourceful/riverflow-v2-standard-preview", "openai/gpt-5-image-mini"],
  ["qwen/qwen2.5-vl-32b-instruct:free", "qwen/qwen2.5-vl-32b-instruct"],
  ["qwen/qwen2.5-vl-72b-instruct:free", "qwen/qwen2.5-vl-72b-instruct"],
  ["meta-llama/llama-3.2-11b-vision-instruct:free", "meta-llama/llama-3.2-11b-vision-instruct"],
  ["moonshotai/kimi-vl-a3b-thinking:free", "moonshotai/kimi-k2"],
  ["qwen/qwen-2.5-14b-instruct", "qwen/qwen3-14b"],
];

// ── Demo seed agents ─────────────────────────────────────────────────────────

const DEMO_AGENTS = [
  { name: "Viral Hook Architect", description: "Crafts viral hooks, CTAs, and launch copy in seconds.", category: "Marketing", model: "meta-llama/llama-3.2-3b-instruct:free", systemPrompt: "You are a marketing copywriter who creates punchy hooks and CTAs tailored to the user's audience.", pricePerRun: 0.02, cardGradient: "sunset" },
  { name: "Pull Request Reviewer", description: "Reviews diffs, flags risks, and suggests fixes.", category: "Coding", model: "meta-llama/llama-3.3-70b-instruct:free", systemPrompt: "You are a senior engineer reviewing pull requests for correctness, security, and clarity.", pricePerRun: 0.03, cardGradient: "ember" },
  { name: "Socratic Tutor", description: "Guides learners with questions, explanations, and quizzes.", category: "Education", model: "google/gemma-3-27b-it:free", systemPrompt: "You are a patient tutor who teaches by asking guiding questions and giving concise explanations.", pricePerRun: 0.02, cardGradient: "aurora" },
  { name: "Focus Sprint Coach", description: "Turns goals into focused 25-minute sprint plans.", category: "Productivity", model: "mistralai/mistral-small-3.1-24b-instruct:free", systemPrompt: "You are a productivity coach who turns goals into time-boxed action plans and checklists.", pricePerRun: 0.015, cardGradient: "ocean" },
  { name: "Market Intel Scout", description: "Summarizes competitor moves and trend signals.", category: "Research", model: "deepseek/deepseek-r1-0528:free", systemPrompt: "You are a research analyst summarizing market signals, competitor activity, and key takeaways.", pricePerRun: 0.04, cardGradient: "cosmic" },
  { name: "Brand Moodboarder", description: "Generates visual style directions and moodboard prompts.", category: "Design", model: "google/gemini-3-pro-image-preview", systemPrompt: "You are a creative director who defines moodboards, palettes, and visual directions for brands.", pricePerRun: 0.05, cardGradient: "sunset" },
  { name: "Receipt Vision Auditor", description: "Inspects receipts and flags anomalies or missing fields.", category: "Finance", model: "qwen/qwen2.5-vl-32b-instruct", systemPrompt: "You analyze receipts and invoices, extracting key fields and spotting inconsistencies.", pricePerRun: 0.03, cardGradient: "ember" },
  { name: "All-Purpose Concierge", description: "Handles everyday tasks, brainstorming, and quick answers.", category: "General", model: "openrouter/free", systemPrompt: "You are a versatile assistant who handles daily requests with clarity and brevity.", pricePerRun: 0.01, cardGradient: "aurora" },
  { name: "Landing Page Critic", description: "Audits landing pages and suggests conversion-focused fixes.", category: "Marketing", model: "mistralai/mistral-small-3.1-24b-instruct:free", systemPrompt: "You are a conversion copy and UX expert. Review landing pages and provide prioritized fixes.", pricePerRun: 0.025, cardGradient: "ember" },
  { name: "SQL Query Fixer", description: "Debugs SQL errors and rewrites inefficient queries.", category: "Coding", model: "meta-llama/llama-3.3-70b-instruct:free", systemPrompt: "You are a SQL performance specialist. Fix broken SQL and suggest faster alternatives.", pricePerRun: 0.03, cardGradient: "ocean" },
  { name: "Exam Revision Planner", description: "Builds revision schedules and practice drills for any subject.", category: "Education", model: "google/gemma-3-27b-it:free", systemPrompt: "You are a study planner. Break exam prep into realistic daily tasks with recall practice.", pricePerRun: 0.018, cardGradient: "aurora" },
  { name: "Founder Pitch Polisher", description: "Turns rough startup ideas into clear investor-ready pitches.", category: "Business", model: "deepseek/deepseek-r1-0528:free", systemPrompt: "You are a startup advisor helping founders improve story, traction framing, and pitch clarity.", pricePerRun: 0.035, cardGradient: "cosmic" },
] as const;

// ── Schema initialization ────────────────────────────────────────────────────

async function initializeSchema(client: Client): Promise<void> {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      wallet_address TEXT NOT NULL UNIQUE,
      username TEXT,
      credits REAL NOT NULL DEFAULT 100,
      integrity_score INTEGER NOT NULL DEFAULT 80
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'openrouter/free',
      system_prompt TEXT NOT NULL,
      storage_hash TEXT,
      manifest_uri TEXT,
      manifest_tx_hash TEXT,
      knowledge_uri TEXT,
      knowledge_tx_hash TEXT,
      card_image_data_url TEXT,
      card_gradient TEXT NOT NULL DEFAULT 'aurora',
      knowledge_local_path TEXT,
      knowledge_filename TEXT,
      creator_id INTEGER NOT NULL,
      price_per_run REAL NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      avg_rating REAL NOT NULL DEFAULT 0,
      total_reviews INTEGER NOT NULL DEFAULT 0,
      listing_status TEXT NOT NULL DEFAULT 'active',
      is_seed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      input TEXT NOT NULL,
      output TEXT NOT NULL,
      cost REAL NOT NULL,
      compute_mode TEXT NOT NULL DEFAULT 'mock',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS topup_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      rail TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      credits REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      provider_reference TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS credit_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      task_type TEXT NOT NULL DEFAULT 'instant',
      reward REAL NOT NULL,
      platform_fee REAL NOT NULL DEFAULT 0,
      poster_id INTEGER NOT NULL,
      assignee_id INTEGER,
      status TEXT NOT NULL DEFAULT 'open',
      proof_url TEXT,
      deadline TEXT NOT NULL,
      max_applicants INTEGER,
      max_workers INTEGER NOT NULL DEFAULT 1,
      completed_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY(poster_id) REFERENCES users(id),
      FOREIGN KEY(assignee_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS task_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(applicant_id) REFERENCES users(id),
      UNIQUE(task_id, applicant_id)
    );

    CREATE TABLE IF NOT EXISTS kilt_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      credential_hash TEXT NOT NULL,
      attestation_id TEXT NOT NULL,
      verified_at TEXT NOT NULL,
      expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agent_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      run_id INTEGER NOT NULL UNIQUE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(agent_id) REFERENCES agents(id),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(run_id) REFERENCES runs(id),
      UNIQUE(user_id, run_id)
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_type TEXT NOT NULL,
      badge_tier TEXT NOT NULL CHECK (badge_tier IN ('agent', 'human')),
      category TEXT,
      earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(user_id, badge_type, category)
    );

    CREATE TABLE IF NOT EXISTS task_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      reviewee_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('poster', 'worker')),
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id),
      FOREIGN KEY(reviewee_id) REFERENCES users(id),
      UNIQUE(task_id, reviewer_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      link TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  // Model migrations
  for (const [from, to] of MODEL_MIGRATIONS) {
    await client.execute({ sql: "UPDATE agents SET model = ? WHERE model = ?", args: [to, from] });
  }

  // Unpublish agents with incomplete storage
  await client.execute(
    `UPDATE agents SET published = 0
     WHERE published = 1
       AND (storage_hash IS NULL OR manifest_uri IS NULL OR manifest_tx_hash IS NULL)`,
  );

  // Seed demo user
  await client.execute({
    sql: "INSERT OR IGNORE INTO users (id, wallet_address, credits) VALUES (1, ?, 100)",
    args: [process.env.DEMO_WALLET_ADDRESS ?? "0xDEMO_WALLET_ADDRESS"],
  });

  await seedDemoAgents(client);
}

async function seedDemoAgents(client: Client): Promise<void> {
  for (const agent of DEMO_AGENTS) {
    const slug = agent.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const hash = `demo-${slug}-hash`;
    const uri = `ipfs://demo-${slug}-manifest`;
    const tx = `demo-${slug}-tx`;

    const existing = await client.execute({
      sql: "SELECT id FROM agents WHERE name = ?",
      args: [agent.name],
    });

    if (existing.rows.length > 0) {
      await client.execute({
        sql: `UPDATE agents SET published = 1, is_seed = 1,
              storage_hash = COALESCE(storage_hash, ?),
              manifest_uri = COALESCE(manifest_uri, ?),
              manifest_tx_hash = COALESCE(manifest_tx_hash, ?)
              WHERE id = ?`,
        args: [hash, uri, tx, existing.rows[0].id as number],
      });
    } else {
      await client.execute({
        sql: `INSERT INTO agents (
                name, description, category, model, system_prompt,
                storage_hash, manifest_uri, manifest_tx_hash,
                creator_id, price_per_run, published, card_gradient, is_seed
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, 1)`,
        args: [
          agent.name, agent.description, agent.category, agent.model,
          agent.systemPrompt, hash, uri, tx, agent.pricePerRun, agent.cardGradient,
        ],
      });
    }
  }
}

// ── Database access helpers ──────────────────────────────────────────────────
// Same API shape as before: withRead(fn), withWrite(fn), queryAll, queryOne
// The `db` parameter is now a libSQL Client. queryAll/queryOne are now async.

async function ensureInitialized(): Promise<Client> {
  const client = getClient();
  if (!_initialized) {
    _initialized = true;
    await initializeSchema(client);
  }
  return client;
}

export async function withRead<T>(fn: (db: Client) => T | Promise<T>): Promise<T> {
  const client = await ensureInitialized();
  return fn(client);
}

export async function withWrite<T>(fn: (db: Client) => T | Promise<T>): Promise<T> {
  const client = await ensureInitialized();
  return fn(client);
}

type SqlParam = InValue;

export async function queryAll<T>(db: Client, sql: string, params: SqlParam[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args: params });
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of result.columns) {
      obj[col] = row[col];
    }
    return obj as T;
  });
}

export async function queryOne<T>(db: Client, sql: string, params: SqlParam[] = []): Promise<T | null> {
  const rows = await queryAll<T>(db, sql, params);
  return rows[0] ?? null;
}

export async function getLastInsertId(db: Client): Promise<number> {
  const row = await queryOne<{ id: number }>(db, "SELECT last_insert_rowid() AS id");
  return row?.id ?? 0;
}

// Compatibility shim: replaces sql.js `db.run(sql, params)` calls in service files.
// Usage: import { dbRun } from "@/lib/db"; then replace db.run(...) with await dbRun(db, ...)
export async function dbRun(db: Client, sql: string, params: SqlParam[] = []): Promise<void> {
  await db.execute({ sql, args: params });
}
