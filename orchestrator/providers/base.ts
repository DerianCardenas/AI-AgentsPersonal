// providers/base.ts
// Interfaz común que todos los proveedores deben implementar.
// El orquestador solo conoce esta interfaz — nunca los SDKs directamente.

export interface LLMResponse {
  text:        string;
  inputTokens: number;
  outputTokens: number;
}

export interface LLMProvider {
  generate(
    systemPrompt: string,
    userMessage:  string,
    options?:     LLMOptions
  ): Promise<LLMResponse>;
}

export interface LLMOptions {
  maxTokens?:   number;
  temperature?: number;
}

// ─────────────────────────────────────────────────────────────
// Factory — dado el nombre del modelo, devuelve el proveedor correcto
// ─────────────────────────────────────────────────────────────

export async function createProvider(model: string): Promise<LLMProvider> {
  if (model.startsWith("claude-")) {
    const { AnthropicProvider } = await import("./anthropic");
    return new AnthropicProvider(model);
  }

  if (model.startsWith("gemini-")) {
    const { GoogleProvider } = await import("./google");
    return new GoogleProvider(model);
  }

  if (model.startsWith("gpt-")) {
    const { OpenAIProvider } = await import("./openai");
    return new OpenAIProvider(model);
  }

  if (model.startsWith("ollama:") || model.startsWith("http://") || model.startsWith("https://")) {
    const { OllamaProvider } = await import("./ollama");
    return new OllamaProvider(model);
  }

  throw new Error(
    `Modelo no reconocido: "${model}". ` +
    `Prefijos soportados: claude-, gemini-, gpt-, ollama:, http://, https://`
  );
}
