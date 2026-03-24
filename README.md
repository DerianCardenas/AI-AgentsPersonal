# AI-Agents

> A structured guide to build and orchestrate a complete AI-powered software development team using specialized agents, MCP tools, skills, contracts, and shared memory across projects.

Stop prompting AI one task at a time. This repo gives you a **reusable team of specialized agents** — each with a defined role, technical skills, tools, memory, and conventions — that work together to design, build, test, and document software projects.

---

## Who is this for?

- Developers who want to automate repetitive dev tasks with AI
- Teams exploring multi-agent workflows for real projects
- Anyone building with Claude, GPT, or Gemini APIs
- Developers tired of re-explaining context to AI on every session

---

## The idea

Most people use AI as a single assistant. This repo treats AI as a **team**:

```
You describe what to build
        ↓
PO defines User Stories and acceptance criteria
        ↓
Scrum Master coordinates the team, manages tasks.json (your Jira)
        ↓
DBA designs the database schema
        ↓
Backend proposes API contracts → Frontend agrees → both code in parallel
        ↓
Frontend advances with mock data while Backend implements
        ↓
Tester runs E2E once both are done
        ↓
DocGen documents everything approved by Tester
```

Each agent has **one responsibility**, reads **its own skills** before every task, follows **shared conventions**, and updates **its own memory** at the end.

---

## Key concepts

### 1. Agents are reusable across projects
The agent is the **specialization**. The project context is **swappable**:
```
Backend Agent + context of Project A  →  works on Project A
Backend Agent + context of Project B  →  works on Project B
```

### 2. Skills teach agents HOW to do things well
Roles define who the agent is. Skills define the quality standard:
```
roles/backend.md               →  who the agent is
skills/dotnet/endpoint.md      →  how a good endpoint looks
```
Skills are organized by stack — reusable across all projects on that technology.
Projects can override base skills in `projects-memories/{project}/skills/`.

### 3. Contracts prevent integration surprises
Backend and Frontend agree on the API format **before anyone codes**:
```
Backend proposes contract (status: draft)
Frontend reviews and agrees (status: agreed)
Both code in parallel — Frontend uses mock data from the contract
When Backend finishes → Frontend swaps mock for real call
```

### 4. tasks.json is your Jira
Each User Story has tasks per agent with dependencies, contracts, branch, and status.
The Scrum Master creates and manages it automatically.

### 5. Memory persists between sessions
Each agent maintains its own memory file per project — no more re-explaining what was already built.

---

## The team

| Agent | Role | Repo | Model |
|---|---|---|---|
| **PO** | Defines User Stories and acceptance criteria | — | opus |
| **Scrum Master** | Coordinates team, manages tasks.json, detects blockers | All (read) | opus |
| **DBA** | Designs schemas and versioned migrations | `db-repo/` | sonnet |
| **Backend** | Implements APIs and business logic | `back-repo/` | sonnet |
| **Frontend** | Builds UI, consumes API, uses contracts | `front-repo/` | sonnet |
| **Tester** | Runs E2E and regression tests | `test-repo/` | haiku |
| **DocGen** | Documents what Tester approved | `*/docs/` | haiku |

---

## Repository structure

```
agents/
│
├── .env.example                  # Environment variables template
├── conventions.md                # Branches, commits, naming — all agents follow this
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript config
│
├── roles/                        # Who each agent is and how they work
│   ├── po.md
│   ├── scrum.md
│   ├── dba.md
│   ├── backend.md
│   ├── frontend.md
│   ├── tester.md
│   └── docs.md
│
├── skills/                       # How to do things well — organized by stack
│   ├── README.md
│   ├── dotnet/
│   │   ├── endpoint-structure.md
│   │   ├── unit-test-xunit.md
│   │   ├── json-entity-framework.md
│   │   └── soft-delete.md
│   ├── vue3/
│   │   ├── component-structure.md
│   │   └── api-service.md
│   └── postgres/
│       ├── stored-procedure.md
│       └── migration.md
│
├── prompts/                      # Reusable instruction templates (built from usage)
│   └── README.md
│
├── projects-memories/            # Context, memory, tasks and contracts per project
│   ├── context_example.md        # Copy this to start a new project
│   ├── contracts_README.md       # How contracts work
│   └── {project-name}/
│       ├── context.md            # Stack, rules, entities — YOU fill this
│       ├── tasks.json            # Your Jira — Scrum Master manages this
│       ├── progress.json         # Real project status — Scrum Master manages this
│       ├── contracts/
│       │   ├── README.md
│       │   └── {METHOD}_{resource}.json
│       ├── memory-dba.md
│       ├── memory-backend.md
│       ├── memory-frontend.md
│       ├── memory-tester.md
│       ├── memory-docs.md
│       └── skills/               # Optional project-specific skill overrides
│
├── mcp/                          # MCP server configuration
│   ├── config.json               # All available servers — replace placeholders
│   ├── README.md
│   └── custom/
│       └── README.md
│
└── orchestrator/                 # Coordinates the agents
    ├── orchestrator.ts           # Full orchestrator (your private repo)
    └── orchestrator.example.ts   # Simplified example (public reference)
```

