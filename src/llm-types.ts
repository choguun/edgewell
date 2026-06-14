// Shared LLM and chat types. Used by Orchestrator, ToolAgent, the
// P2P server/client, and the DelegatingLLM shim. Anything that
// needs "an LLM" should use this interface.

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface PromptInput {
  system?: string;
  user: string;
  history?: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LLM {
  prompt(input: PromptInput): Promise<string>;
  stream(input: PromptInput): AsyncIterable<string>;
}
