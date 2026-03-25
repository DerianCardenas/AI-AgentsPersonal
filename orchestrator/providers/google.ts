// providers/google.ts
// Wrapper del SDK de Google Generative AI para Gemini.

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, LLMResponse, LLMOptions } from "./base";

export class GoogleProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model:  string;

  constructor(model: string) {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error(
        "GOOGLE_API_KEY no está definida en el .env. " +
        `Necesaria para el modelo: ${model}`
      );
    }
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    this.model  = model;
  }

  async generate(
    systemPrompt: string,
    userMessage:  string,
    options:      LLMOptions = {}
  ): Promise<LLMResponse> {
    const gemini = this.client.getGenerativeModel({
      model:             this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: options.maxTokens  ?? 8096,
        temperature:     options.temperature ?? 1.0,
      },
    });

    const result   = await gemini.generateContent(userMessage);
    const response = result.response;
    const text     = response.text();

    // Gemini devuelve token counts en usageMetadata
    const usage = response.usageMetadata;

    return {
      text,
      inputTokens:  usage?.promptTokenCount     ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    };
  }
}
