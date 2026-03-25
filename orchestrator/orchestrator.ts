import * as fs     from "fs";
import * as path   from "path";
import * as dotenv from "dotenv";
import { createProvider } from "./providers/base";

dotenv.config();

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

type AgentName = "po" | "scrum" | "dba" | "backend" | "frontend" | "tester" | "docs";

interface AgentConfig {
  model:    string;
  mcpTools: string[];
}

interface ProjectEnvConfig {
  back:     string;
  front:    string;
  db:       string;
  test:     string;
  postgres: string;
}

interface ProjectContext {
  name:      string;
  rootPath:  string;
  context:   string;
  tasks?:    string;
  envConfig: ProjectEnvConfig;
  memories:  Partial<Record<AgentName, string>>;
}

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE AGENTES
// Modelos leídos del .env — cambia el modelo sin tocar código
//
// Prefijos válidos para detección automática de proveedor:
//   claude-*  → Anthropic
//   gemini-*  → Google
//   gpt-*     → OpenAI
// ─────────────────────────────────────────────────────────────

const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  po:       { model: process.env.MODEL_PO       ?? "claude-opus-4-6",   mcpTools: ["brave-search", "filesystem"] },
  scrum:    { model: process.env.MODEL_SCRUM    ?? "claude-opus-4-6",   mcpTools: ["filesystem"] },
  dba:      { model: process.env.MODEL_DBA      ?? "gemini-2.5-pro",    mcpTools: ["filesystem", "postgres", "git", "github"] },
  backend:  { model: process.env.MODEL_BACKEND  ?? "gemini-2.5-pro",    mcpTools: ["filesystem", "git", "github", "brave-search"] },
  frontend: { model: process.env.MODEL_FRONTEND ?? "gemini-2.5-pro",    mcpTools: ["filesystem", "git", "github", "brave-search"] },
  tester:   { model: process.env.MODEL_TESTER   ?? "gemini-2.5-flash",  mcpTools: ["filesystem", "git", "github", "postgres"] },
  docs:     { model: process.env.MODEL_DOCS     ?? "gemini-2.5-flash",  mcpTools: ["filesystem", "git", "github"] },
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const AGENTS_ROOT = process.env.AGENTS_ROOT ?? path.resolve(__dirname, "..");

