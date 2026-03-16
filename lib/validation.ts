import { z } from "zod";

import { AGENT_CARD_GRADIENTS, AGENT_CATEGORIES, AGENT_MODELS, TASK_CATEGORIES } from "@/lib/types";

export const createAgentSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10).max(400),
  category: z.enum(AGENT_CATEGORIES),
  model: z.enum(AGENT_MODELS).default("openrouter/free"),
  systemPrompt: z.string().trim().min(10).max(5000),
  pricePerRun: z.coerce.number().min(0).max(1000),
  cardGradient: z.enum(AGENT_CARD_GRADIENTS).default("aurora"),
  publishNow: z.coerce.boolean().default(true),
});

export const runAgentSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(20)
    .optional(),
});

export const listAgentsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  includeDrafts: z.coerce.boolean().default(false),
});

export const createTopupSchema = z.object({
  rail: z.enum(["fiat", "stablecoin"]),
  currency: z.string().trim().toUpperCase().min(2).max(12),
  amount: z.coerce.number().min(1).max(10000),
});

export const createOnchainTopupSchema = z.object({
  txHash: z.string().trim().regex(/^0x[a-fA-F0-9]{64}$/),
  chainId: z.coerce.number().int().positive(),
  fromAddress: z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/),
  currency: z.string().trim().toUpperCase().min(1).max(12),
  expectedAmount: z.string().trim().regex(/^\d+(\.\d{1,18})?$/).optional(),
});

// ── Human Task Marketplace ──────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().trim().min(10).max(120),
  description: z.string().trim().min(20).max(1000),
  category: z.enum(TASK_CATEGORIES),
  taskType: z.enum(["instant", "apply"]).default("instant"),
  reward: z.coerce.number().min(0.5).max(50),
  deadlineHours: z.coerce.number().int().min(1).max(168).default(24), // 1h–7 days
  maxApplicants: z.coerce.number().int().min(1).max(50).optional(),
});

export const applyTaskSchema = z.object({
  message: z.string().trim().max(500).optional(),
});

export const submitProofSchema = z.object({
  proofUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          // Allow common proof destinations: tx explorers, Twitter, GitHub, screenshots
          const allowedHosts = [
            "twitter.com", "x.com",
            "github.com",
            "etherscan.io", "basescan.org", "polygonscan.com",
            "arbiscan.io", "optimistic.etherscan.io",
            "testnet.arbiscan.io",
            "imgur.com", "i.imgur.com",
            "drive.google.com", "lh3.googleusercontent.com",
            "moonscan.io", "moonbeam.moonscan.io", "moonbase.moonscan.io",
          ];
          return allowedHosts.some(
            (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
          );
        } catch {
          return false;
        }
      },
      { message: "Proof URL must be a supported explorer, Twitter, GitHub, or image link" }
    ),
});

export const listTasksSchema = z.object({
  category: z.enum([...TASK_CATEGORIES, "all"]).default("all"),
  status: z.enum(["open", "assigned", "submitted", "approved", "all"]).default("open"),
  taskType: z.enum(["instant", "apply", "all"]).default("all"),
  cursor: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const verifyKiltSchema = z.object({
  credentialJson: z.string().min(10).max(50_000),
  attestationId: z.string().trim().min(1).max(200),
});

// ── Reviews ─────────────────────────────────────────────────────────────────

export const submitReviewSchema = z.object({
  runId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional().transform((v) => v || null),
});
