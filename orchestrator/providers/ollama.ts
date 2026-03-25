import { LLMProvider, LLMResponse, LLMOptions } from "./base";

export class OllamaProvider implements LLMProvider {
  private model: string;
  private baseUrl: string;

  constructor(model: string) {
    // model format: "ollama:mistral" o "http://localhost:11434"
    // Si es "ollama:modelname", usa localhost:11434
    // Si empieza con http://, usa esa URL directamente

    if (model.startsWith("ollama:")) {
      const modelName = model.substring(7); // "mistral"
      this.model = modelName;
      this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    } else if (model.startsWith("http://") || model.startsWith("https://")) {
      // URL completa tipo: http://192.168.1.100:11434
      this.baseUrl = model;
      this.model = "mistral"; // modelo por defecto
    } else {
      this.model = model;
      this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    }
  }

  async generate(
    systemPrompt: string,
    userMessage: string,
    options?: LLMOptions
  ): Promise<LLMResponse> {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorData}`);
      }

      const data = await response.json() as Record<string, any>;

      // Ollama responde con: { model, created_at, message: { role, content }, done, ...}
      const text = (data.message as Record<string, any>)?.content || "";

      // Ollama no siempre reporta tokens exactos, estimamos
      const inputTokens = Math.ceil(systemPrompt.length / 4 + userMessage.length / 4);
      const outputTokens = Math.ceil(text.length / 4);

      return {
        text,
        inputTokens,
        outputTokens,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Ollama error: ${message}\n\nVerifica que:\n` +
        `1. Ollama está corriendo: ollama serve\n` +
        `2. La URL es correcta: ${this.baseUrl}\n` +
        `3. El modelo está descargado: ollama pull ${this.model}`
      );
    }
  }
}
