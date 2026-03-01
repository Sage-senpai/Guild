import { getLastInsertId, queryAll, queryOne, withRead, withWrite } from "@/lib/db";
import { TASK_CATEGORIES } from "@/lib/types";
import type {
  KiltCredentialRecord,
  TaskApplicationRecord,
  TaskCategory,
  TaskRecord,
  TaskStatus,
  TaskType,
  UserRecord,
} from "@/lib/types";

export const TASK_PLATFORM_FEE_BPS = 500; // 5%
export const TASK_MAX_REWARD = 50;
export const TASK_MIN_REWARD = 0.5;
export const TASK_AUTO_APPROVE_HOURS = 48;

// ── Row types ────────────────────────────────────────────────────────────────

type TaskRow = {
  id: number;
  title: string;
  description: string;
  category: string;
  task_type: string;
  reward: number;
  platform_fee: number;
  poster_id: number;
  assignee_id: number | null;
  status: string;
  proof_url: string | null;
  deadline: string;
  max_applicants: number | null;
  created_at: string;
  completed_at: string | null;
};

type TaskApplicationRow = {
  id: number;
  task_id: number;
  applicant_id: number;
  message: string | null;
  status: string;
  created_at: string;
};

type KiltCredentialRow = {
  id: number;
  user_id: number;
  credential_hash: string;
  attestation_id: string;
  verified_at: string;
  expires_at: string | null;
  created_at: string;
};

