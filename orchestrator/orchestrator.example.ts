/**
 * orchestrator.example.ts
 * Versión simplificada para referencia pública.
 * El orquestador real (orchestrator.ts) va en tu repo privado con tu .env.
 */

import * as fs     from "fs";
import * as path   from "path";
import * as dotenv from "dotenv";
import { createProvider } from "./providers/base";

dotenv.config();

type AgentName = "po" | "scrum" | "dba" | "backend" | "frontend" | "tester" | "docs";

// ─────────────────────────────────────────────────────────────
// Modelos leídos del .env
// Prefijos: claude-* | gemini-* | gpt-*
// El proveedor se detecta automáticamente en createProvider()
// ─────────────────────────────────────────────────────────────

const AGENT_MODELS: Record<AgentName, string> = {
  po:       process.env.MODEL_PO       ?? "claude-opus-4-6",
  scrum:    process.env.MODEL_SCRUM    ?? "claude-opus-4-6",
  dba:      process.env.MODEL_DBA      ?? "gemini-2.5-pro",
  backend:  process.env.MODEL_BACKEND  ?? "gemini-2.5-pro",
  frontend: process.env.MODEL_FRONTEND ?? "gemini-2.5-pro",
  tester:   process.env.MODEL_TESTER   ?? "gemini-2.5-flash",
  docs:     process.env.MODEL_DOCS     ?? "gemini-2.5-flash",
};

const AGENTS_ROOT = process.env.AGENTS_ROOT ?? path.resolve(__dirname, "..");

const read = (p: string) => { try { return fs.readFileSync(p, "utf-8"); } catch { return ""; } };

// ─────────────────────────────────────────────────────────────
// System prompt
// Cada agente recibe: rol + conventions + contexto + memoria + skills
// Las rutas de repos y postgres vienen del .env (no del context.md)
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(agent: AgentName, projectName: string): string {
  const memoriesPath = path.join(AGENTS_ROOT, "projects-memories", projectName);
  const key          = projectName.toUpperCase();

  // Rutas desde el .env
  const repoMap: Partial<Record<AgentName, string>> = {
    dba:      process.env[`${key}_DB`]    ?? "",
    backend:  process.env[`${key}_BACK`]  ?? "",
    frontend: process.env[`${key}_FRONT`] ?? "",
    tester:   process.env[`${key}_TEST`]  ?? "",
  };

  const postgresConn = ["dba", "tester"].includes(agent)
    ? process.env[`${key}_POSTGRES`] ?? ""
    : "";

  const skillMap: Partial<Record<AgentName, string[]>> = {
    backend:  ["dotnet/endpoint-structure.md", "dotnet/unit-test-xunit.md"],
    frontend: ["vue3/component-structure.md", "vue3/api-service.md"],
    dba:      ["postgres/stored-procedure.md", "postgres/migration.md"],
  };

  let skills = "";
  for (const f of skillMap[agent] ?? []) {
    skills += read(path.join(AGENTS_ROOT, "skills", f));
  }

  return [
    read(path.join(AGENTS_ROOT, "roles", `${agent}.md`)),
    `\n\nCONVENCIONES:\n${read(path.join(AGENTS_ROOT, "conventions.md"))}`,
    `\n\nCONTEXTO:\n${read(path.join(memoriesPath, "context.md"))}`,
    repoMap[agent]  ? `\nTu repo: ${repoMap[agent]}`     : "",
    postgresConn    ? `\nConexión BD: ${postgresConn}`   : "",
    read(path.join(memoriesPath, "tasks.json"))
      ? `\n\nTAREAS:\n${read(path.join(memoriesPath, "tasks.json"))}`  : "",
    read(path.join(memoriesPath, `memory-${agent}.md`))
      ? `\n\nMEMORIA:\n${read(path.join(memoriesPath, `memory-${agent}.md`))}` : "",
    skills ? `\n\nSKILLS:\n${skills}` : "",
  ].join("").trim();
}

// ─────────────────────────────────────────────────────────────
// Runner — usa createProvider, no importa qué SDK es
// ─────────────────────────────────────────────────────────────

async function runAgent(agent: AgentName, task: string, projectName: string): Promise<string> {
  const model    = AGENT_MODELS[agent];
  const system   = buildSystemPrompt(agent, projectName);

  console.log(`\n→ [${agent.toUpperCase()}] (${model}) ${task}`);

  const provider = await createProvider(model);
  const result   = await provider.generate(system, task);
  return result.text;
}

// ─────────────────────────────────────────────────────────────
// Orquestador
// ─────────────────────────────────────────────────────────────

async function orchestrate(
  instruction: string,
  projectName: string,
  agent?:      AgentName
): Promise<void> {
  console.log(`\nProyecto: ${projectName} | ${instruction}`);

  if (agent) {
    console.log(await runAgent(agent, instruction, projectName));
    return;
  }

  const scrumResponse = await runAgent("scrum",
    `Instrucción: "${instruction}". Lee tasks.json y responde SOLO con JSON sin markdown:
    { "agente": "nombre", "descripcion": "tarea", "bloqueado": false, "motivo_bloqueo": null }`,
    projectName
  );

  try {
    const d = JSON.parse(scrumResponse.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
    if (d.bloqueado) { console.log(`Bloqueado: ${d.motivo_bloqueo}`); return; }
    console.log(await runAgent(d.agente, d.descripcion, projectName));
  } catch {
    console.log(scrumResponse);
  }
}

// ─────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const [,, project, instruction, agentArg] = process.argv;

  if (!project || !instruction) {
    console.log("Uso: npx ts-node orchestrator/orchestrator.example.ts <proyecto> \"<instruccion>\" [agente]");
    console.log("Ejemplo: npx ts-node orchestrator/orchestrator.example.ts escolar \"Qué sigue\"");
    process.exit(1);
  }

  orchestrate(instruction, project, agentArg as AgentName | undefined)
    .catch(err => { console.error("❌", err.message); process.exit(1); });
}
