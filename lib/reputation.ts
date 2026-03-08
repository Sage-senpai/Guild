import { queryAll, queryOne, withRead, withWrite } from "@/lib/db";
import {
  FREE_AGENT_SLOTS,
  AGENT_MODELS,
} from "@/lib/types";
import type {
  AgentBadge,
  AgentReviewRecord,
  AgentModel,
  HumanBadge,
  ListingFeeResult,
  UserBadgeRecord,
  UserReputationStats,
} from "@/lib/types";

// ── Row types ───────────────────────────────────────────────────────────────

type ReviewRow = {
  id: number;
  agent_id: number;
  user_id: number;
  run_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
};

type BadgeRow = {
  id: number;
  user_id: number;
  badge_type: string;
  badge_tier: "agent" | "human";
  category: string | null;
  earned_at: string;
};

function mapReview(row: ReviewRow): AgentReviewRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    userId: row.user_id,
    runId: row.run_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}

function mapBadge(row: BadgeRow): UserBadgeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    badgeType: row.badge_type,
    badgeTier: row.badge_tier,
    category: row.category,
    earnedAt: row.earned_at,
  };
}

// ── Free models (for listing fee calculation) ───────────────────────────────

const FREE_MODELS = new Set<string>(
  AGENT_MODELS.filter((m) => m.endsWith(":free") || m === "openrouter/free"),
);

// ── Listing Fee Calculation ─────────────────────────────────────────────────

export function calculateListingFee(params: {
  creatorAgentCount: number;
  systemPromptLength: number;
  pricePerRun: number;
  model: AgentModel;
}): ListingFeeResult {
  const { creatorAgentCount, systemPromptLength, pricePerRun, model } = params;

  if (creatorAgentCount < FREE_AGENT_SLOTS) {
    return { fee: 0, tier: "free", reason: `Free slot ${creatorAgentCount + 1}/${FREE_AGENT_SLOTS}` };
  }

  const isFreeModel = FREE_MODELS.has(model);
  const isHighPrice = pricePerRun > 0.5;
  const isLongPrompt = systemPromptLength > 2000;
  const isMediumPrompt = systemPromptLength > 500;

  if (isLongPrompt || (isHighPrice && !isFreeModel)) {
    return { fee: 10, tier: "enterprise", reason: "Enterprise tier — complex agent with premium model or high pricing" };
  }

  if (isMediumPrompt || !isFreeModel || pricePerRun > 0.1) {
    return { fee: 5, tier: "premium", reason: "Premium tier — mid-range agent" };
  }

  return { fee: 2, tier: "basic", reason: "Basic tier — simple agent with free model" };
}

// ── Review CRUD ─────────────────────────────────────────────────────────────