type UserRow = {
  id: number;
  wallet_address: string;
  credits: number;
};

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapTask(row: TaskRow): TaskRecord {
  const category = TASK_CATEGORIES.includes(row.category as TaskCategory)
    ? (row.category as TaskCategory)
    : "other";

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category,
    taskType: (row.task_type as TaskType) ?? "instant",
    reward: Number(row.reward),
    platformFee: Number(row.platform_fee),
    posterId: row.poster_id,
    assigneeId: row.assignee_id,
    status: (row.status as TaskStatus) ?? "open",
    proofUrl: row.proof_url,
    deadline: row.deadline,
    maxApplicants: row.max_applicants,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapApplication(row: TaskApplicationRow): TaskApplicationRecord {
  return {
    id: row.id,
    taskId: row.task_id,
    applicantId: row.applicant_id,
    message: row.message,
    status: row.status as "pending" | "selected" | "rejected",
    createdAt: row.created_at,
  };
}

function mapKilt(row: KiltCredentialRow): KiltCredentialRecord {
  return {
    id: row.id,
    userId: row.user_id,
    credentialHash: row.credential_hash,
    attestationId: row.attestation_id,
    verifiedAt: row.verified_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function mapUser(row: UserRow): UserRecord {
  return { id: row.id, walletAddress: row.wallet_address, credits: Number(row.credits) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcFee(reward: number): number {
  return Math.round(reward * TASK_PLATFORM_FEE_BPS) / 10000;
}

// ── Task CRUD ────────────────────────────────────────────────────────────────

export async function listTasks(options: {
  category?: string;
  status?: string;
  taskType?: string;
  limit?: number;
  cursor?: number;
} = {}): Promise<TaskRecord[]> {
  const where: string[] = [];
  const params: Array<number | string | null> = [];

  if (options.status && options.status !== "all") {
    where.push("status = ?");
    params.push(options.status);
  } else if (!options.status) {
    where.push("status = 'open'");
  }

  if (options.category && options.category !== "all") {
    where.push("category = ?");
    params.push(options.category);
  }

  if (options.taskType && options.taskType !== "all") {
    where.push("task_type = ?");
    params.push(options.taskType);
  }

  if (options.cursor && options.cursor > 0) {
    where.push("id < ?");
    params.push(options.cursor);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const limit = options.limit ?? 20;
  params.push(limit);

  return withRead((db) => {
    const rows = queryAll<TaskRow>(
      db,
      `SELECT * FROM tasks ${whereSql} ORDER BY id DESC LIMIT ?`,
      params,
    );
    return rows.map(mapTask);
  });
}

export async function getTaskById(id: number): Promise<TaskRecord | null> {
  return withRead((db) => {
    const row = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [id]);
    return row ? mapTask(row) : null;
  });
}

export async function createTask(input: {
  title: string;
  description: string;
  category: TaskCategory;
  taskType: TaskType;
  reward: number;
  deadlineHours: number;
  maxApplicants?: number;
  posterId: number;
}): Promise<{ task: TaskRecord; user: UserRecord }> {
  const fee = calcFee(input.reward);
  const totalDeducted = input.reward + fee;

  const deadline = new Date(Date.now() + input.deadlineHours * 60 * 60 * 1000).toISOString();

  return withWrite((db) => {
    const poster = queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [input.posterId]);
    if (!poster) throw new Error("Poster not found");
    if (Number(poster.credits) < totalDeducted) throw new Error("INSUFFICIENT_CREDITS");

    // Reserve reward + fee from poster balance
    db.run("UPDATE users SET credits = credits - ? WHERE id = ?", [totalDeducted, input.posterId]);
    db.run(
      `INSERT INTO credit_ledger (user_id, kind, amount, reference_type, note)
       VALUES (?, 'task_reserve', ?, 'task', ?)`,
      [input.posterId, -totalDeducted, `Task created: ${input.title}`],
    );

    db.run(
      `INSERT INTO tasks (title, description, category, task_type, reward, platform_fee,
        poster_id, deadline, max_applicants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.description,
        input.category,
        input.taskType,
        input.reward,
        fee,
        input.posterId,
        deadline,
        input.maxApplicants ?? null,
      ],
    );

    const taskId = getLastInsertId(db);
    const taskRow = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    const updatedPoster = queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [input.posterId]);

    if (!taskRow || !updatedPoster) throw new Error("Failed to create task");

    return { task: mapTask(taskRow), user: mapUser(updatedPoster) };
  });
}

export async function claimTask(
  taskId: number,
  workerId: number,
): Promise<TaskRecord> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.status !== "open") throw new Error("TASK_NOT_OPEN");
    if (task.task_type !== "instant") throw new Error("TASK_NOT_INSTANT");
    if (task.poster_id === workerId) throw new Error("CANNOT_CLAIM_OWN_TASK");
    if (new Date(task.deadline) < new Date()) throw new Error("TASK_EXPIRED");

    db.run(
      "UPDATE tasks SET status = 'assigned', assignee_id = ? WHERE id = ?",
      [workerId, taskId],
    );

    const updated = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!updated) throw new Error("Failed to claim task");
    return mapTask(updated);
  });
}

// ── Apply-mode ───────────────────────────────────────────────────────────────

export async function applyForTask(
  taskId: number,
  applicantId: number,
  message?: string,
): Promise<TaskApplicationRecord> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.status !== "open") throw new Error("TASK_NOT_OPEN");
    if (task.task_type !== "apply") throw new Error("TASK_NOT_APPLY_MODE");
    if (task.poster_id === applicantId) throw new Error("CANNOT_APPLY_OWN_TASK");
    if (new Date(task.deadline) < new Date()) throw new Error("TASK_EXPIRED");

    const existing = queryOne<TaskApplicationRow>(
      db,
      "SELECT * FROM task_applications WHERE task_id = ? AND applicant_id = ?",
      [taskId, applicantId],
    );
    if (existing) throw new Error("ALREADY_APPLIED");

    // Check max applicants cap
    if (task.max_applicants) {
      const count = queryOne<{ n: number }>(
        db,
        "SELECT COUNT(*) AS n FROM task_applications WHERE task_id = ? AND status = 'pending'",
        [taskId],
      );
      if (count && count.n >= task.max_applicants) throw new Error("MAX_APPLICANTS_REACHED");
    }

    db.run(
      "INSERT INTO task_applications (task_id, applicant_id, message) VALUES (?, ?, ?)",
      [taskId, applicantId, message ?? null],
    );

    const appId = getLastInsertId(db);
    const app = queryOne<TaskApplicationRow>(db, "SELECT * FROM task_applications WHERE id = ?", [appId]);
    if (!app) throw new Error("Failed to create application");
    return mapApplication(app);
  });
}

export async function selectApplicant(
  taskId: number,
  applicationId: number,
  posterId: number,
): Promise<{ task: TaskRecord; application: TaskApplicationRecord }> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.poster_id !== posterId) throw new Error("NOT_TASK_POSTER");
    if (task.status !== "open") throw new Error("TASK_NOT_OPEN");

    const app = queryOne<TaskApplicationRow>(
      db,
      "SELECT * FROM task_applications WHERE id = ? AND task_id = ?",
      [applicationId, taskId],
    );
    if (!app) throw new Error("Application not found");
    if (app.status !== "pending") throw new Error("APPLICATION_NOT_PENDING");

    // Select this applicant
    db.run(
      "UPDATE task_applications SET status = 'selected' WHERE id = ?",
      [applicationId],
    );
    // Reject all others
    db.run(
      "UPDATE task_applications SET status = 'rejected' WHERE task_id = ? AND id != ?",
      [taskId, applicationId],
    );
    // Assign task
    db.run(
      "UPDATE tasks SET status = 'assigned', assignee_id = ? WHERE id = ?",
      [app.applicant_id, taskId],
    );

    const updatedTask = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    const updatedApp = queryOne<TaskApplicationRow>(
      db, "SELECT * FROM task_applications WHERE id = ?", [applicationId],
    );
    if (!updatedTask || !updatedApp) throw new Error("Failed to select applicant");
    return { task: mapTask(updatedTask), application: mapApplication(updatedApp) };
  });
}

export async function listApplications(
  taskId: number,
  posterId: number,
): Promise<TaskApplicationRecord[]> {
  return withRead((db) => {
    const task = queryOne<TaskRow>(db, "SELECT id, poster_id FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.poster_id !== posterId) throw new Error("NOT_TASK_POSTER");

    const rows = queryAll<TaskApplicationRow>(
      db,
      "SELECT * FROM task_applications WHERE task_id = ? ORDER BY created_at ASC",
      [taskId],
    );
    return rows.map(mapApplication);
  });
}

// ── Proof submission + approval ───────────────────────────────────────────────

export async function submitProof(
  taskId: number,
  workerId: number,
  proofUrl: string,
): Promise<TaskRecord> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.assignee_id !== workerId) throw new Error("NOT_TASK_WORKER");
    if (task.status !== "assigned") throw new Error("TASK_NOT_ASSIGNED");
    if (new Date(task.deadline) < new Date()) throw new Error("TASK_DEADLINE_PASSED");

    db.run(
      "UPDATE tasks SET status = 'submitted', proof_url = ? WHERE id = ?",
      [proofUrl, taskId],
    );

    const updated = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!updated) throw new Error("Failed to submit proof");
    return mapTask(updated);
  });
}

export async function approveTask(
  taskId: number,
  posterId: number,
): Promise<{ task: TaskRecord; workerCredits: number }> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.poster_id !== posterId) throw new Error("NOT_TASK_POSTER");
    if (task.status !== "submitted") throw new Error("TASK_NOT_SUBMITTED");
    if (!task.assignee_id) throw new Error("No assignee on task");

    const reward = Number(task.reward);

    // Credit the worker
    db.run("UPDATE users SET credits = credits + ? WHERE id = ?", [reward, task.assignee_id]);
    db.run(
      `INSERT INTO credit_ledger (user_id, kind, amount, reference_type, reference_id, note)
       VALUES (?, 'task_earn', ?, 'task', ?, ?)`,
      [task.assignee_id, reward, taskId, `Task #${taskId} completed`],
    );

    // Record platform fee (already collected from poster at creation)
    const fee = Number(task.platform_fee);
    db.run(
      `INSERT INTO credit_ledger (user_id, kind, amount, reference_type, reference_id, note)
       VALUES (?, 'task_fee', ?, 'task', ?, ?)`,
      [task.poster_id, -fee, taskId, `Platform fee for task #${taskId}`],
    );

    db.run(
      "UPDATE tasks SET status = 'approved', completed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [taskId],
    );

    const updatedTask = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    const worker = queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [task.assignee_id]);
    if (!updatedTask || !worker) throw new Error("Failed to approve task");

    return { task: mapTask(updatedTask), workerCredits: Number(worker.credits) };
  });
}

export async function disputeTask(
  taskId: number,
  posterId: number,
): Promise<TaskRecord> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.poster_id !== posterId) throw new Error("NOT_TASK_POSTER");
    if (task.status !== "submitted") throw new Error("TASK_NOT_SUBMITTED");

    db.run("UPDATE tasks SET status = 'disputed' WHERE id = ?", [taskId]);

    const updated = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!updated) throw new Error("Failed to dispute task");
    return mapTask(updated);
  });
}

