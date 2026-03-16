"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";

import { apiFetch } from "@/lib/api-fetch";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

type RunResult = {
  output: string;
  remainingCredits: number;
  compute: {
    mode: string;
    model: string;
    providerAddress: string;
  };
  error?: string;
};

const SUGGESTIONS = [
  "Summarize what this agent does best.",
  "Give me a step-by-step plan for this task.",
  "What inputs should I provide for best results?",
  "Show me an example output I can reuse.",
];

function titleFromText(text: string): string {
  const clean = text.trim();
  if (!clean) {
    return "New chat";
  }
  return clean.length > 42 ? `${clean.slice(0, 42)}...` : clean;
}

function createSession(seedText?: string): ChatSession {
  return {
    id: nanoid(),
    title: seedText ? titleFromText(seedText) : "New chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

function sessionStorageKey(agentId: number): string {
  return `guild-chat-sessions:${agentId}`;
}

export function ChatClient({
  agentId,
  agentName,
  initialCredits,
}: {
  agentId: number;
  agentName: string;
  initialCredits: number;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>(() => [createSession()]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready");
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(initialCredits);
  const [lastComputeMeta, setLastComputeMeta] = useState<RunResult["compute"] | null>(null);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? sessions[0] ?? null,
    [sessions, activeSessionId],
  );

  useEffect(() => {
    const key = sessionStorageKey(agentId);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const initialSession = createSession();
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as ChatSession[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid sessions payload");
      }
      setSessions(parsed);
      setActiveSessionId(parsed[0].id);
    } catch {
      const fallback = createSession();
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
    }
  }, [agentId]);

  useEffect(() => {
    if (sessions.length === 0) {
      return;
    }
    window.localStorage.setItem(sessionStorageKey(agentId), JSON.stringify(sessions));
  }, [agentId, sessions]);

  const createNewChat = useCallback(() => {
    const next = createSession();
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
    setInput("");
    setError("");
    setStatus("ready");
  }, []);

  const appendMessageToActiveSession = useCallback((message: ChatMessage) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== activeSessionId) {
          return session;
        }
        const nextMessages = [...session.messages, message];
        const nextTitle =
          session.messages.length === 0 && message.role === "user"
            ? titleFromText(message.content)
            : session.title;
        return {
          ...session,
          title: nextTitle,
          messages: nextMessages,
          updatedAt: Date.now(),
        };
      }),
    );
  }, [activeSessionId]);

  const runAgent = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || status === "submitted" || status === "streaming" || !activeSessionId) {
      return;
    }

    setStatus("submitted");
    setError("");

    appendMessageToActiveSession({
      id: nanoid(),
      role: "user",
      content: text,
    });

    setInput("");
    setStatus("streaming");

    // Send conversation history (last 20 messages) for multi-turn context
    const history = (activeSession?.messages ?? [])
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const response = await apiFetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const payload = (await response.json()) as RunResult;
      if (!response.ok) {
        setError(payload.error ?? "Failed to run agent");
        setStatus("error");
        return;
      }

      appendMessageToActiveSession({
        id: nanoid(),
        role: "assistant",
        content: payload.output,
      });
      setCredits(payload.remainingCredits);
      setLastComputeMeta(payload.compute);
      setStatus("ready");
    } catch {
      setError("Failed to run agent");
      setStatus("error");
    }
  }, [activeSessionId, agentId, appendMessageToActiveSession, status]);

  const handlePromptSubmit = useCallback(async (message: PromptInputMessage) => {
    if (message.files.length > 0) {
      setError("Attachments are not supported for this agent yet.");
    }
    await runAgent(message.text);
  }, [runAgent]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-ink/15 lg:flex-row">
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink/15 text-sm hover:bg-ink/5"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{agentName}</p>
          <p className="font-[var(--font-mono)] text-[10px] uppercase text-ink/50">
            {formatCredits(credits)} credits
          </p>
        </div>
        {lastComputeMeta ? (
          <p className="hidden font-[var(--font-mono)] text-[10px] uppercase text-ink/40 sm:block">
            {lastComputeMeta.model.split("/").pop()}
          </p>
        ) : null}
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "flex w-full flex-col border-b border-ink/10 bg-chalk/80 p-4 lg:w-[260px] lg:shrink-0 lg:border-b-0 lg:border-r lg:border-ink/10",
          sidebarOpen ? "max-h-64 overflow-auto" : "hidden lg:flex",
        )}
      >
        <div className="hidden space-y-1 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-flare">Agent Chat</p>
          <h1 className="truncate text-lg font-black">{agentName}</h1>
          <p className="font-[var(--font-mono)] text-xs uppercase">
            Credits: {formatCredits(credits)}
          </p>
        </div>

        <div className="flex gap-2 lg:mt-4">
          <Button
            type="button"
            className="flex-1"
            onClick={() => { createNewChat(); setSidebarOpen(false); }}
          >
            New chat
          </Button>
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-auto pr-1 lg:mt-4">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => {
                setActiveSessionId(session.id);
                setError("");
                setSidebarOpen(false);
              }}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                activeSession?.id === session.id
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 bg-white/70 hover:bg-ink/5",
              )}
            >
              <p className="truncate font-semibold">{session.title}</p>
              <p className={cn("mt-0.5 text-xs", activeSession?.id === session.id ? "text-white/80" : "text-ink/60")}>
                {new Date(session.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-3 hidden lg:block">
          <Link
            href={`/agents/${agentId}`}
            className="inline-flex rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5"
          >
            ← Agent details
          </Link>
        </div>
      </aside>

      {/* ── Chat area ──────────────────────────────────────────────────── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Desktop header */}
        <div className="hidden border-b border-ink/10 px-4 py-2.5 lg:block">
          <p className="truncate text-sm font-semibold">{activeSession?.title ?? "New chat"}</p>
          {lastComputeMeta ? (
            <p className="muted mt-0.5 font-[var(--font-mono)] text-xs uppercase">
              {lastComputeMeta.mode} | {lastComputeMeta.model}
            </p>
          ) : null}
        </div>

        {/* Messages */}
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="px-3 py-4 sm:px-6">
            {activeSession?.messages.length ? (
              activeSession.messages.map((message) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    <MessageResponse>{message.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))
            ) : (
              <ConversationEmptyState
                title="No messages yet"
                description="Start chatting with this agent."
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input area */}
        <div className="border-t border-ink/10 p-3">
          <div className="mb-2 overflow-x-auto">
            <Suggestions>
              {SUGGESTIONS.map((suggestion) => (
                <Suggestion key={suggestion} suggestion={suggestion} onClick={runAgent} />
              ))}
            </Suggestions>
          </div>

          <PromptInput onSubmit={handlePromptSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                value={input}
                onChange={(event) => setInput(event.currentTarget.value)}
                placeholder="Ask this agent anything..."
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools />
              <PromptInputSubmit
                disabled={!input.trim() || status === "submitted" || status === "streaming"}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>

          {error ? <p className="mt-2 text-sm font-semibold text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