export async function submitReview(params: {
  agentId: number;
  userId: number;
  runId: number;
  rating: number;
  comment: string | null;
}): Promise<AgentReviewRecord> {
  return withWrite((db) => {
    const existingRun = queryOne<{ id: number; user_id: number; agent_id: number }>(
      db,
      "SELECT id, user_id, agent_id FROM runs WHERE id = ?",
      [params.runId],
    );
    if (!existingRun) throw new Error("Run not found");
    if (existingRun.user_id !== params.userId) throw new Error("You can only review your own runs");
    if (existingRun.agent_id !== params.agentId) throw new Error("Run does not belong to this agent");

    const existing = queryOne<{ id: number }>(
      db,
      "SELECT id FROM agent_reviews WHERE run_id = ?",
      [params.runId],
    );
    if (existing) throw new Error("You have already reviewed this run");

    db.run(
      `INSERT INTO agent_reviews (agent_id, user_id, run_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [params.agentId, params.userId, params.runId, params.rating, params.comment],
    );

    // Update cached avg_rating and total_reviews on agents table
    db.run(
      `UPDATE agents
       SET avg_rating = (SELECT ROUND(AVG(rating), 2) FROM agent_reviews WHERE agent_id = ?),
           total_reviews = (SELECT COUNT(*) FROM agent_reviews WHERE agent_id = ?)
       WHERE id = ?`,
      [params.agentId, params.agentId, params.agentId],
    );

    // Auto-flag/suspend based on rating
    const stats = queryOne<{ avg: number; cnt: number }>(
      db,
      "SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM agent_reviews WHERE agent_id = ?",
      [params.agentId],
    );
    if (stats && stats.cnt >= 10 && stats.avg < 1.5) {
      db.run("UPDATE agents SET listing_status = 'suspended' WHERE id = ?", [params.agentId]);
    } else if (stats && stats.cnt >= 5 && stats.avg < 2.0) {
      db.run("UPDATE agents SET listing_status = 'flagged' WHERE id = ?", [params.agentId]);
    }

    const reviewId = queryOne<{ id: number }>(
      db,
      "SELECT last_insert_rowid() AS id",
    );
    if (!reviewId) throw new Error("Failed to create review");
    const row = queryOne<ReviewRow>(
      db,
      "SELECT * FROM agent_reviews WHERE id = ?",
      [reviewId.id],
    );
    if (!row) throw new Error("Failed to create review");
    return mapReview(row);
  });
}

export async function listReviewsForAgent(agentId: number, limit = 25): Promise<AgentReviewRecord[]> {
  return withRead((db) => {
    const rows = queryAll<ReviewRow>(
      db,
      `SELECT * FROM agent_reviews WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?`,
      [agentId, limit],
    );
    return rows.map(mapReview);
  });
}

export async function getAgentRatingStats(agentId: number): Promise<{
  avgRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}> {
  return withRead((db) => {
    const stats = queryOne<{ avg: number | null; cnt: number }>(
      db,
      "SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM agent_reviews WHERE agent_id = ?",
      [agentId],
    );

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const rows = queryAll<{ rating: number; cnt: number }>(
      db,
      "SELECT rating, COUNT(*) AS cnt FROM agent_reviews WHERE agent_id = ? GROUP BY rating",
      [agentId],
    );
    for (const r of rows) {
      distribution[r.rating] = r.cnt;
    }

    return {
      avgRating: Number(stats?.avg ?? 0),
      totalReviews: stats?.cnt ?? 0,
      distribution,
    };
  });
}

// ── Badge Computation ───────────────────────────────────────────────────────

export async function computeAndAwardBadges(userId: number): Promise<UserBadgeRecord[]> {
  return withWrite((db) => {
    const awarded: UserBadgeRecord[] = [];

    function awardBadge(badgeType: string, tier: "agent" | "human", category: string | null = null) {
      const existing = queryOne<{ id: number }>(
        db,
        "SELECT id FROM user_badges WHERE user_id = ? AND badge_type = ? AND (category = ? OR (category IS NULL AND ? IS NULL))",
        [userId, badgeType, category, category],
      );
      if (existing) return;

      db.run(
        "INSERT INTO user_badges (user_id, badge_type, badge_tier, category) VALUES (?, ?, ?, ?)",
        [userId, badgeType, tier, category],
      );
      const row = queryOne<BadgeRow>(
        db,
        "SELECT * FROM user_badges WHERE user_id = ? AND badge_type = ? AND (category = ? OR (category IS NULL AND ? IS NULL))",
        [userId, badgeType, category, category],
      );
      if (row) awarded.push(mapBadge(row));
    }

    // ── Agent badges ──

    const publishedCount = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM agents WHERE creator_id = ? AND published = 1",
      [userId],
    );

    // Check reviews across all the user's agents
    const creatorReviewStats = queryOne<{ avg: number | null; cnt: number }>(
      db,
      `SELECT AVG(r.rating) AS avg, COUNT(*) AS cnt
       FROM agent_reviews r
       JOIN agents a ON a.id = r.agent_id
       WHERE a.creator_id = ?`,
      [userId],
    );

    if (creatorReviewStats && creatorReviewStats.cnt >= 10 && (creatorReviewStats.avg ?? 0) >= 4.0) {
      awardBadge("rising_star", "agent");
    }
    if (creatorReviewStats && creatorReviewStats.cnt >= 25 && (creatorReviewStats.avg ?? 0) >= 4.5) {
      awardBadge("top_rated", "agent");
    }
    if ((publishedCount?.cnt ?? 0) >= 5) {
      awardBadge("power_creator", "agent");
    }

    // Verified creator — user has valid KILT credential
    const kilt = queryOne<{ id: number }>(
      db,
      "SELECT id FROM kilt_credentials WHERE user_id = ?",
      [userId],
    );
    if (kilt) {
      awardBadge("verified_creator", "agent");
      awardBadge("verified_human", "human");
    }

    // ── Human badges ──

    const tasksCompleted = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status = 'approved'",
      [userId],
    );
    const cnt = tasksCompleted?.cnt ?? 0;

    if (cnt >= 1) awardBadge("first_task", "human");
    if (cnt >= 10) awardBadge("reliable", "human");

    // Specialist — 20+ tasks in one category
    const categoryStats = queryAll<{ category: string; cnt: number }>(
      db,
      `SELECT category, COUNT(*) AS cnt
       FROM tasks
       WHERE assignee_id = ? AND status = 'approved'
       GROUP BY category
       HAVING cnt >= 20`,
      [userId],
    );
    for (const cat of categoryStats) {
      awardBadge("specialist", "human", cat.category);
    }

    // Top worker — 50+ tasks, 90%+ approval rate
    const totalAssigned = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status IN ('approved', 'disputed')",
      [userId],
    );
    const totalDone = totalAssigned?.cnt ?? 0;
    if (cnt >= 50 && totalDone > 0 && (cnt / totalDone) >= 0.9) {
      awardBadge("top_worker", "human");
    }

    return awarded;
  });
}

export async function getUserBadges(userId: number): Promise<UserBadgeRecord[]> {
  return withRead((db) => {
    const rows = queryAll<BadgeRow>(
      db,
      "SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC",
      [userId],
    );
    return rows.map(mapBadge);
  });
}

// ── Integrity Score ─────────────────────────────────────────────────────────

export async function recalculateIntegrity(userId: number): Promise<number> {
  return withWrite((db) => {
    // Base score
    let score = 80;

    const approved = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status = 'approved'",
      [userId],
    );
    const disputed = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status = 'disputed'",
      [userId],
    );
    const expired = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status = 'expired'",
      [userId],
    );

    // +1 per approved task (max contribution: +20)
    score += Math.min(approved?.cnt ?? 0, 20);

    // -5 per disputed task
    score -= (disputed?.cnt ?? 0) * 5;

    // -2 per expired assigned task
    score -= (expired?.cnt ?? 0) * 2;

    // Clamp 0–100
    score = Math.max(0, Math.min(100, score));

    db.run("UPDATE users SET integrity_score = ? WHERE id = ?", [score, userId]);
    return score;
  });
}

// ── User Reputation Stats ───────────────────────────────────────────────────

export async function getUserReputation(userId: number): Promise<UserReputationStats> {
  return withRead((db) => {
    const user = queryOne<{ integrity_score: number }>(
      db,
      "SELECT integrity_score FROM users WHERE id = ?",
      [userId],
    );

    const tasksCompleted = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status = 'approved'",
      [userId],
    );
    const tasksDisputed = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE assignee_id = ? AND status = 'disputed'",
      [userId],
    );
    const tasksPosted = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM tasks WHERE poster_id = ?",
      [userId],
    );
    const agentsPublished = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM agents WHERE creator_id = ? AND published = 1",
      [userId],
    );

    const badges = queryAll<BadgeRow>(
      db,
      "SELECT * FROM user_badges WHERE user_id = ?",
      [userId],
    );

    const agentBadges: AgentBadge[] = [];
    const humanBadges: Array<{ badge: HumanBadge; category: string | null }> = [];
    for (const b of badges) {
      if (b.badge_tier === "agent") {
        agentBadges.push(b.badge_type as AgentBadge);
      } else {
        humanBadges.push({ badge: b.badge_type as HumanBadge, category: b.category });
      }
    }

    const catRows = queryAll<{ category: string; cnt: number }>(
      db,
      `SELECT category, COUNT(*) AS cnt
       FROM tasks
       WHERE assignee_id = ? AND status = 'approved'
       GROUP BY category`,
      [userId],
    );
    const categoryExpertise: Record<string, number> = {};
    for (const r of catRows) {
      categoryExpertise[r.category] = r.cnt;
    }

    return {
      integrityScore: user?.integrity_score ?? 80,
      tasksCompleted: tasksCompleted?.cnt ?? 0,
      tasksDisputed: tasksDisputed?.cnt ?? 0,
      tasksPosted: tasksPosted?.cnt ?? 0,
      agentsPublished: agentsPublished?.cnt ?? 0,
      agentBadges,
      humanBadges,
      categoryExpertise,
    };
  });
}

// ── Agent Listing Slot Check ────────────────────────────────────────────────

export async function getCreatorAgentCount(creatorId: number): Promise<number> {
  return withRead((db) => {
    const row = queryOne<{ cnt: number }>(
      db,
      "SELECT COUNT(*) AS cnt FROM agents WHERE creator_id = ?",
      [creatorId],
    );
    return row?.cnt ?? 0;
  });
}

// ── Agent Quality Badges (for display) ──────────────────────────────────────

export function getAgentBadges(agent: {
  avgRating: number;
  totalReviews: number;
  creatorBadges: AgentBadge[];
}): AgentBadge[] {
  const badges: AgentBadge[] = [];

  if (agent.totalReviews >= 10 && agent.avgRating >= 4.0) badges.push("rising_star");
  if (agent.totalReviews >= 25 && agent.avgRating >= 4.5) badges.push("top_rated");

  if (agent.creatorBadges.includes("verified_creator")) badges.push("verified_creator");
  if (agent.creatorBadges.includes("power_creator")) badges.push("power_creator");

  return badges;
}
