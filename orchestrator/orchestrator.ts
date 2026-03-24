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

interface ProjectContext {
  name:     string;
  rootPath: string;
  context:  string;
  tasks?:   string;
  memories: Partial<Record<AgentName, string>>;
  repos: {
    back?:  string;
    front?: string;
    db?:    string;
    test?:  string;
  };
}

interface RunResult {
  agent:    AgentName;
  task:     string;
  response: string;
  success:  boolean;
}

// ─────────────────────────────────────────────────────────────
// CONFIGURACIÓN DE AGENTES
// Modelo y MCPs asignados a cada agente
// ─────────────────────────────────────────────────────────────

const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  po: {
    model:    "claude-opus-4-5",
    mcpTools: ["brave-search"],
  },
  scrum: {
    model:    "claude-opus-4-5",
    mcpTools: ["filesystem"],
  },
  dba: {
    model:    "claude-sonnet-4-5",
    mcpTools: ["filesystem", "postgres", "git", "github"],
  },
  backend: {
    model:    "claude-sonnet-4-5",
    mcpTools: ["filesystem", "git", "github", "brave-search"],
  },
  frontend: {
    model:    "claude-sonnet-4-5",
    mcpTools: ["filesystem", "git", "github", "brave-search"],
  },
  tester: {
    model:    "claude-haiku-4-5",
    mcpTools: ["filesystem", "git", "github", "postgres"],
  },
  docs: {
    model:    "claude-haiku-4-5",
    mcpTools: ["filesystem", "git", "github"],
  },
};

// ─────────────────────────────────────────────────────────────
// PATHS BASE
// ─────────────────────────────────────────────────────────────

const AGENTS_ROOT   = process.env.AGENTS_ROOT   ?? path.resolve(__dirname, "..");
const PROJECTS_ROOT = process.env.PROJECTS_ROOT ?? path.resolve(__dirname, "../../projects");

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function writeFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function loadRole(agent: AgentName): string {
  const rolePath = path.join(AGENTS_ROOT, "roles", `${agent}.md`);
  const role = readFile(rolePath);
  if (!role) throw new Error(`Rol no encontrado: ${rolePath}`);
  return role;
}

function loadSkills(agent: AgentName, projectName: string): string {
  const skillMap: Partial<Record<AgentName, string[]>> = {
    backend:  ["dotnet/endpoint-structure.md", "dotnet/unit-test-xunit.md", "dotnet/json-entity-framework.md", "dotnet/soft-delete.md"],
    frontend: ["vue3/component-structure.md", "vue3/api-service.md"],
    dba:      ["postgres/stored-procedure.md", "postgres/migration.md"],
    tester:   ["dotnet/unit-test-xunit.md"],
  };

  const baseSkills = skillMap[agent] ?? [];
  let skillsContent = "";

  // 1. Cargar skills base del stack
  for (const skillFile of baseSkills) {
    const skillPath = path.join(AGENTS_ROOT, "skills", skillFile);
    const content = readFile(skillPath);
    if (content) skillsContent += `\n\n---\n${content}`;
  }

  // 2. Cargar overrides del proyecto (si existen)
  for (const skillFile of baseSkills) {
    const overridePath = path.join(
      AGENTS_ROOT, "projects-memories", projectName, "skills",
      path.basename(skillFile)
    );
    const override = readFile(overridePath);
    if (override) skillsContent += `\n\n---\n[OVERRIDE DEL PROYECTO]\n${override}`;
  }

  return skillsContent;
}

function loadConventions(): string {
  return readFile(path.join(AGENTS_ROOT, "conventions.md"));
}

function loadProjectContext(projectName: string): ProjectContext {
  const memoriesPath = path.join(AGENTS_ROOT, "projects-memories", projectName);

  const contextContent = readFile(path.join(memoriesPath, "context.md"));
  if (!contextContent) {
    throw new Error(`context.md no encontrado para el proyecto: ${projectName}`);
  }

  // Extraer rutas de repos desde context.md (formato: "back-repo: ~/projects/...")
  const extractRepo = (key: string): string | undefined => {
    const match = contextContent.match(new RegExp(`${key}:\\s*(.+)`));
    return match?.[1]?.trim().replace("~", process.env.HOME ?? "");
  };

  return {
    name:     projectName,
    rootPath: memoriesPath,
    context:  contextContent,
    tasks:    readFile(path.join(memoriesPath, "tasks.json")),
    memories: {
      dba:      readFile(path.join(memoriesPath, "memory-dba.md")),
      backend:  readFile(path.join(memoriesPath, "memory-backend.md")),
      frontend: readFile(path.join(memoriesPath, "memory-frontend.md")),
      tester:   readFile(path.join(memoriesPath, "memory-tester.md")),
      docs:     readFile(path.join(memoriesPath, "memory-docs.md")),
    },
    repos: {
      back:  extractRepo("back-repo"),
      front: extractRepo("front-repo"),
      db:    extractRepo("db-repo"),
      test:  extractRepo("test-repo"),
    },
  };
}

