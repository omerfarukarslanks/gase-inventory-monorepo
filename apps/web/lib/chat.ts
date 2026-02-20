import { apiFetch } from "@/lib/api";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type ChatRequest = {
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
  model?: string;
  metadata?: Record<string, unknown>;
};

export type ChatResponse = {
  message: ChatMessage;
  raw?: unknown;
};

const CHAT_PATH = process.env.NEXT_PUBLIC_AI_CHAT_PATH ?? "/ai/chat";

function asObject(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function parseSseContent(raw: string): string {
  let currentEvent = "";
  let finalContent = "";
  let streamedContent = "";

  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("event:")) {
      currentEvent = line.slice(6).trim().toLowerCase();
      continue;
    }

    if (!line.startsWith("data:")) continue;
    const dataRaw = line.slice(5).trim();
    if (!dataRaw || dataRaw === "{}") continue;

    let payload: unknown = dataRaw;
    try {
      payload = JSON.parse(dataRaw);
    } catch {
      // keep raw text fallback
    }

    const node = asObject(payload);
    const content =
      pickString(node?.content, node?.message, node?.text) ||
      (typeof payload === "string" ? payload : "");

    if (!content) continue;

    if (currentEvent === "final") {
      finalContent = content;
      continue;
    }

    if (currentEvent === "message") {
      streamedContent += content;
      continue;
    }
  }

  return finalContent || streamedContent;
}

function normalizeAssistantMessage(payload: unknown): ChatMessage {
  if (typeof payload === "string") {
    const content = parseSseContent(payload);
    return {
      role: "assistant",
      content: content || "Yanit alinamadi.",
    };
  }

  const root = asObject(payload);
  const data = asObject(root?.data);
  const messageNode = asObject(root?.message) ?? asObject(data?.message);
  const choiceNode = asObject(
    Array.isArray(root?.choices) && root?.choices.length > 0 ? root.choices[0] : null,
  );
  const choiceMessage = asObject(choiceNode?.message);

  const content = pickString(
    messageNode?.content,
    choiceMessage?.content,
    root?.response,
    root?.reply,
    root?.answer,
    root?.output,
    root?.text,
    data?.response,
    data?.reply,
    data?.answer,
    data?.output,
    data?.text,
  );

  return {
    id: pickString(messageNode?.id, root?.id) || undefined,
    role: "assistant",
    content: content || "Yanit alinamadi.",
    createdAt: pickString(messageNode?.createdAt, root?.createdAt) || undefined,
  };
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const response = await apiFetch<unknown>(CHAT_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    message: normalizeAssistantMessage(response),
    raw: response,
  };
}
