/**
 * orchestrator.example.ts
 *
 * Versión simplificada del orquestador — sin tokens ni rutas reales.
 * Úsala como referencia para entender la estructura.
 * El orquestador real va en tu repo privado con tu .env configurado.
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type AgentName = "po" | "scrum" | "dba" | "backend" | "frontend" | "tester" | "docs";

interface AgentConfig {
  model:    string;
  mcpTools: string[];
}

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN — modelo y MCPs por agente
// Los MCPs se conectan via mcp/config.json
// ─────────────────────────────────────────────────────────────

const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  po:       { model: "claude-opus-4-5",   mcpTools: ["brave-search"] },
  scrum:    { model: "claude-opus-4-5",   mcpTools: ["filesystem"] },
  dba:      { model: "claude-sonnet-4-5", mcpTools: ["filesystem", "postgres", "git", "github"] },
  backend:  { model: "claude-sonnet-4-5", mcpTools: ["filesystem", "git", "github", "brave-search"] },
  frontend: { model: "claude-sonnet-4-5", mcpTools: ["filesystem", "git", "github", "brave-search"] },
  tester:   { model: "claude-haiku-4-5",  mcpTools: ["filesystem", "git", "github", "postgres"] },
  docs:     { model: "claude-haiku-4-5",  mcpTools: ["filesystem", "git", "github"] },
};

// ─────────────────────────────────────────────────────────────
// CÓMO SE CONSTRUYE EL SYSTEM PROMPT DE CADA AGENTE
//
// Cada agente recibe:
//   1. Su rol     → roles/{agente}.md
//   2. Sus skills → skills/{stack}/*.md  (según el stack del proyecto)
//   3. Convenciones → conventions.md
//   4. Contexto   → projects-memories/{proyecto}/context.md
//   5. Su memoria → projects-memories/{proyecto}/memory-{agente}.md
//   6. Tareas     → projects-memories/{proyecto}/tasks.json
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(agent: AgentName, projectName: string): string {
  const agentsRoot = process.env.AGENTS_ROOT ?? path.resolve(__dirname, "..");
  const memoriesPath = path.join(agentsRoot, "projects-memories", projectName);

  const read = (p: string) => { try { return fs.readFileSync(p, "utf-8"); } catch { return ""; } };

  const role        = read(path.join(agentsRoot, "roles", `${agent}.md`));
  const conventions = read(path.join(agentsRoot, "conventions.md"));
  const context     = read(path.join(memoriesPath, "context.md"));
  const memory      = read(path.join(memoriesPath, `memory-${agent}.md`));
  const tasks       = read(path.join(memoriesPath, "tasks.json"));

  // Skills base según stack — el orquestador real las lee del context.md
  // Aquí como ejemplo cargamos las de dotnet/vue3/postgres
  const skillFiles: Partial<Record<AgentName, string[]>> = {
    backend:  ["dotnet/endpoint-structure.md", "dotnet/unit-test-xunit.md"],
    frontend: ["vue3/component-structure.md", "vue3/api-service.md"],
    dba:      ["postgres/stored-procedure.md", "postgres/migration.md"],
  };

  let skills = "";
  for (const skillFile of skillFiles[agent] ?? []) {
    skills += read(path.join(agentsRoot, "skills", skillFile));
  }

  return [
    role,
    `\n\nCONVENCIONES:\n${conventions}`,
    context     ? `\n\nCONTEXTO DEL PROYECTO:\n${context}`     : "",
    tasks       ? `\n\nTAREAS ACTUALES:\n${tasks}`              : "",
    memory      ? `\n\nMEMORIA PREVIA:\n${memory}`              : "",
    skills      ? `\n\nSKILLS:\n${skills}`                      : "",
  ].join("").trim();
}

// ─────────────────────────────────────────────────────────────
// AGENT RUNNER — loop de razonamiento del agente
// ─────────────────────────────────────────────────────────────

async function runAgent(agent: AgentName, task: string, projectName: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const system = buildSystemPrompt(agent, projectName);

  console.log(`\n→ [${agent.toUpperCase()}] ${task}`);

  const response = await client.messages.create({
    model:      AGENT_CONFIGS[agent].model,
    max_tokens: 8096,
    system,
    messages:   [{ role: "user", content: task }],
  });

  const text = response.content.find(b => b.type === "text");
  return text?.type === "text" ? text.text : "";
}

// ─────────────────────────────────────────────────────────────
// ORQUESTADOR — punto de entrada
// ─────────────────────────────────────────────────────────────

async function orchestrate(
  instruction: string,
  projectName: string,
  agent?:      AgentName
): Promise<void> {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Proyecto: ${projectName}`);
  console.log(`Instrucción: ${instruction}`);
  console.log(`${"═".repeat(50)}`);

  if (agent) {
    // Agente específico — ejecución directa
    const result = await runAgent(agent, instruction, projectName);
    console.log(`\nRespuesta:\n${result}`);
    return;
  }

  // Sin agente específico — el Scrum decide
  const scrumResponse = await runAgent(
    "scrum",
    `Instrucción: "${instruction}". Lee tasks.json y dime qué agente debe ejecutar esto. Responde solo con JSON: { "agente": "nombre", "tarea": "descripción", "bloqueado": false }`,
    projectName
  );

  try {
    const decision = JSON.parse(scrumResponse.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    if (decision.bloqueado) { console.log(`\nBloqueado: ${decision.motivo}`); return; }

    const result = await runAgent(decision.agente, decision.tarea, projectName);
    console.log(`\nRespuesta:\n${result}`);
  } catch {
    console.log("\nRespuesta del Scrum:\n", scrumResponse);
  }
}

// ─────────────────────────────────────────────────────────────
// CLI
// npx ts-node orchestrator/orchestrator.example.ts <proyecto> <instruccion> [agente]
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const [,, project, instruction, agentArg] = process.argv;

  if (!project || !instruction) {
    console.log("Uso: npx ts-node orchestrator/orchestrator.example.ts <proyecto> <instruccion> [agente]");
    console.log("");
    console.log("Ejemplos:");
    console.log('  npx ts-node orchestrator/orchestrator.example.ts escolar "Crea la tabla alumnos" dba');
    console.log('  npx ts-node orchestrator/orchestrator.example.ts escolar "Qué sigue en el proyecto"');
    process.exit(1);
  }

  orchestrate(instruction, project, agentArg as AgentName | undefined)
    .catch(err => { console.error("Error:", err.message); process.exit(1); });
}
