import { runAgent } from "../orchestrator/orchestrator";

export async function run(task: string, projectName: string): Promise<string> {
  return await runAgent("dba", task, projectName);
}