export async function cancelTask(
  taskId: number,
  posterId: number,
): Promise<{ task: TaskRecord; user: UserRecord }> {
  return withWrite((db) => {
    const task = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (!task) throw new Error("Task not found");
    if (task.poster_id !== posterId) throw new Error("NOT_TASK_POSTER");
    if (!["open", "assigned"].includes(task.status)) {
      throw new Error("TASK_CANNOT_BE_CANCELLED");
    }

    const reward = Number(task.reward);
    const fee = Number(task.platform_fee);
    const refund = reward + fee;

    // Refund full amount (reward + fee) to poster
    db.run("UPDATE users SET credits = credits + ? WHERE id = ?", [refund, posterId]);
    db.run(
      `INSERT INTO credit_ledger (user_id, kind, amount, reference_type, reference_id, note)
       VALUES (?, 'task_refund', ?, 'task', ?, ?)`,
      [posterId, refund, taskId, `Task #${taskId} cancelled — full refund`],
    );

    db.run("UPDATE tasks SET status = 'cancelled' WHERE id = ?", [taskId]);

    const updatedTask = queryOne<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", [taskId]);
    const updatedPoster = queryOne<UserRow>(db, "SELECT * FROM users WHERE id = ?", [posterId]);
    if (!updatedTask || !updatedPoster) throw new Error("Failed to cancel task");

    return { task: mapTask(updatedTask), user: mapUser(updatedPoster) };
  });
}