function buildSystemPrompt(agent: AgentName, project: ProjectContext): string {
  const role        = loadRole(agent);
  const skills      = loadSkills(agent, project.name);
  const conventions = loadConventions();
  const memory      = project.memories[agent] ?? "";

  const repoForAgent: Partial<Record<AgentName, string | undefined>> = {
    dba:      project.repos.db,
    backend:  project.repos.back,
    frontend: project.repos.front,
    tester:   project.repos.test,
  };

  const agentRepo = repoForAgent[agent];

  return `
${role}

═══════════════════════════════════════
CONVENCIONES DEL EQUIPO
═══════════════════════════════════════
${conventions}

═══════════════════════════════════════
CONTEXTO DEL PROYECTO: ${project.name}
═══════════════════════════════════════
${project.context}

${agentRepo ? `Tu repo en este proyecto: ${agentRepo}` : ""}

${project.tasks ? `Estado actual de tareas:\n${project.tasks}` : ""}

${memory ? `\nTu memoria de sesiones anteriores:\n${memory}` : ""}

${skills ? `\n═══════════════════════════════════════\nSKILLS — Lee esto antes de ejecutar tu tarea\n═══════════════════════════════════════${skills}` : ""}
`.trim();
}

// ─────────────────────────────────────────────────────────────
// AGENT RUNNER
// Ejecuta un agente y maneja el loop de tool use
// ─────────────────────────────────────────────────────────────

export async function runAgent(
  agent:       AgentName,
  task:        string,
  projectName: string
): Promise<RunResult> {
  const client  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const config  = AGENT_CONFIGS[agent];
  const project = loadProjectContext(projectName);
  const system  = buildSystemPrompt(agent, project);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`🤖 Agente: ${agent.toUpperCase()} | Proyecto: ${projectName}`);
  console.log(`📋 Tarea: ${task}`);
  console.log(`${"─".repeat(60)}\n`);

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: task }
  ];

  let finalResponse = "";
  let iterations    = 0;
  const MAX_ITER    = 10; // límite de seguridad

  while (iterations < MAX_ITER) {
    iterations++;

    const response = await client.messages.create({
      model:      config.model,
      max_tokens: 8096,
      system,
      messages,
    });

    console.log(`🔄 Iteración ${iterations} | stop_reason: ${response.stop_reason}`);

    // Si terminó — devolvemos la respuesta final
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find(b => b.type === "text");
      finalResponse   = textBlock?.type === "text" ? textBlock.text : "";
      break;
    }

    // Si quiere usar una tool — la procesamos y continuamos el loop
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;

        console.log(`  🔧 Tool: ${block.name}`);
        const result = await executeTool(block.name, block.input as Record<string, unknown>, project);
        console.log(`  ✅ Resultado: ${String(result).slice(0, 100)}...`);

        toolResults.push({
          type:        "tool_result",
          tool_use_id: block.id,
          content:     String(result),
        });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  // Guardar la memoria actualizada si el agente la incluyó en su respuesta
  await updateMemoryIfPresent(agent, projectName, finalResponse, project.rootPath);

  return {
    agent,
    task,
    response: finalResponse,
    success:  finalResponse.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────
// TOOL EXECUTOR
// Aquí se conectan los MCPs — por ahora implementación básica
// El orquestador real usa el MCP SDK para conectarse a los servers
// ─────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  input:    Record<string, unknown>,
  project:  ProjectContext
): Promise<string> {
  switch (toolName) {
    case "read_file": {
      const filePath = String(input.path);
      return readFile(filePath) || `Archivo no encontrado: ${filePath}`;
    }
    case "list_directory": {
      const dirPath = String(input.path);
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        return entries.map(e => `${e.isDirectory() ? "[DIR]" : "[FILE]"} ${e.name}`).join("\n");
      } catch {
        return `Directorio no encontrado: ${dirPath}`;
      }
    }
    case "write_file": {
      const filePath = String(input.path);
      const content  = String(input.content);
      writeFile(filePath, content);
      return `Archivo escrito: ${filePath}`;
    }
    default:
      return `Tool '${toolName}' no implementada en este runner. Configura el MCP server correspondiente.`;
  }
}

