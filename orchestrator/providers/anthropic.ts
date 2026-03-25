// providers/anthropic.ts
// Wrapper del SDK de Anthropic para Claude.

import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMResponse, LLMOptions } from "./base";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;
  private model:  string;

  constructor(model: string) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY no está definida en el .env. " +
        `Necesaria para el modelo: ${model}`
      );
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model  = model;
  }

  async generate(
    systemPrompt: string,
    userMessage:  string,
    options:      LLMOptions = {}
  ): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model:      this.model,
      max_tokens: options.maxTokens ?? 8096,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    const text      = textBlock?.type === "text" ? textBlock.text : "";

    return {
      text,
      inputTokens:  response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }
}
