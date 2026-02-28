import { LlmAgent, ParallelAgent, InMemoryRunner } from '@google/adk';

async function main() {
  const agent1 = new LlmAgent({
    name: 'agent1',
    model: 'gemini-2.5-flash',
    instruction: 'Reply with the word ONE and nothing else.',
  });

  const agent2 = new LlmAgent({
    name: 'agent2',
    model: 'gemini-2.5-flash',
    instruction: 'Reply with the word TWO and nothing else.',
  });

  const parallel = new ParallelAgent({
    name: 'parallel',
    agents: [agent1, agent2]
  });

  const runner = new InMemoryRunner();
  const res = await runner.run(parallel, 'Hello');
  console.log(JSON.stringify(res, null, 2));
}
main().catch(console.error);
