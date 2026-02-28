import { LlmAgent, ParallelAgent, InMemoryRunner, EventType } from '@google/adk';
import { Gemini } from '@google/adk';
// simulate env for test
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyA-fake-key-just-for-syntax-pass';

async function main() {
  const model = new Gemini({ model: 'gemini-2.5-flash', apiKey: process.env.GEMINI_API_KEY });
  const agent1 = new LlmAgent({ name: 'Summ', model, instruction: 'Say ONE.' });
  const agent2 = new LlmAgent({ name: 'Proto', model, instruction: 'Say TWO.' });

  const parallel = new ParallelAgent({ name: 'Orchestrator', agents: [agent1, agent2] });

  const runner = new InMemoryRunner({ agent: parallel });
  const events = runner.runEphemeral({ userId: 'u', newMessage: { role: 'user', parts: [{ text: 'Go' }] } });

  try {
    for await (const event of events) {
      if (event.type === EventType.CONTENT) {
         console.log('CONTENT EVENT author:', (event as any).author, 'text:', (event as any).content?.parts?.[0]?.text);
      }
    }
  } catch (e) {
    console.log('Got expected API error (invalid key)', e.message);
  }
}
main();