---

## Setup

### 1. Clone this repo
```bash
git clone https://github.com/your-username/AI-Agents.git
cd AI-Agents
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# At least one LLM provider is required
ANTHROPIC_API_KEY=your_key_here

# MCP: GitHub Personal Access Token
# github.com → Settings → Developer settings → Personal access tokens
# Required scopes: repo, read:org
GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here

# MCP: Brave Search (free plan: 2,000 queries/month)
# brave.com/search/api
BRAVE_API_KEY=your_key_here

# MCP: PostgreSQL connection string
POSTGRES_CONNECTION_STRING=postgresql://user:pass@localhost:5432/dbname

# Absolute paths on your machine
PROJECTS_ROOT=/home/your-user/projects
AGENTS_ROOT=/home/your-user/agents
```

### 4. Create your project context
```bash
cp projects-memories/context_example.md projects-memories/{your-project}/context.md
mkdir projects-memories/{your-project}/contracts
```
Fill in `context.md` with your stack, project initials (used in commits), repo paths, business rules, and main entities.

### 5. Run the orchestrator
```bash
# Let Scrum Master decide what to do next
npx ts-node orchestrator/orchestrator.example.ts my-project "What should we work on next?"

# Run a specific agent directly
npx ts-node orchestrator/orchestrator.example.ts my-project "Create the alumnos table" dba
npx ts-node orchestrator/orchestrator.example.ts my-project "Implement GET /alumnos endpoint" backend
```

---

## Conventions

All agents follow the same conventions defined in `conventions.md`.

### Branches
```
feat-HU{number}
Examples: feat-HU001  feat-HU015
```

### Commits
```
{PROJECT_INITIALS}{commit_number} | {Short description}
Examples:
  ESC01 | Alumnos table migration created
  SF03  | Income endpoint implemented
```
Project initials are defined in each project's `context.md`.

---

## Dependency flow — never broken

```
PO  →  DBA  →  Backend  →  Frontend  →  Tester  →  DocGen
                    ↕ contracts ↕
              (agreed before coding)
```

Frontend never waits idle for Backend — it advances using contract mock data.

---

## Testing responsibilities

| Test type | Responsible | Location |
|---|---|---|
| Unit tests | Backend | `back-repo/tests/unit/` |
| Unit tests | Frontend | `front-repo/tests/unit/` |
| Integration | Frontend | `front-repo/tests/integration/` |
| E2E | Tester | `test-repo/e2e/` |
| Regression | Tester | `test-repo/regression/` |

> Tester does **not** run E2E until Backend and Frontend have passed their own tests.

---

## Skills — base stacks covered

| Stack | Skills |
|---|---|
| .NET 8 / C# | Endpoint structure · xUnit tests · EF JSON mapping · Soft delete |
| Vue 3 / TypeScript / Tailwind | Component with states · API service + Pinia |
| PostgreSQL | Stored procedures · Versioned migrations |

Projects can override any base skill in `projects-memories/{project}/skills/`.

---

## What you need

- Node.js 18+
- API Key from at least one provider:
  - [Anthropic (Claude)](https://console.anthropic.com/) ← recommended
  - [OpenAI (GPT)](https://platform.openai.com/)
  - [Google (Gemini)](https://aistudio.google.com/)
- Optional: GitHub token, Brave Search API key (for full MCP support)

> **Note:** Claude Pro / ChatGPT Plus subscriptions ≠ API Keys.
> To use agents programmatically you need the **API Key** from the developer console.

---

## Public vs private repo

| | Public repo (this one) | Your private repo |
|---|---|---|
| **Contains** | Roles, skills, examples, templates | Your real tokens, contexts, memories |
| **.env** | `.env.example` only | `.env` with real values |
| **tasks.json** | `tasks.example.json` | Your real tasks |
| **orchestrator** | `orchestrator.example.ts` | `orchestrator.ts` configured |
| **context.md** | `context_example.md` | Your real project contexts |

Fork or copy this repo to your private one and fill in the real values.

---

## Roadmap

| Component | Status |
|---|---|
| `roles/` |  7 agents defined |
| `skills/` |  .NET · Vue 3 · PostgreSQL |
| `conventions.md` |  Branches · commits · naming |
| `prompts/` |  Built from real usage |
| `projects-memories/` |  Template + contracts system |
| `mcp/` |  Config + custom server guide |
| `orchestrator/` |  Example ready — configure in private repo |
| `agents/*.ts` |  Individual agent wrappers |

---

## License

MIT — see [LICENSE](./LICENSE) for details.
