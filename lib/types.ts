export const AGENT_CATEGORIES = [
  "Marketing",
  "Coding",
  "Education",
  "Productivity",
  "Research",
  "Design",
  "Finance",
  "General",
] as const;

export type AgentCategory = (typeof AGENT_CATEGORIES)[number];

export const AGENT_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.2-3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-27b-it:free",
  "deepseek/deepseek-r1-0528:free",
  "google/gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview",
  "openai/gpt-5-image-mini",
  "openai/gpt-oss-20b:free",
  "qwen/qwen2.5-vl-32b-instruct",
  "qwen/qwen2.5-vl-72b-instruct",
  "meta-llama/llama-3.2-11b-vision-instruct",
  "moonshotai/kimi-k2",
  "qwen/qwen-2.5-7b-instruct",
  "qwen/qwen3-14b",
  "meta-llama/llama-3.1-8b-instruct",
  "meta-llama/llama-3.1-70b-instruct",
] as const;

export type AgentModel = (typeof AGENT_MODELS)[number];

export const AGENT_MODEL_BADGES: Record<AgentModel, "text" | "image" | "vision"> = {
  "openrouter/free": "text",
  "meta-llama/llama-3.2-3b-instruct:free": "text",
  "meta-llama/llama-3.3-70b-instruct:free": "text",
  "mistralai/mistral-small-3.1-24b-instruct:free": "text",
  "google/gemma-3-27b-it:free": "text",
  "deepseek/deepseek-r1-0528:free": "text",
  "google/gemini-2.5-flash-image": "image",
  "google/gemini-3-pro-image-preview": "image",
  "openai/gpt-5-image-mini": "image",
  "openai/gpt-oss-20b:free": "text",
  "qwen/qwen2.5-vl-32b-instruct": "vision",
  "qwen/qwen2.5-vl-72b-instruct": "vision",
  "meta-llama/llama-3.2-11b-vision-instruct": "vision",
  "moonshotai/kimi-k2": "text",
  "qwen/qwen-2.5-7b-instruct": "text",
  "qwen/qwen3-14b": "text",
  "meta-llama/llama-3.1-8b-instruct": "text",
  "meta-llama/llama-3.1-70b-instruct": "text",
};

export const AGENT_CARD_GRADIENTS = [
  "aurora",
  "sunset",
  "ocean",
  "ember",
  "cosmic",
] as const;

export type AgentCardGradient = (typeof AGENT_CARD_GRADIENTS)[number];

export type AgentRecord = {
  id: number;
  name: string;
  description: string;
  category: string;
  model: AgentModel;
  systemPrompt: string;
  pricePerRun: number;
  creatorId: number;
  storageHash: string | null;
  manifestUri: string | null;
  manifestTxHash: string | null;
  knowledgeUri: string | null;
  knowledgeTxHash: string | null;
  cardImageDataUrl: string | null;
  cardGradient: AgentCardGradient;
  knowledgeLocalPath: string | null;
  knowledgeFilename: string | null;
  published: boolean;
  createdAt: string;
};

export type RunRecord = {
  id: number;
  userId: number;
  agentId: number;
  input: string;
  output: string;
  cost: number;
  computeMode: string;
  createdAt: string;
};

export type UserRecord = {
  id: number;
  walletAddress: string;
  credits: number;
};

export type CreditLedgerKind =
  | "topup"
  | "run_debit"
  | "manual_adjustment"
  | "task_reserve"
  | "task_refund"
  | "task_earn"
  | "task_fee";

export type CreditLedgerRecord = {
  id: number;
  userId: number;
  kind: CreditLedgerKind;
  amount: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdAt: string;
};

export type TopupRail = "native" | "fiat" | "stablecoin";
export type TopupStatus = "pending" | "completed" | "failed";

export type TopupOrderRecord = {
  id: number;
  userId: number;
  rail: TopupRail;
  currency: string;
  amount: number;
  credits: number;
  status: TopupStatus;
  providerReference: string;
  createdAt: string;
  completedAt: string | null;
};

export type AgentManifest = {
  name: string;
  description: string;
  system_prompt: string;
  category: string;
  model: AgentModel;
  knowledge_uri: string | null;
  creator: string;
  price_per_run: number;
};

export type ComputeResult = {
  output: string;
  mode: "real" | "openrouter" | "mock";
  model: string;
  providerAddress: string;
};

// ── Human Task Marketplace ──────────────────────────────────────────────────

export const TASK_CATEGORIES = [
  "testnet",
  "discord",
  "defi",
  "nft",
  "social",
  "review",
  "data",
  "other",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export type TaskType = "instant" | "apply";

export type TaskStatus =
  | "open"
  | "assigned"
  | "submitted"
  | "approved"
  | "disputed"
  | "cancelled"
  | "expired";

export type TaskRecord = {
  id: number;
  title: string;
  description: string;
  category: TaskCategory;
  taskType: TaskType;
  reward: number;
  platformFee: number;
  posterId: number;
  assigneeId: number | null;
  status: TaskStatus;
  proofUrl: string | null;
  deadline: string;
  maxApplicants: number | null;
  createdAt: string;
  completedAt: string | null;
};

export type TaskApplicationRecord = {
  id: number;
  taskId: number;
  applicantId: number;
  message: string | null;
  status: "pending" | "selected" | "rejected";
  createdAt: string;
};

export type KiltCredentialRecord = {
  id: number;
  userId: number;
  credentialHash: string;
  attestationId: string;
  verifiedAt: string;
  expiresAt: string | null;
  createdAt: string;
};