function readFile(filePath: string): string {
  try { return fs.readFileSync(filePath, "utf-8"); } catch { return ""; }
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

// ─────────────────────────────────────────────────────────────
// LEER CONFIGURACIÓN DEL PROYECTO DESDE .env
// Convención: {NOMBRE_PROYECTO}_BACK, _FRONT, _DB, _TEST, _POSTGRES
// Ejemplo: ESCOLAR_BACK=/ruta/back-repo
// ─────────────────────────────────────────────────────────────

function loadProjectEnvConfig(projectName: string): ProjectEnvConfig {
  const key = projectName.toUpperCase();

  const get = (suffix: string): string => {
    const val = process.env[`${key}_${suffix}`];
    if (!val) console.warn(`⚠️  Variable de entorno no encontrada: ${key}_${suffix}`);
    return val ?? "";
  };

  return {
    back:     get("BACK"),
    front:    get("FRONT"),
    db:       get("DB"),
    test:     get("TEST"),
    postgres: get("POSTGRES"),
  };
}

function loadProjectContext(projectName: string): ProjectContext {
  const memoriesPath   = path.join(AGENTS_ROOT, "projects-memories", projectName);
  const contextContent = readFile(path.join(memoriesPath, "context.md"));

  if (!contextContent) {
    throw new Error(
      `context.md no encontrado en: ${memoriesPath}\n` +
      `Crea el archivo copiando context_example.md`
    );
  }

  return {
    name:      projectName,
    rootPath:  memoriesPath,
    context:   contextContent,
    tasks:     readFile(path.join(memoriesPath, "tasks.json")),
    envConfig: loadProjectEnvConfig(projectName),
    memories: {
      dba:      readFile(path.join(memoriesPath, "memory-dba.md")),
      backend:  readFile(path.join(memoriesPath, "memory-backend.md")),
      frontend: readFile(path.join(memoriesPath, "memory-frontend.md")),
      tester:   readFile(path.join(memoriesPath, "memory-tester.md")),
      docs:     readFile(path.join(memoriesPath, "memory-docs.md")),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// SKILLS
// ─────────────────────────────────────────────────────────────

function loadSkills(agent: AgentName, projectName: string): string {
  const skillMap: Partial<Record<AgentName, string[]>> = {
    backend:  ["dotnet/endpoint-structure.md", "dotnet/unit-test-xunit.md", "dotnet/json-entity-framework.md", "dotnet/soft-delete.md"],
    frontend: ["vue3/component-structure.md", "vue3/api-service.md"],
    dba:      ["postgres/stored-procedure.md", "postgres/migration.md"],
    tester:   ["dotnet/unit-test-xunit.md"],
  };

  let skills = "";

  for (const f of skillMap[agent] ?? []) {
    const base = readFile(path.join(AGENTS_ROOT, "skills", f));
    if (base) skills += `\n\n---\n${base}`;

    const override = readFile(path.join(AGENTS_ROOT, "projects-memories", projectName, "skills", path.basename(f)));
    if (override) skills += `\n\n---\n[OVERRIDE DEL PROYECTO]\n${override}`;
  }

  return skills;
}

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(agent: AgentName, project: ProjectContext): string {
  const role        = readFile(path.join(AGENTS_ROOT, "roles", `${agent}.md`));
  const conventions = readFile(path.join(AGENTS_ROOT, "conventions.md"));
  const skills      = loadSkills(agent, project.name);
  const memory      = project.memories[agent] ?? "";
  const env         = project.envConfig;

  // Repo específico del agente
  const repoMap: Partial<Record<AgentName, string>> = {
    dba:      env.db,
    backend:  env.back,
    frontend: env.front,
    tester:   env.test,
  };
  const agentRepo = repoMap[agent] ?? "";

  // Postgres solo para DBA y Tester
  const postgresConn = ["dba", "tester"].includes(agent) ? env.postgres : "";

  return [
    role,
    `\n\nCONVENCIONES DEL EQUIPO:\n${conventions}`,
    `\n\nCONTEXTO DEL PROYECTO: ${project.name}\n${project.context}`,
    agentRepo    ? `\nTu repo en este proyecto: ${agentRepo}`  : "",
    postgresConn ? `\nConexión BD: ${postgresConn}`            : "",
    project.tasks ? `\n\nTAREAS ACTUALES:\n${project.tasks}`  : "",
    memory        ? `\n\nTU MEMORIA PREVIA:\n${memory}`        : "",
    skills        ? `\n\nSKILLS:\n${skills}`                   : "",
  ].join("").trim();
}

// ─────────────────────────────────────────────────────────────
// AGENT RUNNER
// ─────────────────────────────────────────────────────────────

export async function runAgent(
  agent:       AgentName,
  task:        string,
  projectName: string
): Promise<string> {
  const config  = AGENT_CONFIGS[agent];
  const project = loadProjectContext(projectName);
  const system  = buildSystemPrompt(agent, project);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`🤖 [${agent.toUpperCase()}] modelo: ${config.model}`);
  console.log(`📋 ${task}`);
  console.log(`${"─".repeat(60)}`);

  const provider = await createProvider(config.model);
  const result   = await provider.generate(system, task);

  console.log(`✅ Tokens — entrada: ${result.inputTokens} | salida: ${result.outputTokens}`);

  await updateMemoryIfPresent(agent, project.rootPath, result.text);

  return result.text;
}

// ─────────────────────────────────────────────────────────────
// MEMORY UPDATER
// ─────────────────────────────────────────────────────────────

async function updateMemoryIfPresent(
  agent:    AgentName,
  rootPath: string,
  response: string
): Promise<void> {
  const match = response.match(/\[MEMORY_UPDATE\]([\s\S]*?)\[\/MEMORY_UPDATE\]/);
  if (!match) return;

  const memoryPath = path.join(rootPath, `memory-${agent}.md`);
  const existing   = readFile(memoryPath);
  const updated    = existing
    ? `${existing}\n\n---\n${match[1].trim()}`
    : match[1].trim();

  writeFile(memoryPath, updated);
  console.log(`💾 Memoria actualizada: memory-${agent}.md`);
}

// ─────────────────────────────────────────────────────────────
// ORQUESTADOR
// ─────────────────────────────────────────────────────────────

export async function orchestrate(
  instruction: string,
  projectName: string,
  agent?:      AgentName
): Promise<void> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎯 Proyecto: ${projectName}`);
  console.log(`📝 ${instruction}`);
  console.log(`${"═".repeat(60)}`);

  if (agent) {
    const result = await runAgent(agent, instruction, projectName);
    console.log(`\n✅ Resultado:\n${result}`);
    return;
  }

  console.log("\n🔀 Consultando al Scrum Master...\n");

  const scrumResponse = await runAgent("scrum", `
    Instrucción: "${instruction}"
    Lee tasks.json y responde SOLO con JSON sin markdown:
    {
      "agente": "dba|backend|frontend|tester|docs|po",
      "tarea_id": "T001",
      "descripcion": "descripción exacta",
      "bloqueado": false,
      "motivo_bloqueo": null
    }
  `, projectName);

  try {
    const decision = JSON.parse(scrumResponse.match(/\{[\s\S]*\}/)?.[0] ?? "{}");

    if (decision.bloqueado) {
      console.log(`\n🚫 Bloqueado: ${decision.motivo_bloqueo}`);
      return;
    }

    if (!decision.agente) {
      console.log("\n⚠️  Scrum no pudo determinar el agente:\n", scrumResponse);
      return;
    }

    console.log(`\n📌 → ${decision.agente.toUpperCase()}: ${decision.descripcion}`);
    const result = await runAgent(decision.agente as AgentName, decision.descripcion, projectName);
    console.log(`\n✅ Resultado:\n${result}`);

  } catch {
    console.log("\n⚠️  No se pudo parsear la respuesta del Scrum:\n", scrumResponse);
  }
}

// ─────────────────────────────────────────────────────────────
// CLI
// npx ts-node orchestrator/orchestrator.ts <proyecto> "<instruccion>" [agente]
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const [,, projectName, instruction, agentArg] = process.argv;

  if (!projectName || !instruction) {
    console.log("Uso:");
    console.log("  npx ts-node orchestrator/orchestrator.ts <proyecto> \"<instruccion>\" [agente]");
    console.log("\nEjemplos:");
    console.log("  npx ts-node orchestrator/orchestrator.ts escolar \"Qué sigue en el proyecto\"");
    console.log("  npx ts-node orchestrator/orchestrator.ts escolar \"Crea la tabla alumnos\" dba");
    process.exit(1);
  }

  orchestrate(instruction, projectName, agentArg as AgentName | undefined)
    .catch(err => { console.error("❌", err.message); process.exit(1); });
}