// ── KILT Credentials ─────────────────────────────────────────────────────────

export async function getKiltCredential(userId: number): Promise<KiltCredentialRecord | null> {
  return withRead((db) => {
    const row = queryOne<KiltCredentialRow>(
      db,
      "SELECT * FROM kilt_credentials WHERE user_id = ?",
      [userId],
    );
    return row ? mapKilt(row) : null;
  });
}

export async function upsertKiltCredential(params: {
  userId: number;
  credentialHash: string;
  attestationId: string;
  expiresAt?: string | null;
}): Promise<KiltCredentialRecord> {
  return withWrite((db) => {
    db.run(
      `INSERT INTO kilt_credentials
         (user_id, credential_hash, attestation_id, verified_at, expires_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         credential_hash = excluded.credential_hash,
         attestation_id  = excluded.attestation_id,
         verified_at     = CURRENT_TIMESTAMP,
         expires_at      = excluded.expires_at`,
      [params.userId, params.credentialHash, params.attestationId, params.expiresAt ?? null],
    );

    const row = queryOne<KiltCredentialRow>(
      db,
      "SELECT * FROM kilt_credentials WHERE user_id = ?",
      [params.userId],
    );
    if (!row) throw new Error("Failed to upsert KILT credential");
    return mapKilt(row);
  });
}

export function isHumanVerified(credential: KiltCredentialRecord | null): boolean {
  if (!credential) return false;
  if (credential.expiresAt && new Date(credential.expiresAt) < new Date()) return false;
  return Boolean(credential.credentialHash && credential.attestationId);
}

// ── Expiry sweep (call on cron or home page load) ─────────────────────────────

export async function expireOverdueTasks(): Promise<number> {
  return withWrite((db) => {
    const result = db.run(
      `UPDATE tasks
       SET status = 'expired'
       WHERE status IN ('open', 'assigned')
         AND deadline < datetime('now')`,
    );
    // sql.js run() doesn't return affected rows directly; return 0 as placeholder
    return 0;
  });
}
