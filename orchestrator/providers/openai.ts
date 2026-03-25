// providers/openai.ts
// Wrapper del SDK de OpenAI para GPT.
// Incluido para que el sistema sea extensible — úsalo si necesitas GPT.

import OpenAI from "openai";
import type { LLMProvider, LLMResponse, LLMOptions } from "./base";

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model:  string;

  constructor(model: string) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY no está definida en el .env. " +
        `Necesaria para el modelo: ${model}`
      );
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model  = model;
  }

  async generate(
    systemPrompt: string,
    userMessage:  string,
    options:      LLMOptions = {}
  ): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model:      this.model,
      max_tokens: options.maxTokens ?? 8096,
      messages: [
        { role: "system",  content: systemPrompt },
        { role: "user",    content: userMessage  },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";

    return {
      text,
      inputTokens:  response.usage?.prompt_tokens     ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
    };
  }
}