// ─────────────────────────────────────────────────────────────
// MEMORY UPDATER
// Extrae y guarda la memoria si el agente la incluyó
// ─────────────────────────────────────────────────────────────

async function updateMemoryIfPresent(
  agent:     AgentName,
  project:   string,
  response:  string,
  rootPath:  string
): Promise<void> {
  // El agente incluye su memoria entre marcadores [MEMORY_UPDATE]...[/MEMORY_UPDATE]
  const match = response.match(/\[MEMORY_UPDATE\]([\s\S]*?)\[\/MEMORY_UPDATE\]/);
  if (!match) return;

  const memoryPath = path.join(rootPath, `memory-${agent}.md`);
  const existing   = readFile(memoryPath);
  const updated    = existing
    ? `${existing}\n\n---\n${match[1].trim()}`
    : match[1].trim();

  writeFile(memoryPath, updated);
  console.log(`\n💾 Memoria actualizada: memory-${agent}.md`);
}

// ─────────────────────────────────────────────────────────────
// ORQUESTADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────

export async function orchestrate(
  instruction: string,
  projectName: string,
  agent?:      AgentName
): Promise<void> {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`🎯 ORQUESTADOR | Proyecto: ${projectName}`);
  console.log(`📝 Instrucción: ${instruction}`);
  console.log(`${"═".repeat(60)}`);

  // Si se especifica un agente directamente, lo ejecuta
  if (agent) {
    const result = await runAgent(agent, instruction, projectName);
    console.log(`\n✅ Resultado:\n${result.response}`);
    return;
  }

  // Si no, el Scrum Master decide qué agente ejecutar
  console.log("\n🔀 Delegando al Scrum Master para determinar el siguiente paso...\n");

  const scrumTask = `
    Instrucción recibida: "${instruction}"

    Lee el tasks.json del proyecto y determina:
    1. Qué tarea corresponde a esta instrucción
    2. Qué agente debe ejecutarla
    3. Si tiene dependencias pendientes que la bloqueen

    Responde SOLO con un JSON:
    {
      "agente": "dba|backend|frontend|tester|docs|po",
      "tarea_id": "T001",
      "descripcion": "descripción exacta de la tarea",
      "bloqueado": false,
      "motivo_bloqueo": null
    }
  `;

  const scrumResult = await runAgent("scrum", scrumTask, projectName);

  try {
    const decision = JSON.parse(
      scrumResult.response.match(/\{[\s\S]*\}/)?.[0] ?? "{}"
    );

    if (decision.bloqueado) {
      console.log(`\n🚫 Tarea bloqueada: ${decision.motivo_bloqueo}`);
      return;
    }

    if (!decision.agente) {
      console.log("\n⚠️ El Scrum Master no pudo determinar el agente. Revisa tasks.json.");
      return;
    }

    console.log(`\n📌 Scrum asigna a: ${decision.agente.toUpperCase()} → ${decision.descripcion}`);

    const result = await runAgent(
      decision.agente as AgentName,
      decision.descripcion,
      projectName
    );

    console.log(`\n✅ Resultado:\n${result.response}`);

  } catch {
    console.log("\n⚠️ No se pudo parsear la respuesta del Scrum Master:");
    console.log(scrumResult.response);
  }
}

// ─────────────────────────────────────────────────────────────
// CLI — Ejecución directa
// Uso: npx ts-node orchestrator/orchestrator.ts <proyecto> <instrucción> [agente]
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const [,, projectName, instruction, agentArg] = process.argv;

  if (!projectName || !instruction) {
    console.log("Uso: npx ts-node orchestrator/orchestrator.ts <proyecto> <instruccion> [agente]");
    console.log("Ejemplo: npx ts-node orchestrator/orchestrator.ts escolar 'Crea la tabla alumnos' dba");
    process.exit(1);
  }

  orchestrate(instruction, projectName, agentArg as AgentName | undefined)
    .catch(err => {
      console.error("Error:", err.message);
      process.exit(1);
    });
}
