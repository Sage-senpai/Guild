/**
 * Guild Compute Layer
 * Supports two backends:
 *   - openrouter : OpenRouter API (18+ models)
 *   - mock       : deterministic offline response (dev only)
 *
 * Replaces the removed 0G compute stack.
 */

import type { ComputeResult } from "@/lib/types";

type OpenRouterPayload = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: { message?: string };
};

type OpenRouterMessageContent = NonNullable<
  NonNullable<NonNullable<OpenRouterPayload["choices"]>[number]["message"]>["content"]
>;

// ── Config helpers ────────────────────────────────────────────────────────────

function openRouterEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function computeMode(): "openrouter" | "mock" {
  return openRouterEnabled() ? "openrouter" : "mock";
}

// ── Model resolution ──────────────────────────────────────────────────────────

const IMAGE_ONLY_MODELS = new Set([
  "google/gemini-2.5-flash-image",
  "google/gemini-3-pro-image-preview",
  "openai/gpt-5-image",
  "openai/gpt-5-image-mini",
]);

function resolveOpenRouterModel(requestedModel?: string): string {
  const fallback =
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() || "meta-llama/llama-3.2-3b-instruct:free";
  const model = requestedModel?.trim() || fallback;

  if (model === "openrouter/free") return fallback;
  if (IMAGE_ONLY_MODELS.has(model)) return fallback;
  return model;
}

// ── Message content extraction ────────────────────────────────────────────────

function extractContent(content: OpenRouterMessageContent | null | undefined): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (part?.type === "text" ? (part.text ?? "") : ""))
      .join("")
      .trim();
  }
  return "";
}

// ── OpenRouter backend ────────────────────────────────────────────────────────

async function runOpenRouterInference(params: {
  systemPrompt: string;
  knowledge: string;
  userInput: string;
  model?: string;
}): Promise<ComputeResult> {
  const apiKey = process.env.OPENROUTER_API_KEY!.trim();
  const selectedModel = resolveOpenRouterModel(params.model);
  const systemContent = [
    params.systemPrompt,
    params.knowledge ? `Knowledge:\n${params.knowledge}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
      "X-Title": "Guild",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: params.userInput },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as OpenRouterPayload | null;
    const message = detail?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`OpenRouter call failed (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as OpenRouterPayload;
  const output = extractContent(payload.choices?.[0]?.message?.content);
  if (!output) throw new Error("OpenRouter returned an empty response.");

  return { output, mode: "openrouter", model: selectedModel, providerAddress: "openrouter" };
}

// ── Mock backend ──────────────────────────────────────────────────────────────

function runMockInference(
  systemPrompt: string,
  knowledge: string,
  userInput: string,
  requestedModel?: string,
): ComputeResult {
  const context = [systemPrompt, knowledge].filter(Boolean).join("\n\n").slice(0, 240);
  return {
    output: [
      "Guild mock compute response",
      `User request: ${userInput}`,
      requestedModel ? `Model: ${requestedModel}` : "Model: default",
      context ? `Context: ${context}` : "Context: none",
      "Set OPENROUTER_API_KEY to enable real inference.",
    ].join("\n"),
    mode: "mock",
    model: requestedModel ?? "mock/llama-3",
    providerAddress: "mock-provider",
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function runInference(params: {
  systemPrompt: string;
  knowledge: string;
  userInput: string;
  model?: string;
}): Promise<ComputeResult> {
  if (openRouterEnabled()) {
    return runOpenRouterInference(params);
  }
  return runMockInference(params.systemPrompt, params.knowledge, params.userInput, params.model);
}
