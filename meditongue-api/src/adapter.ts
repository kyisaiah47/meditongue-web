import { LLMAdapter } from "./adapters";
import { ollamaAdapter } from "./adapters/ollama";
import { openaiAdapter } from "./adapters/openai";

const backend = (process.env.MODEL_BACKEND || "ollama").toLowerCase();

export const adapter: LLMAdapter =
	backend === "openai" ? openaiAdapter : ollamaAdapter;
